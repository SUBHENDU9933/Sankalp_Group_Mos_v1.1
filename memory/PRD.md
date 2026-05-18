# Sankalp Marketing Hub — PRD

## Original problem statement
Build a self-owned, premium digital marketing operating system (hybrid Buffer.com + Meta Business Suite + Hootsuite alternative) specifically for **Sankalp Interior Solution**. Centralize multi-platform publishing, scheduling, blog management, SEO, review automation, customer communication, analytics, campaigns and AI assistance — all within one visually premium low-recurring-cost private platform.

## Architecture (V1.2)
- **Frontend**: Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + Recharts + lucide-react. Premium dark theme with brand orange (#F47B20) + royal blue (#1F4FA1) palette. Runs on `/app/frontend`.
- **Backend (Production)**: **Vercel Serverless Functions** (Node.js) at `/app/frontend/api/*`. Currently 9 functions — well under Hobby's 12-function ceiling.
- **Backend (Preview-only shim)**: FastAPI at `/app/backend` exists ONLY so the Emergent supervisor reports healthy. Production logic lives entirely in `/app/frontend/api/*`.
- **Database**: Supabase Postgres. Schema in `/app/supabase_schema.sql`. Run `/app/supabase_migration_v1_2.sql` after the new release.
- **Auth (admin login)**: Supabase Auth. Seeded admin: `admin@sankalp.local` / `Sankalp@2026`.
- **AI**: Claude Sonnet 4.5 (Anthropic key) with GPT-4o fallback.
- **Cron**: `cron-job.org` → `POST /api/cron/publish` (protected with `CRON_SECRET`).

## User personas
1. **Super Admin** (business owner) — full control, manage team, billing.
2. **Content Manager** — composer, calendar, blogs, media.
3. **SEO Manager** — SEO center, blog SEO metadata, analytics.
4. **Support Manager** — inbox, reviews, customer responses.
5. **Viewer** — read-only analytics & dashboards.

## Core requirements
- Self-owned, low recurring cost.
- Manual-first, AI-enhanced.
- Premium SaaS UX with brand orange + royal blue palette.
- Multi-platform: Facebook, Instagram, Threads, X, Google Business, YouTube + GSC + GA.
- Multi-language: English, Bengali, Hindi.

## What's been implemented

### v1.3.0 — Meta Webhooks + WhatsApp Cloud API (2026-02-15)
- ✅ **`/api/webhooks/meta.js`** — single endpoint handles webhook verification (GET) AND event ingest (POST) for Facebook Page, Instagram, and WhatsApp Cloud API.
- ✅ **HMAC-SHA256 signature verification** via `X-Hub-Signature-256` header against `META_APP_SECRET` — unsigned/forged events are dropped silently (never written to DB).
- ✅ **Raw-body reader** with `bodyParser: false` config so signature math works on the exact bytes Meta sent.
- ✅ **Event flattening** — Messenger messages, IG DMs, IG comments/mentions, WhatsApp inbound messages, and WhatsApp delivery statuses all normalised into one `messages` table row shape.
- ✅ **`/app/supabase_migration_v1_3.sql`** — creates `messages` table with indexes (channel, received_at, sender) + a unique `(channel, external_id)` to dedupe Meta retries.
- ✅ **WhatsApp send** — added as a `whatsapp` platform inside `/api/publish.js`. Supports both free-form text (within 24h window) and pre-approved templates. Recipients passed via `post.metadata.whatsapp.recipients`.
- ✅ **Env-var compatibility** — `auth/facebook.js` now reads `META_APP_ID` / `META_APP_SECRET` (preferred) with fallback to legacy `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`.
- ✅ **`/app/META_WEBHOOK_SETUP.md`** — end-to-end setup guide (env vars, curl verify test, webhook subscription steps, live test recipes for FB Messenger / IG DM / WhatsApp inbound + outbound).

### v1.2.0 — Production Publishing Engine (2026-02-15)
- ✅ **Real multi-platform publishing engine** at `/api/publish` covering:
  - **Facebook Pages** — text, photo, video posts via Graph API v19.
  - **Instagram Business** — image / video / reel via 2-step container + publish with status polling.
  - **Google Business Profile** — localPosts with offer/standard topic types + auto-refresh of expired tokens.
  - **YouTube** — resumable video upload (server-side video fetch + binary PUT).
  - **X (Twitter)** — OAuth 2.0 + PKCE tweet publishing (text + media_id support).
  - **Threads** — Meta Threads Graph API 2-step container + publish with media polling waits.
- ✅ **Real Meta (Facebook + Instagram) OAuth** — long-lived Page token + IG Business detection auto-stored.
- ✅ **Threads OAuth** — long-lived 60-day token, profile detection.
- ✅ **X OAuth 2.0 + PKCE** — confidential client, refresh-token support.
- ✅ **Google OAuth enrichment** — auto-fetches YouTube channel + GBP account/location and stores in `integrations.metadata`.
- ✅ **Per-platform parallel publishing** with per-platform error capture in `posts.metadata.publish_results`.
- ✅ **Token refresh** for Google access tokens on 401 (auto retry once).
- ✅ **Cron security** — `CRON_SECRET` shared secret + `publishing` intermediate status to prevent double-fires.
- ✅ **Disconnect** wipes tokens + linked IG row when FB is disconnected.
- ✅ **Setup guides**: `/app/META_SETUP_GUIDE.md`, `/app/X_SETUP_GUIDE.md`, `/app/THREADS_SETUP_GUIDE.md`.
- ✅ Frontend `oauthPopup` routes threads + x to their new endpoints.

### v1.1.0 — UI / scaffolding (2026-05-15, previous)
- Premium split-screen Login, sidebar, topbar, theme toggle
- Mobile-app UX with BottomNav, FAB compose, slide-up sheet
- Dashboard, Posts Queue, Composer, Calendar, Blogs, Reviews, Campaigns, Analytics, Integrations, Notifications, Settings
- Cmd/Ctrl+K AI Command Assistant
- Vercel serverless setup with consolidated `[resource].js` for CRUD
- Supabase schema + Storage RLS policies

## Vercel function inventory (10 of 12 used)
| Function | Purpose |
|---|---|
| `/api/[resource].js` | All CRUD + `/api/dashboard` |
| `/api/publish.js` | Multi-platform publish engine (FB, IG, GBP, YT, X, Threads, WhatsApp) |
| `/api/ai/generate.js` | Claude/GPT AI generation |
| `/api/cron/publish.js` | Scheduled-post worker (secret-gated) |
| `/api/webhooks/meta.js` | Meta webhook receiver (FB Page + IG + WhatsApp) |
| `/api/auth/google.js` | Google OAuth (GBP/YT/GSC/GA scopes) |
| `/api/auth/facebook.js` | Meta OAuth (FB Page + IG Business) |
| `/api/auth/threads.js` | Threads OAuth |
| `/api/auth/x.js` | X OAuth 2.0 + PKCE |
| `/api/auth/disconnect.js` | Disconnect platform |

`_supabase.js`, `_wake.js`, `_publish_helpers.js` are underscore-prefixed shared modules (NOT functions).

## Required Vercel env vars (v1.2)
| Key | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | DB writes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Meta OAuth |
| `THREADS_APP_ID` / `THREADS_APP_SECRET` | Threads OAuth |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X OAuth |
| `CRON_SECRET` | cron-job.org → /api/cron/publish gate |
| `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) | AI generation |

## Prioritized backlog

### P0 (next session)
- User completes Meta / Threads / X Developer App setup using the new guides, adds env vars to Vercel, redeploys.
- Live end-to-end test of publishing on all 6 platforms with real accounts.
- Set up cron-job.org with `X-Cron-Secret` header → `CRON_SECRET`.

### P1
- **Review Management module** — fetch Google/Facebook reviews + AI reply queue.
- **Inbox / Customer Communication Center** — Messenger + IG DM webhook handlers, AI auto-reply, lead-capture into `leads` table.
- **Blog publishing bridge** — push to Astro/Next site via Supabase trigger.
- **Settings UI for GBP location / YT channel picker** when user has multiple.

### P2
- **SEO Intelligence Center** — Google Search Console queries + AI gap analysis.
- **Real Analytics Dashboard** — GA4 + Social API aggregation.
- AI image generation (Nano Banana).
- Multi-account support per platform.
- Native mobile app shell.

## Smart enhancement (revenue-relevant)
Add a **Lead Magnet capture flow** inside the Inbox — when a customer DM mentions pricing/availability, AI auto-responds AND saves name + phone to a `leads` table; surface a Leads tab on the dashboard with conversion analytics. Turns marketing into measurable revenue.
