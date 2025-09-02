export type TranscriptRole = 'agent' | 'driver' | 'user'

export interface AgentRecord {
  id: string
  agent_id: string
  agent_name?: string
}

export interface TranscriptMessage {
  role: TranscriptRole
  text: string
  timestamp?: string
}

export type Summary = Record<string, unknown>

export interface CallStartRequest {
  driver_name: string
  phone_number: string
  load_number: string
  agent_config_id: string
}

export interface RetellAgent {
  agent_id: string
  agent_name?: string
  voice_id?: string
  voice_speed?: number
  voice_temperature?: number
  enable_backchannel?: boolean
  [key: string]: unknown
}

export interface CallOut {
  id: string
  driver_name: string
  phone_number: string
  load_number: string
  agent_config_id: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  retell_call_id?: string | null
  retell_call_access_token?: string | null
  summary?: Summary | null
  transcript?: TranscriptMessage[] | null
  started_at?: string | null
  completed_at?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const listAgents = () => http<AgentRecord[]>('/api/configs/')
export const getCall = (id: string) => http<CallOut>(`/api/calls/${id}`)
export const listCalls = () => http<CallOut[]>('/api/calls/')
export const startCall = (payload: CallStartRequest) => http<CallOut>(`/api/calls/start`, { method: 'POST', body: JSON.stringify(payload) })
export const refreshSummary = (id: string) => http<CallOut>(`/api/calls/${id}/refresh`, { method: 'POST' })

// Agent detail endpoints
export const getAgent = (agentId: string) => http<RetellAgent>(`/api/configs/${agentId}`)
export const updateAgent = (agentId: string, payload: Record<string, unknown>) =>
  http<RetellAgent>(`/api/configs/${agentId}`, { method: 'PUT', body: JSON.stringify(payload) })
export const createAgent = (payload: { agent_name?: string; voice_id?: string }) =>
  http<RetellAgent>(`/api/configs/`, { method: 'POST', body: JSON.stringify(payload) })


