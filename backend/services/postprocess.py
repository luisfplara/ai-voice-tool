from __future__ import annotations

import re
from typing import Dict, List, Any


EMERGENCY_KEYWORDS = [
    "accident",
    "crash",
    "emergency",
    "blowout",
    "breakdown",
    "medical",
    "911",
]


def _find_first(patterns: List[str], text: str) -> str | None:
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            if m.groups():
                return m.group(1).strip()
            return m.group(0).strip()
    return None


def _contains_any(keywords: List[str], text: str) -> bool:
    return any(kw.lower() in text.lower() for kw in keywords)


def _infer_driver_status(text: str) -> str:
    if re.search(r"\barriv(ed|ing)\b|at (the )?receiver|at dock|in door", text, re.I):
        return "Arrived"
    if re.search(r"\bunload(ing|ed)\b|lumper|detention", text, re.I):
        return "Unloading"
    if re.search(r"\bdelay(ed)?\b|traffic|weather|breakdown|accident", text, re.I):
        return "Delayed"
    return "Driving"


def _extract_eta(text: str) -> str | None:
    return _find_first([
        r"eta (?:is|around|about)?\s*([\w: ]+(?:am|pm)?)",
        r"(tomorrow|today|tonight|\b[0-9]{1,2}[:.][0-9]{2}\s*(?:am|pm))",
    ], text)


def _extract_location(text: str) -> str | None:
    return _find_first([
        r"on (I-[0-9]+(?: [NSEW])?(?: near [\w ,.-]+)?)",
        r"near ([\w ,.-]+)",
        r"at ([\w ,.-]+)",
        r"by ([\w ,.-]+)",
    ], text)


def _extract_delay_reason(text: str) -> str:
    if re.search(r"traffic", text, re.I):
        return "Heavy Traffic"
    if re.search(r"weather|snow|rain|ice|wind", text, re.I):
        return "Weather"
    if re.search(r"breakdown|blowout|mechanic|tire", text, re.I):
        return "Mechanical"
    return "None"


def _extract_unloading_status(text: str) -> str:
    if re.search(r"in door [0-9]+", text, re.I):
        return _find_first([r"(in door [0-9]+)"], text) or "In Door"
    if re.search(r"waiting for lumper", text, re.I):
        return "Waiting for Lumper"
    if re.search(r"detention", text, re.I):
        return "Detention"
    return "N/A"


def _bool_from_ack(text: str) -> bool:
    return bool(re.search(r"(will do|okay|ok|got it|sure|yes)\b", text, re.I))


def _extract_emergency_type(text: str) -> str:
    if re.search(r"accident|crash", text, re.I):
        return "Accident"
    if re.search(r"blowout|breakdown|mechanic|tire|engine", text, re.I):
        return "Breakdown"
    if re.search(r"medical|hurt|injur", text, re.I):
        return "Medical"
    return "Other"


def _extract_safety_status(text: str) -> str:
    if re.search(r"safe|ok|okay|fine|no danger", text, re.I):
        return "Driver confirmed everyone is safe"
    if re.search(r"not safe|in danger|help", text, re.I):
        return "Safety not confirmed"
    return "Unknown"


def _extract_injury_status(text: str) -> str:
    if re.search(r"no injur|not hurt|fine", text, re.I):
        return "No injuries reported"
    if re.search(r"injur|hurt|bleed|ambulance", text, re.I):
        return "Injuries reported"
    return "Unknown"


def _extract_load_secure(text: str) -> bool:
    return not bool(re.search(r"load (?:shift|spilled|lost|damaged)", text, re.I))


def generate_structured_summary(transcript_messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    transcript_messages: list of {role: "agent"|"driver", text: str, timestamp?: str}
    Returns a dict ready to store as summary.
    """
    # Flatten text for simple heuristics
    full_text = "\n".join([m.get("text", "") for m in transcript_messages])

    # Emergency detection
    if _contains_any(EMERGENCY_KEYWORDS, full_text):
        return {
            "call_outcome": "Emergency Escalation",
            "emergency_type": _extract_emergency_type(full_text),
            "safety_status": _extract_safety_status(full_text),
            "injury_status": _extract_injury_status(full_text),
            "emergency_location": _extract_location(full_text) or "Unknown",
            "load_secure": _extract_load_secure(full_text),
            "escalation_status": "Connected to Human Dispatcher",
        }

    # Dispatch check-in
    driver_status = _infer_driver_status(full_text)
    call_outcome = (
        "Arrival Confirmation" if driver_status in ("Arrived", "Unloading") else "In-Transit Update"
    )
    return {
        "call_outcome": call_outcome,
        "driver_status": driver_status,
        "current_location": _extract_location(full_text) or "Unknown",
        "eta": _extract_eta(full_text) or "Unknown",
        "delay_reason": _extract_delay_reason(full_text),
        "unloading_status": _extract_unloading_status(full_text),
        "pod_reminder_acknowledged": _bool_from_ack(full_text),
    }

