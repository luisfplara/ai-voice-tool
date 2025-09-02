-- Supabase SQL schema for required tables

create table if not exists public.agent_configs (
  id uuid primary key,
  agent_id text not null,
  agent_name text,
  created_at timestamp with time zone default now()
);

create table if not exists public.calls (
  id uuid primary key,
  driver_name text not null,
  phone_number text not null,
  load_number text not null,
  agent_config_id uuid references public.agent_configs(id) on delete set null,
  status text not null default 'queued',
  retell_call_id text,
  summary jsonb,
  driver_status text default 'Driving',
  retell_call_access_token text,
  transcript jsonb,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Helpful indexes
create index if not exists calls_agent_idx on public.calls(agent_config_id);
create index if not exists calls_started_idx on public.calls(started_at desc);


