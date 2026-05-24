# Blazt Share

Anonymous peer-to-peer-style sharing for text and files. Drop something in,
get a 4-digit code + QR, anyone with the code can grab it. No accounts.
Temporary by design — shares expire after 30 minutes or when the sender
closes their tab.

## Features

- 📄 Share **text** or any **file up to 25 MB** (images, video, PDF, ZIP, …)
- 🔢 Random **4-digit code** + shareable **QR code**
- 👀 **Presence detection** — sender sends a heartbeat every 20 s; if it goes
  away the share becomes inaccessible
- ⏱️ **30-minute expiry** + `pagehide` `sendBeacon` cleanup
- 🔥 Optional **one-time download** mode (auto-deletes after first grab)
- 🔐 Private storage with **signed URLs** (60 s TTL)
- 🧹 Lazy cleanup + optional pg_cron job

## Tech

- TanStack Start (React 19 + Vite, SSR on Cloudflare Workers)
- TypeScript + Tailwind CSS v4
- Supabase (Postgres + Storage)
- `qrcode` for QR generation
- Zod for input validation

## Quick start

1. Read **[envReadme.md](./envReadme.md)** and set up Supabase (~3 minutes).
2. Run the SQL in `supabase/schema.sql`.
3. Add the four env vars to Lovable (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`).
4. Publish. Done.

## Architecture

```
src/
  routes/
    __root.tsx            # shell, header, toaster
    index.tsx             # landing
    send.tsx              # create-share UI + success state
    receive.tsx           # 4-digit code input
    receive.$code.tsx     # receiver view (text or file)
    api/public/
      shares.create.ts            POST  create a share
      shares.$code.ts             GET   metadata for a code
      shares.$code.heartbeat.ts   POST  20-s keepalive
      shares.$code.deactivate.ts  POST  sendBeacon target (delete)
      consume.$code.ts            POST  one-time consume after copy
      download.$code.ts           GET   issue signed URL
      cron.cleanup.ts             GET   pg_cron entry point
  components/
    Header, CopyButton, Dropzone, QRDisplay
  hooks/
    useHeartbeat, useCountdown
  lib/
    supabase.server.ts    admin client + constants
    shares.server.ts      DB helpers (cleanup, codes, signed URLs)
    format.ts             tiny formatters
```

All Supabase access happens server-side in `src/routes/api/public/*` using
the service role key. RLS stays on; no public policies are needed because
clients never talk to Supabase directly.

## Security notes

- Service role key is **server-only** (`process.env.SUPABASE_SERVICE_ROLE_KEY`),
  loaded inside route handlers, never in components or loaders.
- File size (25 MB) and MIME type are validated server-side.
- Storage bucket is private; downloads go through 60-second signed URLs.
- 4-digit codes are short — but a code is only valid while the share is
  active + non-expired (≤ 30 min). Brute-force surface is small.
- Optional: add a rate limit in front of `/api/public/shares/create` and
  `/api/public/shares/$code` if you expose this publicly at scale.

## Local dev

```bash
bun install
bun run dev
```

Then visit `http://localhost:5173`.

## License

MIT
