# Changelog

All notable changes to **Sankalp Marketing Hub** are documented here.

## [1.2.0] — 2026-02-15

### 🚀 Production Publishing Engine
- **Real multi-platform publishing** in `/api/publish` for all 6 publishing channels:
  - **Facebook Pages** — text / photo / video posts via Graph API v19 (auto-detects media type)
  - **Instagram Business** — image / video / reel via 2-step container + publish with `status_code` polling
  - **Google Business Profile** — `localPosts` with offer/standard topic + auto-retry on 401 with refresh-token
  - **YouTube** — resumable video upload (server-side fetch + binary PUT to upload URL)
  - **X (Twitter)** — OAuth 2.0 + PKCE tweet publishing (text + `media_ids` support)
  - **Threads** — Meta Threads Graph API 2-step (text / image / video) with timed waits
- **Parallel platform dispatch** — each platform publishes independently; per-platform errors captured into `posts.metadata.publish_results`
- **Smart status logic** — `published` / `partial` / `failed` / `pending_connection` derived from per-platform results
- **Status guard `publishing`** prevents the cron from double-firing in-flight posts

### 🔐 Real OAuth flows
- **Meta OAuth** (`/api/auth/facebook`) — short-lived → long-lived user token → page token; auto-detects linked IG Business account and saves BOTH `facebook` and `instagram` rows.
- **Threads OAuth** (`/api/auth/threads`) — new endpoint, long-lived (60d) token, profile fetched and stored.
- **X OAuth 2.0 + PKCE** (`/api/auth/x`) — new endpoint, confidential client, refresh-token saved.
- **Google OAuth enrichment** — callback now auto-fetches YouTube channel (channel_id, title, subscribers) or GBP account+location (account_id, location_id, all_locations) and persists to `integrations.metadata`. Preserves refresh_token across re-consents.

### 🔒 Cron security
- `/api/cron/publish` now requires `X-Cron-Secret` header matching `CRON_SECRET` env var.
- Cron-job.org setup unchanged — just add the header with your secret.

### 📚 Setup guides
- `/app/META_SETUP_GUIDE.md` — step-by-step Meta Developer App + Page + IG Business config.
- `/app/X_SETUP_GUIDE.md` — X Developer Portal OAuth 2.0 setup.
- `/app/THREADS_SETUP_GUIDE.md` — Threads API Developer App config.

### 🗄️ Schema
- `/app/supabase_migration_v1_2.sql` — adds `refresh_token` + `metadata` columns to integrations (idempotent), creates partial index on scheduled posts.

### 🎨 Frontend
- `oauthPopup` extended to route `threads` and `x` to their new endpoints.
- Integrations page copy updated — all 8 platforms are now real OAuth (no more "simulated until verification" disclaimer).

### 📦 Vercel functions
9 of 12 (Hobby ceiling) — added 2 new (`threads.js`, `x.js`) on top of existing 7.

---


## [1.1.0] — 2026-05-15

### 📱 Mobile-app experience
- **New BottomNav** — 5-tab bottom bar (Home · Queue · floating Compose FAB · Calendar · More) sticky on phones
- **Slide-up "More" sheet** with every secondary section + prominent AI Command Assistant CTA
- **Hamburger drawer** — sidebar slides in from left on mobile, auto-closes on selection
- **Composer Edit/Preview tab toggle** on mobile (full-screen, sticky bottom action bar with iOS safe-area)
- **Calendar agenda mode** on mobile — vertical list of upcoming days grouped with their posts
- **PWA-ready meta tags** — supports "Add to Home Screen" with proper app icon & full-screen launch
- **Touch-friendly spacing** + safe-area-aware bottom padding throughout

### 🚀 Business-ready features
- **Posts Queue** at `/posts` — Buffer-style filter tabs (All / Drafts / Queue / Sent / Failed), search, per-row Edit / Duplicate / Delete / Publish-Now actions
- **Click-to-edit everywhere** — Calendar tiles, Dashboard upcoming rail, and Posts Queue all open the Composer pre-filled for editing
- **Compose-for-a-date** — Click any empty Calendar day → Composer opens with that date+time pre-filled
- **Real Media Library** — upload, grid view, search, hover-to-copy URL, hover-to-delete (removes from Supabase Storage AND DB), large preview lightbox
- **Library picker in Composer** — pick existing media (multi-select) without re-uploading
- **Onboarding Checklist** on Dashboard — progress bar tracking schema run, channel connection, first media, first post, settings
- **Activity feed** at `/notifications` — derived events from posts (published/failed), reviews, integrations
- **Real Settings** — workspace name, business email/phone, timezone, default language, AI tone preset, default platforms, notification toggles (persists to localStorage)
- **Dark / Light theme toggle** in topbar (persists in localStorage)

### 🔌 Backend & infrastructure
- **Vercel Cron** at `/api/cron/publish` — hourly schedule sweeps `scheduled` posts and calls publish engine
- **Consolidated CRUD** into single `/api/[resource].js` dynamic route (drops Vercel serverless function count from 13 → 6, well under Hobby's 12 limit)
- **AI endpoint** (`/api/ai/generate`) — Anthropic Claude Sonnet 4.5 (preferred) + OpenAI GPT-4o fallback
- **Real publishing engine** (`/api/publish`) — Facebook Graph API + Instagram media-publish + Google Business localPosts when real tokens are present, graceful fallback to "mock" for unverified platforms
- **Google OAuth** — dynamic host detection, per-platform scopes (Business / YouTube / Search Console / Analytics)
- **Supabase upload policy** documented for the `media` bucket

### 🐛 Fixes / polish
- Removed signup link and TOS footer from login screen (internal-tool, admin-seeded users only)
- AI Command overlay aborts in-flight requests on close
- Graceful empty-state handling when Supabase tables are missing
- Brand favicon (Sankalp logo) wired into `index.html`

---

## [1.0.0] — 2026-05-14

### 🎉 Initial release
- Premium split-screen Login (email/password + Google OAuth via Supabase)
- Dashboard with KPI cards, reach AreaChart, upcoming rail, quick actions
- Content Studio Composer (multi-language EN/BN/HI, multi-platform, AI captions, live platform previews)
- Content Calendar (month grid)
- Blogs Manager, Reviews, Campaigns, Analytics, Integrations, Media Library
- Cmd+K AI Command Assistant
- 8-channel integration UI (Facebook, Instagram, Threads, X, Google Business, YouTube, Search Console, Analytics)
- Brand orange #F47B20 + royal blue #1F4FA1 palette · Outfit + Manrope typography
