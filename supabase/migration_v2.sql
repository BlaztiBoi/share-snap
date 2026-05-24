-- Blazt Share — v2 migration (multi-file + admin config)
-- Run this ONCE in your Supabase SQL Editor.

-- 1. Per-file rows so a single share can carry many files.
create table if not exists public.share_files (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.shares(id) on delete cascade,
  path text not null,
  name text not null,
  size bigint not null,
  mime_type text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists share_files_share_id_idx
  on public.share_files (share_id);
alter table public.share_files enable row level security;
-- No public policies. Server uses service-role.

-- 2. Runtime-editable config (admin page).
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;

insert into public.app_config (key, value) values
  ('share_ttl_minutes', '30'::jsonb),
  ('inactive_seconds', '60'::jsonb),
  ('max_total_bytes', '104857600'::jsonb),
  ('max_files', '10'::jsonb),
  ('admin_password', '"admin123"'::jsonb)
on conflict (key) do nothing;
