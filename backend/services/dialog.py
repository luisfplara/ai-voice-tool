from __future__ import annotations

from typing import Any, Dict, List
import re


def is_emergency(text: str, triggers: List[str]) -> bool:
    lowered = text.lower()
    return any(t.lower() in lowered for t in triggers)


def count_prompts_in_transcript(transcript: List[Dict[str, Any]], marker: str) -> int:
    return sum(1 for m in transcript if m.get("role") == "agent" and marker in m.get("text", ""))


def last_driver_message(transcript: List[Dict[str, Any]]) -> str:
    for msg in reversed(transcript):
        if msg.get("role") in ("driver", "user"):
            return msg.get("text", "")
    return ""


def looks_uncooperative(text: str) -> bool:
    return bool(re.fullmatch(r"(yes|no|ok|okay|fine|good|driving)\.?", text.strip().lower()))


def looks_garbled(text: str) -> bool:
    return (
        len(text.strip()) <= 2
        or "[inaudible]" in text.lower()
        or bool(re.search(r"[^a-zA-Z0-9\s,.?!]", text))
    )


def detect_conflict(text: str, expected_location: str | None) -> bool:
    if not expected_location:
        return False
    # naive: if driver mentions a city/highway that doesn't appear in expected
    if re.search(r"I-[0-9]+|\b(hwy|highway|interstate|street|ave|road)\b", text, re.I):
        return expected_location.lower() not in text.lower()
    # if mentions a city/word, but not in expected
    words = [w for w in re.findall(r"[A-Za-z]{3,}", text) if len(w) > 3]
    return bool(words) and all(w.lower() not in expected_location.lower() for w in words[:2])


def next_agent_message(
    transcript: List[Dict[str, Any]],
    config: Dict[str, Any],
    context: Dict[str, Any] | None = None,
) -> str:
    context = context or {}
    prompts = config.get("prompts", {})
    voice_settings = config.get("voice_settings", {})  # reserved
    greeting_template = prompts.get("greeting_template") or "Hi {driver_name}..."
    emergency_triggers = prompts.get("emergency_trigger_phrases", [])

    # Assemble runtime knowns
    driver_name = context.get("driver_name", "driver")
    load_number = context.get("load_number", "")
    gps_location = context.get("gps_location")  # optional string like "I-10 near Indio, CA"

    # If no prior agent messages, open with greeting
    if not any(m.get("role") == "agent" for m in transcript):
        return greeting_template.format(driver_name=driver_name, load_number=load_number)

    driver_text = last_driver_message(transcript)

    # Emergency pivot
    if is_emergency(driver_text, emergency_triggers):
        return (
            "Understood. Are you safe and pulled over? Are there any injuries? "
            "Where exactly are you located? I'm connecting you to a human dispatcher now."
        )

    # Handle garbled/noisy input with limited retries
    repeat_marker = "[repeat_request]"
    repeat_count = count_prompts_in_transcript(transcript, repeat_marker)
    if looks_garbled(driver_text) and repeat_count < 2:
        return (
            f"{repeat_marker} I had trouble hearing that. Could you please repeat your status and location?"
        )
    if looks_garbled(driver_text) and repeat_count >= 2:
        return (
            "I'm still having trouble hearing you. I'll connect you to a dispatcher who can assist."
        )

    # Uncooperative short answers: probe politely then end
    probe_marker = "[probe_request]"
    probe_count = count_prompts_in_transcript(transcript, probe_marker)
    if looks_uncooperative(driver_text) and probe_count < 2:
        return (
            f"{probe_marker} Thanks. Could you share your current location, ETA, and any delays?"
        )
    if looks_uncooperative(driver_text) and probe_count >= 2:
        return "Thanks for the update. We'll follow up later. Drive safe."

    # Conflict handling between stated and GPS data
    if gps_location and detect_conflict(driver_text, gps_location):
        return (
            f"Appreciate the update. Our GPS shows you near {gps_location}. Does that sound right?"
        )

    # Otherwise, continue structured information gathering
    if re.search(r"arriv|dock|unload", driver_text, re.I):
        return (
            "Great. Are you in a door yet, and do you expect detention or lumper?"
        )
    if re.search(r"delay|late|traffic|weather|breakdown", driver_text, re.I):
        return (
            "Thanks for letting me know. What's your updated ETA and precise location?"
        )

    # Default follow-ups
    return (
        "Thanks. What's your exact location and ETA to destination? Any delays to report?"
    )


