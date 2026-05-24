-- Blazt Share — Supabase schema
-- Run this in the Supabase SQL Editor (one-time setup).

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  kind text not null check (kind in ('text','file')),
  text_content text,
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  one_time boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);

create index if not exists shares_code_active_idx
  on public.shares (code) where active = true;
create index if not exists shares_expires_at_idx
  on public.shares (expires_at);

alter table public.shares enable row level security;
-- No public policies on purpose. All access is via server routes using the
-- service-role key, which bypasses RLS.

-- Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('shares', 'shares', false)
on conflict (id) do nothing;
