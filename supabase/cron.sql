-- Optional: schedule cleanup every 5 minutes via pg_cron + pg_net.
-- Enable extensions in Supabase Dashboard → Database → Extensions:
--   * pg_cron
--   * pg_net

-- Replace YOUR_DOMAIN with your deployed URL.
select cron.schedule(
  'blazt-share-cleanup',
  '*/5 * * * *',
  $$ select net.http_get('https://YOUR_DOMAIN/api/public/cron/cleanup') $$
);

-- To remove: select cron.unschedule('blazt-share-cleanup');
