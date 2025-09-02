from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


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
    driver_name: str
    load_number: str
    agent_config_id: str


class CallOut(BaseModel):
    id: str
    driver_name: str
    load_number: str
    agent_config_id: str
    status: Literal["queued", "in_progress", "completed", "failed"]
    retell_call_id: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    retell_call_id: str
    retell_call_access_token: str

