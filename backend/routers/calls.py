from typing import List
from fastapi import APIRouter, HTTPException
from db.supabase_client import get_supabase
from models.schemas import CallStartRequest, CallOut
from services.retell import RetellService
from services.postprocess import generate_structured_summary
import uuid
from datetime import datetime, timezone
from pydantic import ValidationError


router = APIRouter()


CALLS_TABLE = "calls"


@router.get("/", response_model=List[CallOut])
def list_calls():
    sb = get_supabase()
    resp = sb.table(CALLS_TABLE).select("*").order("started_at", desc=True).execute()
    return resp.data or []


@router.get("/{call_id}", response_model=CallOut)
def get_call(call_id: str):
    sb = get_supabase()
    resp = sb.table(CALLS_TABLE).select("*").eq("id", call_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Call not found")
    return resp.data


@router.post("/start", response_model=CallOut)
def start_call(req: CallStartRequest):
    sb = get_supabase()

    # Validate agent exists in Retell (no longer from DB)
    service = RetellService()

    cfg = sb.table("agent_configs").select("*").eq("id", req.agent_config_id).single().execute()
    print("cfg->  ", cfg.data)
    if not cfg.data:
        raise HTTPException(status_code=404, detail="Agent config not found")
    try:
        agent = service.get_agent(cfg.data.get("agent_id"))
    except Exception:
        # Avoid leaking upstream error details
        raise HTTPException(status_code=404, detail="Agent not found")
    print("agent->  ", agent)
    call_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "id": call_id,
        "driver_name": req.driver_name,
        "load_number": req.load_number,
        "agent_config_id": req.agent_config_id,
        "driver_status": "Not Joined",
        "status": "queued",
        "started_at": now,
    }
    sb.table(CALLS_TABLE).insert(row).execute()

    # Trigger Retell web call
    try:
        outbound_call = service.start_web_call(
            agent_id=cfg.data.get("agent_id"),
            driver_name=req.driver_name,
            load_number=req.load_number,
            metadata={"call_id": call_id},
        )
        sb.table(CALLS_TABLE).update({"status": "not_joined", "retell_call_id": outbound_call.get("call_id"), "retell_call_access_token": outbound_call.get("access_token")}).eq("id", call_id).execute()
        row.update({"status": "not_joined", "retell_call_id": outbound_call.get("call_id"), "retell_call_access_token": outbound_call.get("access_token")})
    except Exception:
        sb.table(CALLS_TABLE).update({"status": "failed"}).eq("id", call_id).execute()
        raise HTTPException(status_code=502, detail="Failed to start call")

    return row


@router.post("/{call_id}/refresh", response_model=CallOut)
def refresh_summary(call_id: str):
    sb = get_supabase()
    resp = sb.table(CALLS_TABLE).select("transcript").eq("id", call_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Call not found")
    transcript = resp.data.get("transcript") or []
    summary = generate_structured_summary(transcript)
    upd = sb.table(CALLS_TABLE).update({"summary": summary}).eq("id", call_id).execute()
    return upd.data[0]


