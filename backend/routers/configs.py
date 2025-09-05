from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict, List, Optional
from services.retell import RetellService
from db.supabase_client import get_supabase
import uuid
from models.schemas import AgentRecord, AgentCreateRequest, RetellAgentOut, ConversationFlowPayload


router = APIRouter()


@router.get("/", response_model=List[AgentRecord])
def list_agents():
    # Return only DB-registered agents with id, agent_id, agent_name
    sb = get_supabase()
    rows = sb.table("agent_configs").select("id, agent_id, agent_name").order("created_at").execute()
    return rows.data or []


@router.get("/flows/{conversation_flow_id}", response_model=ConversationFlowPayload)
def get_conversation_flow(conversation_flow_id: str, version: Optional[int] = Query(default=None)):
    service = RetellService()
    try:
        return service.get_conversation_flow(conversation_flow_id, version=version)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/flows/{conversation_flow_id}", response_model=ConversationFlowPayload)
def update_conversation_flow(conversation_flow_id: str, payload: ConversationFlowPayload, version: Optional[int] = Query(default=None)):
    service = RetellService()
    try:
        return service.update_conversation_flow(conversation_flow_id, payload, version=version)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=RetellAgentOut)
def create_agent(payload: AgentCreateRequest):
    # Minimal accepted fields: agent_name, voice_id
    agent_name: Optional[str] = payload.agent_name
    voice_id: Optional[str] = payload.voice_id
    service = RetellService()
    try:
        # 1) Create conversation flow
        flow = service.create_conversation_flow()
        conversation_flow_id = flow.get("conversation_flow_id")
        if not conversation_flow_id:
            raise RuntimeError("Failed to obtain conversation_flow_id")
        # 2) Create agent with response_engine.type=conversation-flow
        created = service.create_agent(
            agent_name=agent_name,
            voice_id=voice_id,
            conversation_flow_id=conversation_flow_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Register in Supabase table 'agent_configs' with minimal columns: id, agent_id
    sb = get_supabase()
    config_id = str(uuid.uuid4())
    row = {
        "id": config_id,
        "agent_id": created.get("agent_id"),
        "agent_name": agent_name
    }
    sb.table("agent_configs").insert(row).execute()
    return created  # will be validated by RetellAgentOut model


@router.get("/{agent_id}", response_model=RetellAgentOut)
def get_agent(agent_id: str):
    service = RetellService()
    try:
        return service.get_agent(agent_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Agent not found")


@router.put("/{agent_id}", response_model=RetellAgentOut)
def update_agent(agent_id: str, payload: ConversationFlowPayload):
    service = RetellService()
    try:
        return service.update_agent(agent_id, payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


