-- Sankalp Marketing Hub — v1.4 hotfix migration
-- Adds the `metadata` jsonb column to `posts` and `media_library` so the
-- publish engine can persist per-platform results, retry counts, etc.
--
-- Safe to run multiple times (uses IF NOT EXISTS).

alter table public.posts          add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.media_library  add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.campaigns      add column if not exists metadata jsonb default '{}'::jsonb;

-- Helpful for the cron worker
create index if not exists posts_status_idx on public.posts (status);

-- Existing rows: backfill empty metadata
update public.posts          set metadata = '{}'::jsonb where metadata is null;
update public.media_library  set metadata = '{}'::jsonb where metadata is null;
update public.campaigns      set metadata = '{}'::jsonb where metadata is null;
