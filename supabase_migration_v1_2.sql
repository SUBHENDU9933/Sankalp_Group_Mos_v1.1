-- Sankalp Marketing Hub — Integration row seeding (idempotent)
-- Run this AFTER the main supabase_schema.sql if you upgrade and need the new
-- platform rows ('threads' and 'x' may already exist; this is just here for safety).

insert into public.integrations (platform, is_connected) values
  ('facebook', false), ('instagram', false), ('threads', false), ('x', false),
  ('google', false), ('youtube', false), ('gsc', false), ('ga', false)
on conflict (platform) do nothing;

-- If you ran the original schema before this update, ensure refresh_token column exists:
alter table public.integrations add column if not exists refresh_token text;
alter table public.integrations add column if not exists metadata jsonb;

-- Add an index on posts.status for the cron scan
create index if not exists posts_status_scheduled_idx on public.posts (status) where status in ('scheduled','publishing');
