from fastapi import APIRouter, Request
from db.supabase_client import get_supabase
from services.postprocess import generate_structured_summary
from datetime import datetime, timezone


router = APIRouter()


CALLS_TABLE = "calls"


@router.post("/retell")
async def retell_webhook(req: Request):
    body = await req.json()
    event_type = body.get("type") or body.get("event")
    retell_call_id = body.get("id") or body.get("call_id")
    metadata = body.get("metadata", {})
    call_id = metadata.get("call_id")
    sb = get_supabase()

    if event_type in ("call.started", "call_queued"):
        if call_id:
            sb.table(CALLS_TABLE).update({"status": "in_progress", "retell_call_id": retell_call_id}).eq("id", call_id).execute()
        return {"ok": True}

    if event_type in ("transcript.delta", "transcript.updated"):
        # Append transcript messages if provided
        messages = body.get("messages") or body.get("payload", {}).get("messages") or []
        if call_id and messages:
            # Fetch current transcript
            current = sb.table(CALLS_TABLE).select("transcript").eq("id", call_id).single().execute()
            transcript = current.data.get("transcript") or []
            transcript.extend(messages)
            sb.table(CALLS_TABLE).update({"transcript": transcript}).eq("id", call_id).execute()
        return {"ok": True}

    if event_type in ("call.completed", "call_ended"):
        completed_at = datetime.now(timezone.utc).isoformat()
        if call_id:
            rec = sb.table(CALLS_TABLE).select("transcript").eq("id", call_id).single().execute()
            transcript = rec.data.get("transcript") or []
            summary = generate_structured_summary(transcript)
            sb.table(CALLS_TABLE).update(
                {"status": "completed", "completed_at": completed_at, "summary": summary}
            ).eq("id", call_id).execute()
        return {"ok": True}

    # Unknown events: acknowledge
    return {"ok": True}


