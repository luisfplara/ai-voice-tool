import json
from fastapi import APIRouter, Request, HTTPException
from db.supabase_client import get_supabase
from services.postprocess import generate_structured_summary
from datetime import datetime, timezone
from services.retell import RetellService


router = APIRouter()


CALLS_TABLE = "calls"


@router.post("/retell")
async def retell_webhook(req: Request):
    body = await req.json()

    event_type = body.get("event")
  
    if event_type == "call_analyzed":
        print("retell webhook call_analyzed:", json.dumps(body, indent=2))
        retell_call_id = (body.get("call") or {}).get("call_id") or body.get("call_id")

        if not retell_call_id:
            raise HTTPException(status_code=400, detail="Missing retell call id in webhook payload")


        try:
            call_data = body.get("call")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch call from Retell: {e}")
   
        sb = get_supabase()

        # Prefer our internal id via Retell metadata if present
        our_call_id = (call_data.get("metadata") or {}).get("call_id")

        # Locate the row
        if our_call_id:
            cur = sb.table(CALLS_TABLE).select("id, summary").eq("id", our_call_id).single().execute()
        else:
            cur = sb.table(CALLS_TABLE).select("id, summary").eq("retell_call_id", retell_call_id).single().execute()

        if not cur.data:
            # If we cannot find, nothing to update
            raise HTTPException(status_code=404, detail="Local call not found for webhook")


        updates = {"retell_call_id": retell_call_id}

        # Map status
        status = call_data.get("call_status")
        if status:
            status_map = {
                "registered": "in_progress",
                "ongoing": "in_progress",
                "ended": "completed",
                "failed": "failed",
            }
            updates["status"] = status_map.get(status, status)

        # Timestamps
        start_ts = call_data.get("start_timestamp")
        if start_ts:
            updates.setdefault("started_at", datetime.fromtimestamp(start_ts / 1000, tz=timezone.utc).isoformat())
        end_ts = call_data.get("end_timestamp")
        if end_ts:
            updates["completed_at"] = datetime.fromtimestamp(end_ts / 1000, tz=timezone.utc).isoformat()

        # Transcript (object -> array of role/text)
        transcript_obj = call_data.get("transcript_object") or []
        if transcript_obj:
            tx = [{"role": t.get("role"), "text": t.get("content"), "timestamp": None} for t in transcript_obj]
            updates["transcript"] = tx

        # Access token if provided (useful for web call)
        if call_data.get("access_token"):
            updates["retell_call_access_token"] = call_data.get("access_token")

        # Build summary augmentation with relevant fields
        existing_summary = cur.data.get("summary") or {}
        extra = {
        "agent_id": call_data.get("agent_id"),
        "agent_version": call_data.get("agent_version"),
        "agent_name": call_data.get("agent_name"),
        "retell_llm_dynamic_variables": call_data.get("retell_llm_dynamic_variables"),
        "collected_dynamic_variables": call_data.get("collected_dynamic_variables"),
        "recording_url": call_data.get("recording_url"),
        "public_log_url": call_data.get("public_log_url"),
        "disconnection_reason": call_data.get("disconnection_reason"),
        "latency": call_data.get("latency"),
        "call_analysis": call_data.get("call_analysis"),
        "call_cost": call_data.get("call_cost"),
        "transcript_text": call_data.get("transcript"),
    }
        merged_summary = {**existing_summary, **{k: v for k, v in extra.items() if v is not None}}
        updates["summary"] = merged_summary
        driver_status = call_data.get("collected_dynamic_variables" or {}).get("driver_status")
        if driver_status:
            updates["driver_status"] = driver_status
        sb.table(CALLS_TABLE).update(updates).eq("id", cur.data["id"]).execute()

        # Optionally regenerate our structured summary using latest transcript
        if updates.get("transcript"):
            try:
                struct = generate_structured_summary(updates["transcript"])  # type: ignore[arg-type]
                sb.table(CALLS_TABLE).update({"summary": {**merged_summary, "structured": struct}}).eq("id", cur.data["id"]).execute()
            except Exception:
                pass

    return {"ok": True}



