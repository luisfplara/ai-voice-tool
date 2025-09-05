from __future__ import annotations

import httpx
from typing import Any, Dict, List, Optional
from settings import settings


class RetellService:
    def __init__(self) -> None:
        self.api_key = settings.retell_api_key
        # NOTE: adjust base URL and payloads to match your Retell account/version
        self.base_url = "https://api.retellai.com"

    # -----------------------
    # Agent CRUD (proxy layer)
    # -----------------------
    def create_conversation_flow(self) -> Dict[str, Any]:
        # Default conversation flow payload per user's provided structure
        DEFAULT_CONVERSATION_FLOW: Dict[str, Any] = {
            "global_prompt": (
                "You're a agent that works for a logistc company, your are responsible to get information about the freight. You're talking direclty with the driver. \n\n"
                "If in the middle of the call, you think that the driver is having a emergency, you need to start the emergency workflow. \n\n"
                "Be straight forward, do not reapeat yourself. \n\n"
            ),
            "nodes": [
                {
                    "instruction": {
                        "type": "prompt",
                        "text": "Hi {{driver_name}}, this is Dispatch with a check call on {{load_id}}. Can you give me an update on your status?",
                    },
                    "name": "Initial conversation",
                    "edges": [
                        {
                            "destination_node_id": "node-1756493598335",
                            "id": "edge-1",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "Driver giving updates",
                            },
                        },
                        {
                            "destination_node_id": "node-1756749779214",
                            "id": "edge-2",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "User is having a emergency",
                            },
                        },
                    ],
                    "start_speaker": "agent",
                    "id": "start-node-1756490316826",
                    "type": "conversation",
                    "display_position": {"x": -502.77475501179913, "y": -227.1994206418928},
                },
                {
                    "variables": [
                        {
                            "name": "driver_status",
                            "description": "The driver load status",
                            "type": "enum",
                            "choices": ["Driving", "Delayed", "Arrived", "Unloading"],
                        }
                    ],
                    "name": "Extract driver status variables",
                    "edges": [
                        {
                            "destination_node_id": "node-1756749542963",
                            "id": "edge-1756493773848",
                            "transition_condition": {
                                "type": "equation",
                                "equations": [
                                    {"left": "{{driver_status}}", "operator": "==", "right": "Driving"}
                                ],
                                "operator": "||",
                            },
                        },
                        {
                            "destination_node_id": "node-1756749542963",
                            "id": "edge-1756493809766",
                            "transition_condition": {
                                "type": "equation",
                                "equations": [
                                    {"left": "{{driver_status}}", "operator": "==", "right": "Delayed"}
                                ],
                                "operator": "||",
                            },
                        },
                        {
                            "destination_node_id": "node-1756752580723",
                            "id": "edge-1756493843463",
                            "transition_condition": {
                                "type": "equation",
                                "equations": [
                                    {"left": "{{driver_status}}", "operator": "==", "right": "Arrived"}
                                ],
                                "operator": "||",
                            },
                        },
                        {
                            "destination_node_id": "node-1756749659424",
                            "id": "edge-1756493862121",
                            "transition_condition": {
                                "type": "equation",
                                "equations": [
                                    {"left": "{{driver_status}}", "operator": "==", "right": "Unloading"}
                                ],
                                "operator": "||",
                            },
                        },
                    ],
                    "global_node_setting": {"condition": "Driver giving updates about the freight"},
                    "id": "node-1756493598335",
                    "type": "extract_dynamic_variables",
                    "display_position": {"x": -146.0150433193853, "y": -609.6092810266174},
                },
                {
                    "name": "Extract Variables",
                    "edges": [
                        {
                            "destination_node_id": "node-1756752580723",
                            "id": "edge-1756494089139",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "user prided current_location and eta",
                            },
                        },
                        {
                            "destination_node_id": "node-1756749609293",
                            "id": "edge-1756752517954",
                            "transition_condition": {
                                "type": "equation",
                                "equations": [
                                    {"left": "{{driver_status}}", "operator": "==", "right": "Delayed"}
                                ],
                                "operator": "||",
                            },
                        },
                    ],
                    "variables": [
                        {
                            "name": "current_location",
                            "description": "Driver current location\n\ne.g., I-10 near Indio, CA",
                            "type": "string",
                            "choices": [],
                        },
                        {
                            "name": "eta",
                            "description": "e.g. Tomorrow, 8:00 AM",
                            "type": "string",
                            "choices": [],
                        },
                    ],
                    "id": "node-1756494089139",
                    "type": "extract_dynamic_variables",
                    "display_position": {"x": 893.3277290971405, "y": -1035.5988646123815},
                },
                {
                    "name": "Extract Variables",
                    "edges": [
                        {
                            "destination_node_id": "node-1756752580723",
                            "id": "edge-1756752270279",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "Customer provided delay reason",
                            },
                        }
                    ],
                    "variables": [
                        {
                            "name": "delay_reason",
                            "description": 'e.g. "Heavy Traffic", "Weather", "None"',
                            "type": "string",
                            "choices": [],
                        }
                    ],
                    "id": "node-1756494231971",
                    "type": "extract_dynamic_variables",
                    "display_position": {"x": 1692.2857864244932, "y": -1117.7001579416606},
                },
                {
                    "name": "Extract Variables",
                    "edges": [
                        {
                            "destination_node_id": "node-1756752580723",
                            "id": "edge-1756494294446",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "Driver provided unload_status",
                            },
                        }
                    ],
                    "variables": [
                        {
                            "name": "unloading_status",
                            "description": 'e.g. "In Door 42", "Waiting for Lumper", "Detention", "N/A"',
                            "type": "string",
                            "choices": [],
                        }
                    ],
                    "id": "node-1756494294446",
                    "type": "extract_dynamic_variables",
                    "display_position": {"x": 1010.2562410163664, "y": 93.1925656530067},
                },
                {
                    "name": "Emergency",
                    "edges": [
                        {
                            "destination_node_id": "node-1756749779214",
                            "id": "edge-1756749013281",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "some information is missing ",
                            },
                        },
                        {
                            "destination_node_id": "node-1756753055335",
                            "id": "edge-1756753045501",
                            "transition_condition": {
                                "type": "prompt",
                                "prompt": "you have all the need infomations",
                            },
                        },
                    ],
                    "variables": [
                        {
                            "name": "emergency_type",
                            "description": "The type of the emergency",
                            "type": "enum",
                            "choices": ["Accident", "Breakdown", "Medical", "Other"],
                        },
                        {
                            "name": "safety_status",
                            "description": 'e.g. "Driver confirmed everyone is safe"',
                            "type": "string",
                            "choices": [],
                        },
                        {
                            "name": "injury_status",
                            "description": 'e.g. "No injuries reported"',
                            "type": "string",
                            "choices": [],
                        },
                        {
                            "name": "emergency_location",
                            "description": 'e.g. "I-15 North, Mile Marker 123"',
                            "type": "string",
                            "choices": [],
                        },
                        {
                            "name": "load_secure",
                            "description": "If the load suffered any damage",
                            "type": "boolean",
                            "choices": [],
                        },
                    ],
                    "id": "node-1756749013281",
                    "type": "extract_dynamic_variables",
                    "display_position": {"x": -39.28033660955535, "y": 807.3522707881312},
                },
                {
                    "name": "Conversation current location and eta",
                    "edges": [
                        {
                            "destination_node_id": "node-1756494089139",
                            "id": "edge-1756749542963",
                            "transition_condition": {"type": "prompt", "prompt": "Driver asnwered the question"},
                        }
                    ],
                    "id": "node-1756749542963",
                    "type": "conversation",
                    "display_position": {"x": 405.98065428574614, "y": -943.9629980103422},
                    "instruction": {"type": "prompt", "text": "Ask for driver his current location and eta"},
                },
                {
                    "name": "Conversation delay reason",
                    "edges": [
                        {
                            "destination_node_id": "node-1756494231971",
                            "id": "edge-1756749609293",
                            "transition_condition": {"type": "prompt", "prompt": "Driver asnwered the question"},
                        }
                    ],
                    "id": "node-1756749609293",
                    "type": "conversation",
                    "display_position": {"x": 1306.9586706460123, "y": -1307.6167726633148},
                    "instruction": {"type": "prompt", "text": "Ask for the driver the delay reason"},
                },
                {
                    "name": "Conversation unloading",
                    "edges": [
                        {
                            "destination_node_id": "node-1756494294446",
                            "id": "edge-1756749659424",
                            "transition_condition": {"type": "prompt", "prompt": "Driver asnwered the question"},
                        }
                    ],
                    "id": "node-1756749659424",
                    "type": "conversation",
                    "display_position": {"x": 397.8154160735139, "y": -35.60579940636862},
                    "instruction": {"type": "prompt", "text": "Ask for the unloading status"},
                },
                {
                    "instruction": {
                        "type": "prompt",
                        "text": "You need to ask more information about the emergency, they are:\n\n\u25cb emergency_type: \"Accident\" OR \"Breakdown\" OR \"Medical\" OR \"Other\"\n\n\u25cb safety_status: (e.g., \"Driver confirmed everyone is safe\")\n\u25cb injury_status: (e.g., \"No injuries reported\")\n\n\u25cb emergency_location: (e.g., \"I-15 North, Mile Marker 123\")\n\n\u25cb load_secure: true OR false\n",
                    },
                    "name": "Emergency conversation",
                    "edges": [
                        {
                            "destination_node_id": "node-1756749013281",
                            "id": "edge-1756749779214",
                            "transition_condition": {"type": "prompt", "prompt": "Driver asnwered the question"},
                        }
                    ],
                    "global_node_setting": {"condition": "Describe the condition to jump to this node"},
                    "id": "node-1756749779214",
                    "type": "conversation",
                    "display_position": {"x": -573.8284716436458, "y": 697.7689677130737},
                },
                {
                    "name": "End Call",
                    "id": "node-1756749960900",
                    "type": "end",
                    "display_position": {"x": 2323.8584914894664, "y": -268.16437243815346},
                    "instruction": {"type": "prompt", "text": "Politely end the call"},
                },
                {
                    "instruction": {"type": "prompt", "text": "Thanks the driver and end the call"},
                    "name": "End call",
                    "edges": [
                        {
                            "id": "edge-1756752580723",
                            "transition_condition": {"type": "prompt", "prompt": "You've accred all the required information"},
                        }
                    ],
                    "global_node_setting": {
                        "condition": "Finished any of the worflows with the required informations. ",
                    },
                    "id": "node-1756752580723",
                    "type": "conversation",
                    "display_position": {"x": 1929.8715735174562, "y": -401.92331408843955},
                    "skip_response_edge": {
                        "destination_node_id": "node-1756749960900",
                        "id": "edge-1756754045779",
                        "transition_condition": {"type": "prompt", "prompt": "Skip response"},
                    },
                },
                {
                    "instruction": {
                        "type": "prompt",
                        "text": "says that the company is aware of the acedent and is taking providence ASAP.",
                    },
                    "name": "End emergency",
                    "edges": [
                        {
                            "id": "edge-1756753123784",
                            "transition_condition": {"type": "prompt", "prompt": "you got the needed infomation"},
                        }
                    ],
                    "id": "node-1756753055335",
                    "type": "conversation",
                    "display_position": {"x": 439.3999111929545, "y": 891.4285714285714},
                    "skip_response_edge": {
                        "destination_node_id": "node-1756753103587",
                        "id": "edge-1756753891823",
                        "transition_condition": {"type": "prompt", "prompt": "Skip response"},
                    },
                },
                {
                    "name": "End Call",
                    "id": "node-1756753103587",
                    "type": "end",
                    "display_position": {"x": 830.8947767495976, "y": 850.793920099856},
                    "instruction": {"type": "prompt", "text": "Politely end the call"},
                },
            ],
            "start_node_id": "start-node-1756490316826",
            "start_speaker": "agent",
            "model_choice": {"type": "cascading", "model": "gpt-4.1"},
            "kb_config": {"top_k": 3, "filter_score": 0.6},
            "begin_tag_display_position": {"x": -691.866559272706, "y": -190.50866183740442},
            "is_published": False,
        }

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        endpoint = f"{self.base_url}/create-conversation-flow"
        try:
            resp = httpx.post(endpoint, json=DEFAULT_CONVERSATION_FLOW, headers=headers, timeout=60)
            resp.raise_for_status()
        except httpx.HTTPStatusError as http_err:
            detail = http_err.response.text if http_err.response is not None else str(http_err)
            raise RuntimeError(f"Retell API error (create_conversation_flow): {detail}")
        except Exception as exc:
            raise RuntimeError(f"Retell API error (create_conversation_flow): {exc}")
        return resp.json() or {}

    def get_conversation_flow(self, conversation_flow_id: str, version: Optional[int] = None) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params: Dict[str, Any] = {}
        if version is not None:
            params["version"] = version
        endpoint = f"{self.base_url}/get-conversation-flow/{conversation_flow_id}"
        try:
            resp = httpx.get(endpoint, headers=headers, params=params, timeout=30)
            resp.raise_for_status()
        except httpx.HTTPStatusError as http_err:
            detail = http_err.response.text if http_err.response is not None else str(http_err)
            raise RuntimeError(f"Retell API error (get_conversation_flow): {detail}")
        except Exception as exc:
            raise RuntimeError(f"Retell API error (get_conversation_flow): {exc}")
        return resp.json() or {}

    def update_conversation_flow(self, conversation_flow_id: str, payload: Dict[str, Any], version: Optional[int] = None) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        params: Dict[str, Any] = {}
        if version is not None:
            params["version"] = version
        endpoint = f"{self.base_url}/update-conversation-flow/{conversation_flow_id}"
        try:
            resp = httpx.patch(endpoint, json=payload, headers=headers, params=params, timeout=60)
            resp.raise_for_status()
        except httpx.HTTPStatusError as http_err:
            detail = http_err.response.text if http_err.response is not None else str(http_err)
            raise RuntimeError(f"Retell API error (update_conversation_flow): {detail}")
        except Exception as exc:
            raise RuntimeError(f"Retell API error (update_conversation_flow): {exc}")
        return resp.json() or {}

    def create_agent(
        self,
        agent_name: Optional[str] = None,
        voice_id: Optional[str] = None,
        conversation_flow_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        endpoint = f"{self.base_url}/create-agent"

        webhook_url = f"{settings.backend_base_url}/api/webhook/retell"


        if not conversation_flow_id:
            raise RuntimeError("conversation_flow_id is required to create an agent with conversation-flow response engine")
        payload: Dict[str, Any] = {
            "response_engine": {
                "type": "conversation-flow",
                "conversation_flow_id": conversation_flow_id,
                
            },
            "webhook_url": webhook_url,
        }
        if agent_name:
            payload["agent_name"] = agent_name
        if voice_id:
            payload["voice_id"] = voice_id
        try:
            resp = httpx.post(endpoint, json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
        except httpx.HTTPStatusError as http_err:
            detail = http_err.response.text if http_err.response is not None else str(http_err)
            raise RuntimeError(f"Retell API error (create_agent): {detail}")
        except Exception as exc:
            raise RuntimeError(f"Retell API error (create_agent): {exc}")
        return resp.json() or {}

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        endpoint = f"{self.base_url}/get-agent/{agent_id}"
        try:
            resp = httpx.get(endpoint, headers=headers, timeout=30)
            resp.raise_for_status()
        except Exception as exc:
            raise RuntimeError(f"Retell API error (get_agent): {exc}")
        return resp.json() or {}

    def update_agent(self, agent_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        endpoint = f"{self.base_url}/update-agent/{agent_id}"
        try:
            resp = httpx.patch(endpoint, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
        except httpx.HTTPStatusError as http_err:
            # Return API error details if provided
            detail = http_err.response.text if http_err.response is not None else str(http_err)
            raise RuntimeError(f"Retell API error (update_agent): {detail}")
        except Exception as exc:
            raise RuntimeError(f"Retell API error (update_agent): {exc}")
        return resp.json() or {}

    def start_web_call(
        self,
        agent_id: str,
        driver_name: str,
        load_number: str,
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        # Webhook URL for Retell to send events
   

        # Retell Call (V2) create phone call requires from_number and to_number
        payload = {
            "agent_id": agent_id,
            "metadata": metadata,
            "retell_llm_dynamic_variables": {
                "driver_name": driver_name,
                "load_id": load_number,
            }
        }

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        endpoint = f"{self.base_url}/v2/create-web-call"
        try:
            resp = httpx.post(endpoint, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
        except Exception as exc:
            raise RuntimeError(f"Retell API error: {exc}")

        data = resp.json()
        # Expect the response to include a call id and access token
        return {"call_id": data.get("call_id"), "access_token": data.get("access_token")}

    def get_call(self, call_id: str) -> Dict[str, Any]:
        """Retrieve call details from Retell v2 Get Call.

        Docs: https://docs.retellai.com/api-references/get-call
        """
        headers = {"Authorization": f"Bearer {self.api_key}"}
        endpoint = f"{self.base_url}/v2/get-call/{call_id}"
        try:
            resp = httpx.get(endpoint, headers=headers, timeout=30)
            resp.raise_for_status()
        except httpx.HTTPStatusError as http_err:
            detail = http_err.response.text if http_err.response is not None else str(http_err)
            raise RuntimeError(f"Retell API error (get_call): {detail}")
        except Exception as exc:
            raise RuntimeError(f"Retell API error (get_call): {exc}")
        return resp.json() or {}


