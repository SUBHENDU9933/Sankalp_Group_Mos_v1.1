-- Sankalp Marketing Hub — Supabase schema
-- Run this in Supabase SQL Editor once on a fresh project.

-- =====================================================================
-- POSTS (social media posts)
-- =====================================================================
create table if not exists public.posts (
  id            bigserial primary key,
  title         text,
  content       text,
  content_en    text,
  content_bn    text,
  content_hi    text,
  platforms     text[]      default '{}',
  languages     text[]      default '{en}',
  status        text        default 'draft',  -- draft | scheduled | published | failed
  scheduled_at  timestamptz,
  published_at  timestamptz,
  post_type     text        default 'social', -- social | story | reel | offer | gbp_post
  media_urls    text[]      default '{}',
  campaign_id   bigint,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_scheduled_at_idx on public.posts (scheduled_at);

-- =====================================================================
-- BLOGS (website blog posts)
-- =====================================================================
create table if not exists public.blogs (
  id                bigserial primary key,
  title             text,
  slug              text unique,
  excerpt           text,
  content           text,
  seo_title         text,
  meta_description  text,
  featured_image    text,
  tags              text[]      default '{}',
  categories        text[]      default '{}',
  status            text        default 'draft', -- draft | scheduled | published
  scheduled_at      timestamptz,
  published_at      timestamptz,
  author            text        default 'Sankalp Interior Solution',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index if not exists blogs_status_idx on public.blogs (status);

-- =====================================================================
-- REVIEWS (Google/Facebook reviews)
-- =====================================================================
create table if not exists public.reviews (
  id              bigserial primary key,
  platform        text        default 'google',
  reviewer_name   text,
  reviewer_avatar text,
  rating          int,
  comment         text,
  sentiment       text,   -- positive | neutral | negative
  status          text        default 'pending', -- pending | replied | hidden
  reply_text      text,
  replied_at      timestamptz,
  external_id     text,
  created_at      timestamptz default now()
);
create index if not exists reviews_sentiment_idx on public.reviews (sentiment);
create index if not exists reviews_status_idx on public.reviews (status);

-- =====================================================================
-- CAMPAIGNS
-- =====================================================================
create table if not exists public.campaigns (
  id           bigserial primary key,
  name         text not null,
  description  text,
  campaign_type text       default 'promotional', -- festive | promotional | offer | lead_gen
  start_date   date,
  end_date     date,
  status       text        default 'active', -- draft | active | paused | completed
  budget       numeric,
  goals        jsonb,
  metadata     jsonb,
  created_at   timestamptz default now()
);

-- =====================================================================
-- INTEGRATIONS (connected platforms)
-- =====================================================================
create table if not exists public.integrations (
  id            bigserial primary key,
  platform      text unique,    -- facebook | instagram | threads | x | google | youtube | gsc | ga
  is_connected  boolean     default false,
  access_token  text,
  refresh_token text,
  account_id    text,
  account_name  text,
  metadata      jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Seed empty integration rows (so UI shows all platforms with disconnected state)
insert into public.integrations (platform, is_connected) values
  ('facebook', false), ('instagram', false), ('threads', false), ('x', false),
  ('google', false), ('youtube', false), ('gsc', false), ('ga', false)
on conflict (platform) do nothing;

-- =====================================================================
-- MEDIA LIBRARY
-- =====================================================================
create table if not exists public.media_library (
  id           bigserial primary key,
  filename     text,
  url          text,
  thumbnail    text,
  folder       text        default 'default',
  tags         text[]      default '{}',
  mime_type    text,
  size_bytes   bigint,
  width        int,
  height       int,
  metadata     jsonb,
  created_at   timestamptz default now()
);

-- =====================================================================
-- ANALYTICS (rollup metrics)
-- =====================================================================
create table if not exists public.analytics (
  id           bigserial primary key,
  date         date        not null,
  platform     text,
  metric_type  text,       -- impressions | reach | clicks | engagement | followers | calls | directions | ctr
  value        numeric,
  metadata     jsonb,
  created_at   timestamptz default now()
);
create index if not exists analytics_date_idx on public.analytics (date);
create index if not exists analytics_metric_type_idx on public.analytics (metric_type);

-- =====================================================================
-- ROW LEVEL SECURITY — for V1 we operate via service-role from FastAPI,
-- so RLS can stay disabled or have permissive policies for the anon role.
-- Adjust this when you wire client-side Supabase access later.
-- =====================================================================
alter table public.posts          disable row level security;
alter table public.blogs          disable row level security;
alter table public.reviews        disable row level security;
alter table public.campaigns      disable row level security;
alter table public.integrations   disable row level security;
alter table public.media_library  disable row level security;
alter table public.analytics      disable row level security;

-- =====================================================================
-- SEED demo data (optional, makes dashboard look populated immediately)
-- =====================================================================
insert into public.posts (title, content, platforms, languages, status, scheduled_at, post_type) values
  ('Modern Living Room — coming soon', 'A glimpse of our latest minimalist living-room transformation. Crafted, considered, calm.', '{facebook,instagram}', '{en}', 'scheduled', now() + interval '2 day', 'social'),
  ('Festive Offer — 15% off interior packages', 'This Diwali, gift your home a transformation. 15% off select packages until Nov 5.', '{facebook,instagram,google}', '{en,hi}', 'scheduled', now() + interval '5 day', 'offer'),
  ('Behind the design — kitchen reveal', 'How we balanced warm oak with deep cobalt for a kitchen that breathes.', '{instagram,threads}', '{en}', 'draft', null, 'social')
on conflict do nothing;

insert into public.reviews (platform, reviewer_name, rating, comment, sentiment, status) values
  ('google', 'Anita Sharma', 5, 'Sankalp transformed our living room beautifully. Incredibly professional team.', 'positive', 'pending'),
  ('google', 'Rahul Verma', 4, 'Good work overall, slight delay in delivery but the finish quality is great.', 'positive', 'pending'),
  ('facebook', 'Priya Banerjee', 5, 'Loved the kitchen design — premium feel within our budget.', 'positive', 'replied'),
  ('google', 'Sandeep K.', 2, 'The team was responsive but the timeline overshot by 3 weeks.', 'negative', 'pending')
on conflict do nothing;

insert into public.campaigns (name, description, campaign_type, status, start_date, end_date) values
  ('Diwali Offer 2026', '15% off interior packages, festive lighting bundles.', 'festive', 'active', current_date, current_date + 14),
  ('Modular Kitchen Lead Gen', 'Targeted ads for modular kitchen consultations.', 'lead_gen', 'active', current_date - 5, current_date + 25)
on conflict do nothing;

insert into public.analytics (date, platform, metric_type, value) values
  (current_date - 6, 'facebook',  'impressions',  1240),
  (current_date - 5, 'facebook',  'impressions',  1580),
  (current_date - 4, 'facebook',  'impressions',  2010),
  (current_date - 3, 'facebook',  'impressions',  1820),
  (current_date - 2, 'facebook',  'impressions',  2440),
  (current_date - 1, 'facebook',  'impressions',  2890),
  (current_date,     'facebook',  'impressions',  3120),
  (current_date - 6, 'instagram', 'impressions',  980),
  (current_date - 5, 'instagram', 'impressions',  1180),
  (current_date - 4, 'instagram', 'impressions',  1410),
  (current_date - 3, 'instagram', 'impressions',  1620),
  (current_date - 2, 'instagram', 'impressions',  1980),
  (current_date - 1, 'instagram', 'impressions',  2280),
  (current_date,     'instagram', 'impressions',  2640),
  (current_date - 6, 'google',    'engagement',   45),
  (current_date - 5, 'google',    'engagement',   62),
  (current_date - 4, 'google',    'engagement',   71),
  (current_date - 3, 'google',    'engagement',   88),
  (current_date - 2, 'google',    'engagement',   104),
  (current_date - 1, 'google',    'engagement',   121),
  (current_date,     'google',    'engagement',   138)
on conflict do nothing;
