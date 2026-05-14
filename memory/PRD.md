# Sankalp Marketing Hub — PRD

## Original problem statement
Build a self-owned, premium digital marketing operating system (hybrid Buffer.com + Meta Business Suite + Hootsuite alternative) specifically for **Sankalp Interior Solution**. Centralize multi-platform publishing, scheduling, blog management, SEO, review automation, customer communication, analytics, campaigns and AI assistance — all within one visually premium low-recurring-cost private platform.

## Architecture (V1)
- **Frontend**: Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + Recharts + lucide-react. Premium dark theme with brand orange (#F47B20) + royal blue (#1F4FA1) palette, Outfit + Manrope typography. Runs on `/app/frontend` (port 3000) via supervisor → `yarn start`.
- **Backend**: FastAPI shim at `/app/backend` (port 8001) that proxies to Supabase REST using the service-role key + exposes AI endpoints via emergentintegrations (Claude Sonnet 4.5). Gracefully returns `[]` for missing tables.
- **Database**: Supabase Postgres. Schema migration at `/app/supabase_schema.sql` (user must paste into Supabase SQL editor once).
- **Auth**: Supabase Auth — email/password + Google OAuth. Admin seeded: `admin@sankalp.local` / `Sankalp@2026`.
- **AI**: Claude Sonnet 4.5 via Emergent Universal LLM key. Endpoints: caption, hashtags, ad_copy, seo_blog, review_reply, command.
- **Deployment-ready for Vercel**: serverless `/api/*.js` files preserved in `/app/frontend/api` for future Vercel deployment.

## User personas
1. **Super Admin** (business owner) — full control, manage team, billing.
2. **Content Manager** — composer, calendar, blogs, media.
3. **SEO Manager** — SEO center, blog SEO metadata, analytics.
4. **Support Manager** — inbox, reviews, customer responses.
5. **Viewer** — read-only analytics & dashboards.

## Core requirements (static)
- Self-owned, low recurring cost — no SaaS subscription dependency for core ops.
- Manual-first, AI-enhanced — works fully without paid AI.
- Premium commercial-grade SaaS UX with brand orange + royal blue palette.
- Multi-platform: Facebook, Instagram, Threads, X, Google Business, YouTube + GSC + GA.
- Multi-language: English, Bengali, Hindi.

## What's been implemented (2026-05-14)
- ✅ Premium split-screen Login (email/password + Google OAuth) — Supabase-backed
- ✅ Sidebar with grouped nav, brand mark, badges (scheduled/pending), Cmd+K AI button
- ✅ Topbar with global search, notifications, Compose button
- ✅ Dashboard: 4 KPI cards, 7-day reach AreaChart (Recharts), upcoming-posts rail, recent-reviews card, quick-actions grid
- ✅ Content Studio Composer (slide-over, split-screen): post-type selector, multi-platform multi-select, EN/BN/HI editors, AI caption + hashtag generators per language, live platform-morphing preview (FB / IG / X / Threads / Google Business / YouTube)
- ✅ Content Calendar (month grid with platform-colored post chips, week/month toggle)
- ✅ Blogs Manager (list, AI blog generation, edit, publish, delete)
- ✅ Reviews (sentiment-filtered, AI reply suggestion + post reply)
- ✅ Campaigns (create festive / promotional / offer / lead-gen, status)
- ✅ Analytics (stacked bar chart by platform)
- ✅ Integrations (8 brand-color platform cards, real Google OAuth, mocked Facebook/Instagram)
- ✅ Media Library, SEO Center placeholder, Inbox placeholder, Settings
- ✅ Global Cmd/Ctrl+K AI Command Assistant (overlay with suggestions, abort on close)
- ✅ Toast system, skeleton loaders, empty states
- ✅ Backend FastAPI shim with: health, dashboard, CRUD on 6 tables, analytics, AI, Google + Facebook OAuth, publish, disconnect
- ✅ Supabase schema migration SQL (with demo seed data)
- ✅ data-testid coverage on all interactive elements
- ✅ Tested: 100% backend (17/17), ~95% frontend (testing agent iteration 1)

## Prioritized backlog
### P0 (next session)
- User runs `/app/supabase_schema.sql` in Supabase to enable real CRUD persistence
- Wire real Meta Business Login (after FB app verification) replacing the mock
- Implement an actual server-side scheduler/cron (currently posts move to "scheduled" but nothing publishes them — needs a worker)

### P1
- Inbox: real Messenger + Instagram DM webhook handlers + AI auto-replies + lead-capture
- SEO Center: real Search Console + Analytics integration + AI content-gap analysis
- Media Library: direct upload to Supabase Storage + folders/tags/search
- User Management + Role Templates + Audit Logs
- Notification system (in-app + browser push + email)
- Blog publishing → push to a separate Next.js / Astro site via the same Supabase

### P2
- AI image generation (Gemini Nano Banana via Emergent LLM)
- Recurring publishing rules
- Multi-account support for each platform
- Native mobile app

## Smart enhancement (revenue-relevant)
Add a **"Lead Magnet" capture flow** inside the Inbox/AI Replies — when a customer DM asks about pricing or availability, the AI auto-responds and captures the lead's name + phone in a Supabase `leads` table, then surfaces a `Leads` tab on the dashboard with conversion analytics. This directly turns marketing activity into revenue and is a natural fit for an interior design business with high-ticket sales.
