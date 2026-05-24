
# Blazt Share — MVP Plan

Anonymous P2P-style text/file sharing. Sender uploads → gets 4-digit code + QR → receiver enters code to grab content. No auth, temporary, mobile-first.

## Stack (adapted to this project)

- **TanStack Start** (React 19 + Vite, SSR on Cloudflare Workers) — Next.js isn't supported in Lovable; TanStack Start covers the same patterns (file routing, server functions for APIs).
- **TypeScript + Tailwind v4** (already configured)
- **Supabase** — you'll connect your own project manually (URL + anon key + service role key as build/runtime env vars). I'll provide the SQL schema, storage bucket setup, and `.env.example`.
- **qrcode** npm package for QR generation.

## Design direction

Futuristic dark-mode neon blue. Deep navy/black background, electric cyan-blue accents, subtle glow on primary CTAs, monospace numerals for the 4-digit code, glassmorphism cards. All defined as semantic tokens in `src/styles.css` (oklch).

## Routes

```
src/routes/
  __root.tsx              # nav, theme, fonts, OG meta
  index.tsx               # landing — two big buttons: Send / Receive
  send.tsx                # create-share UI + success state (code + QR)
  receive.tsx             # 4-digit code input
  receive.$code.tsx       # auto-fetch + display text/file
  api/public/
    shares.create.ts      # POST — create share, return code
    shares.$code.ts       # GET — fetch share metadata; DELETE — one-time cleanup
    shares.heartbeat.ts   # POST — update last_seen_at (also handles sendBeacon)
    shares.deactivate.ts  # POST — sendBeacon target on tab close
    download.$code.ts     # GET — issue signed URL (and delete row if one-time)
    cron.cleanup.ts       # GET — pg_cron hits this every 5 min
```

## Database schema (Supabase)

```sql
create table public.shares (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                  -- 4-digit, zero-padded
  kind text not null check (kind in ('text','file')),
  text_content text,                          -- when kind='text'
  file_path text,                             -- storage path when kind='file'
  file_name text,
  file_size bigint,
  mime_type text,
  one_time boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,            -- created_at + 30 min
  last_seen_at timestamptz not null default now()
);
create index on public.shares (code) where active = true;
create index on public.shares (expires_at);

alter table public.shares enable row level security;
-- No public policies — all access goes through server routes using service role.
```

Storage bucket: `shares` (private). Server issues signed URLs (60s TTL) for downloads.

Optional pg_cron job (user runs once):
```sql
select cron.schedule('blazt-cleanup','*/5 * * * *',
  $$ select net.http_get('https://<project>.lovable.app/api/public/cron/cleanup') $$);
```

## Server logic

- **createShare**: validate (≤25MB, allowed MIME), generate unique 4-digit code (retry on collision), upload file to storage if present, insert row with `expires_at = now() + 30min`.
- **getShare(code)**: lazy-cleanup first; return 404/410 for missing/expired/inactive; return text or file metadata (no signed URL yet).
- **getDownloadUrl(code)**: issue 60s signed URL; if `one_time` → delete storage object + row after issuing.
- **heartbeat(code)**: bump `last_seen_at`. Sender posts every 20s.
- **deactivate(code)**: set `active=false`. Called via `navigator.sendBeacon` on `pagehide`.
- **cleanup**: delete rows where `expires_at < now()` OR `last_seen_at < now()-60s`; delete corresponding storage files.
- **"inactive" check**: a share is treated as inactive when `last_seen_at < now()-60s` (computed on read, not stored).

All routes live under `/api/public/*` (no auth required, but service role used server-side). Inputs validated with Zod. File-size and MIME checks on both client and server.

## UI components

```
src/components/
  Header.tsx              # logo + Send/Receive links
  Logo.tsx                # "Blazt Share" wordmark with neon glow
  CodeDisplay.tsx         # huge monospace 4-digit code
  QRDisplay.tsx           # QR canvas
  CopyButton.tsx          # generic copy-to-clipboard with toast
  Dropzone.tsx            # drag-drop + file picker, size/MIME guard
  FilePreview.tsx         # filename, size, icon
  TextPreview.tsx         # text card + copy
  StatusPill.tsx          # active/expired/inactive states
  Spinner.tsx
```

Hooks:
- `useHeartbeat(code)` — 20s interval + `pagehide` sendBeacon to deactivate.
- `useCountdown(expiresAt)` — show "expires in mm:ss".
- `useShareReceiver(code)` — polls share status every 5s until file ready / expired.

## Error states

Each handled with toast + inline message: invalid code (404), expired (410), inactive sender (410), file too large (413), upload failed (500), file not found in storage (404).

## Security

- Storage bucket private; downloads always via short-lived signed URL.
- MIME allowlist: text, image/*, application/pdf, application/zip, video/*, application/octet-stream.
- 25MB hard cap enforced server-side.
- Codes are 4-digit but bound to active+non-expired rows only; expired codes free up immediately.
- Rate limit (best-effort, in-memory per IP) on create + receive endpoints.

## Deliverables

- All routes + components + hooks above
- `supabase/schema.sql` — table + bucket + indexes
- `supabase/cron.sql` — optional pg_cron snippet
- `envReadme.md` — env var setup walkthrough
- `.env.example` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `README.md` — setup, deploy, architecture overview

## What you'll do manually after I build

1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
2. Create private `shares` storage bucket (or run the SQL I provide).
3. Add env vars in Lovable workspace settings (I'll list exact names).
4. (Optional) Run `supabase/cron.sql` to enable the 5-minute cleanup.

## Technical notes

- TanStack Start server routes under `src/routes/api/public/*` bypass Lovable's published-site auth — correct home for these endpoints.
- `supabaseAdmin` (service role) used in route handlers; never imported into components.
- File uploads use multipart `FormData` POST to `/api/public/shares/create`; server streams to Supabase Storage.
- QR generated client-side with `qrcode` to avoid round-trip.
- pg_cron + `net.http_get` requires the `pg_net` extension — instructions included in README.
