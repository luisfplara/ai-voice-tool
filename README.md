## AI Voice Agent Tool

Next.js (App Router + MUI) + FastAPI + Supabase + Retell AI admin tool to configure agent prompts/voice, trigger test calls, and review structured results and transcripts.

### Prerequisites
- Node 18+ and npm
- Python 3.10+
- Supabase project (URL + Service Role Key)
- Retell AI account and API key

### Backend Setup (FastAPI)
1) Create `backend/.env` (see `backend/.env.example`):
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RETELL_API_KEY=...
BACKEND_BASE_URL=http://localhost:8000
OPENAI_API_KEY=
```

2) Install and run API

- Windows (PowerShell):
```
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Linux (Ubuntu):
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3) Initialize database tables: Open `backend/db/schema.sql` in Supabase SQL editor and run it.

4) Configure Retell webhook to POST to:
```
{BACKEND_BASE_URL}/api/webhook/retell
```

### Frontend Setup (Next.js + MUI)
1) With you using the backend in a diferent port than 8000, create `ai-voice-tool-test/.env` with:
```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

2) Install and run

- Windows (PowerShell):
```
cd ai-voice-tool-test
pnpm install
pnpm dev
```

- Linux (Ubuntu):
```
cd ai-voice-tool-test
pnpm install --frozen-lockfile
pnpm dev
```

###Setup Ngrok
```
ngrok http --url=YOU_NGROK_DOMAIN 8000
```
- For local webhook testing, expose the backend with a tunnel (e.g., `ngrok http 8000`) and set backen .env `BACKEND_BASE_URL` accordingly.

### What’s Implemented
- Agent Configs UI
  - Basics: `agent_name`, `voice_id`, `voice_speed`, `voice_temperature`, `enable_backchannel`.
  - Audio & Transcription: `language`, `stt_mode` (fast|accurate), `vocab_specialization`, `denoising_mode`, `volume`, `ambient_sound`, `ambient_sound_volume`, `interruption_sensitivity`, `responsiveness`.
  - Recognition & Redaction: `boosted_keywords` (comma separated), `pronunciation_dictionary` (JSON array), `pii_config` (JSON object).
  - Reminders & Backchanneling: `backchannel_frequency`, `reminder_trigger_ms`, `reminder_max_count`.
  - Advanced JSON patch: free-form JSON merged into the agent update body for full coverage of Retell fields.
  - Tooltips: every parameter has a short description inline for quick reference.

- Conversation Flow Editor (for conversation-flow agents)
  - Loads agent `response_engine.conversation_flow_id` and fetches flow via backend proxy.
  - Editable fields: `global_prompt` and all nodes where `type === "conversation"` (node `name` and instruction `text`).
  - Non-conversation nodes (e.g., variable extraction) are visible but not editable to keep logic consistent.
  - Saves propagate to Retell via backend `PUT /api/configs/flows/{conversation_flow_id}`.

- Calls Dashboard
  - Start test web calls with driver name, phone number, and load number; see recent calls.
  - Join the live web call with web socket.
  - Call detail: live status, transcript, structured summary

- Backend (FastAPI)
  - Configs API: create/list/get/update agents. Create auto-creates a default Conversation Flow and links it to the agent.
  - Flow API: proxy endpoints to get and update Conversation Flows (Retell).
  - Webhook: processes Retell `call_analyzed` events, merges transcript, collected variables, driver status, and cost/latency metadata; persists to Supabase.
  - Outbound calls: initiates Retell web calls with driver/load dynamic variables and stores returned call id and access token.
  - Default Flow: seeded with a logistics check-in workflow (current location/ETA, delay reason, unloading, and emergency path), matching the current ops needs.

- Data Model (Supabase)
  - `agent_configs`: minimal registry for agents created via the app (id, agent_id, agent_name).
  - `calls`: records each test call, status transitions, transcript, summary, and Retell identifiers.

- Tech Stack
  - Frontend: Next.js App Router + MUI 7.
  - Backend: FastAPI, `httpx`, Supabase Python client.
  - Voice/Agent Platform: Retell AI (agents, conversation flows, calls, webhooks).

