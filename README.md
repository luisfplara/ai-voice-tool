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
# Optional
OPENAI_API_KEY=
OUTBOUND_CALLER_ID=
```

2) Install and run API

- Windows (PowerShell):
```
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

- Linux (Ubuntu):
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

3) Initialize database tables: Open `backend/db/schema.sql` in Supabase SQL editor and run it.

4) Configure Retell webhook to POST to:
```
{BACKEND_BASE_URL}/api/webhook/retell
```

### Frontend Setup (Next.js + MUI)
1) Create `ai-voice-tool-test/.env.local`:
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

### What’s Implemented
- Agent Configs UI: create, edit, delete; advanced voice settings (backchanneling, filler words, interruption sensitivity, speaking rate), emergency triggers.
- Calls Dashboard: start test call with driver name, phone number, load number; recent calls list.
- Call Detail: status, structured summary, full transcript, refresh summary.
- Backend: FastAPI with Supabase persistence, Retell outbound call trigger and webhook, robust post-processing for both Dispatch check-in and Emergency escalation scenarios.

### Notes
- For local webhook testing, expose the backend with a tunnel (e.g., `ngrok http 8000`) and set `BACKEND_BASE_URL` accordingly.
- The Retell outbound payload includes voice realism controls (backchanneling, fillers, interruption sensitivity) to satisfy Task A.

### Production Deployment (Ubuntu)

Backend (systemd):
```
sudo adduser --system --group voiceapp
sudo mkdir -p /opt/voiceapp/backend
sudo chown -R voiceapp:voiceapp /opt/voiceapp

cd /opt/voiceapp/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create /opt/voiceapp/backend/.env with your secrets

cat <<'SERVICE' | sudo tee /etc/systemd/system/voiceapp-backend.service
[Unit]
Description=Voice App Backend (FastAPI)
After=network.target

[Service]
User=voiceapp
WorkingDirectory=/opt/voiceapp/backend
EnvironmentFile=/opt/voiceapp/backend/.env
ExecStart=/opt/voiceapp/backend/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now voiceapp-backend
```

Frontend (Next.js build + reverse proxy):
```
sudo mkdir -p /opt/voiceapp/frontend
sudo chown -R voiceapp:voiceapp /opt/voiceapp

cd /opt/voiceapp/frontend
pnpm install --frozen-lockfile
pnpm build
pnpm start -- -p 3000
```

Recommended: run the frontend with a process manager (pm2/systemd) and place Nginx in front with TLS.

### Backend .gitignore (already added)
See `backend/.gitignore` for Python, venv, env, cache, and log ignores suitable for Ubuntu.

