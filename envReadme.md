# Blazt Share — Environment & Supabase setup

Blazt Share needs a Supabase project for its database and file storage. Follow
these steps once before deploying.

## 1. Create a Supabase project

1. Go to <https://supabase.com> → New project.
2. Pick a region near your users.
3. Wait ~1 minute for it to provision.

## 2. Run the SQL schema

Open the SQL Editor and paste the contents of `supabase/schema.sql`, then run.
This creates:

- `public.shares` table (with code, expiry, presence columns)
- The required indexes
- A **private** `shares` storage bucket

## 3. Grab your keys

In Supabase Dashboard → Project Settings → API:

| Lovable env var                | Value                                     |
| ------------------------------ | ----------------------------------------- |
| `VITE_SUPABASE_URL`            | Project URL                               |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| `anon` / `publishable` key                |
| `SUPABASE_URL`                 | Same Project URL                          |
| `SUPABASE_SERVICE_ROLE_KEY`    | **service_role** key (keep this private!) |

## 4. Add environment variables

**Vercel:** Project → Settings → Environment Variables → add all four names
below for Production and Preview.

**Lovable:** Settings → Environment variables → same four names.

The two `VITE_*` ones are bundled into the client at build time; the others
stay server-only.

> ⚠️ Never paste the service role key in client code, route loaders, or
> components. Server routes under `src/routes/api/public/*` are the only
> place it's used.

## 5. (Optional) Schedule cleanup

Without this, expired shares are still cleaned up lazily whenever someone
opens a receive page or creates a new share. To guarantee removal even when
nobody visits:

**Vercel:** `vercel.json` already defines an hourly cron for
`/api/public/cron/cleanup`. Redeploy after connecting the project.

**Supabase pg_cron (any host):**

1. Supabase Dashboard → Database → Extensions → enable **pg_cron** and
   **pg_net**.
2. Edit `supabase/cron.sql`, replace `YOUR_DOMAIN` with your deployed URL,
   then run it.

## Troubleshooting

- **"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"** — env vars not set
  in Lovable, or the deploy hasn't picked them up yet. Redeploy after adding.
- **Uploads fail with "bucket not found"** — re-run `supabase/schema.sql` (the
  `insert into storage.buckets` line creates the `shares` bucket).
- **Downloads return 403** — the bucket should be **private**; the app uses
  short-lived signed URLs. Don't toggle it to public.
