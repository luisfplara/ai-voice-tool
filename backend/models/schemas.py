from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from pydantic import ConfigDict


class AgentVoiceSettings(BaseModel):
    backchanneling_enabled: bool = True
    filler_words_enabled: bool = True
    interruption_sensitivity: float = Field(0.5, ge=0.0, le=1.0)
    speaking_rate: float = Field(1.0, gt=0.2, lt=3.0)


class AgentPrompts(BaseModel):
    system_prompt: str = (
        "You are a professional logistics dispatch agent. Be concise, calm, and helpful."
    )
    greeting_template: str = (
        "Hi {driver_name}, this is Dispatch with a check call on load {load_number}. "
        "Can you give me an update on your status?"
    )
    emergency_trigger_phrases: List[str] = Field(
        default_factory=lambda: [
            "accident",
            "crash",
            "emergency",
            "blowout",
            "breakdown",
            "medical",
            "help now",
        ]
    )


class AgentConfigIn(BaseModel):
    name: str
    prompts: AgentPrompts
    voice_settings: AgentVoiceSettings


class AgentConfigOut(AgentConfigIn):
    id: str


class CallStartRequest(BaseModel):
    driver_name: str = Field(min_length=1, max_length=100)
    load_number: str = Field(min_length=1, max_length=50)
    agent_config_id: str = Field(min_length=1)
    # Optional: phone number is accepted but not required by backend storage
    phone_number: Optional[str] = Field(default=None, pattern=r"^\+?[1-9]\d{6,14}$")


class CallOut(BaseModel):
    id: str
    driver_name: str
    load_number: str
    agent_config_id: str
    status: Literal["queued", "in_progress", "completed", "failed", "not_joined", "error"]
    retell_call_id: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    retell_call_access_token: Optional[str] = None
    driver_status: Optional[Literal["Driving", "Delayed", "Arrived", "Unloading", "Not Joined", "Emergency"]] = None


# Responses for Configs router
class AgentRecord(BaseModel):
    id: str
    agent_id: str
    agent_name: Optional[str] = None


class AgentCreateRequest(BaseModel):
    agent_name: Optional[str] = Field(default=None, max_length=100)
    voice_id: Optional[str] = Field(default=None, max_length=100)


class RetellAgentOut(BaseModel):
    model_config = ConfigDict(extra="allow")


class ConversationFlowPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

