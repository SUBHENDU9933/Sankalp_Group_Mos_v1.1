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

## What's been implemented (updated 2026-05-15 — v1.1.0 release)
- ✅ Premium split-screen Login (email/password + Google OAuth) — Supabase-backed (signup hidden, TOS removed)
- ✅ Sidebar with grouped nav, brand mark, badges, Cmd+K AI button — slide-in drawer on mobile
- ✅ Topbar with hamburger on mobile, search on desktop, **🌗 dark/light theme toggle**
- ✅ **Mobile-app UX**: BottomNav with FAB compose + slide-up "More" sheet, agenda calendar, full-screen Composer with Edit/Preview tabs, safe-area-aware
- ✅ PWA-ready — Add to Home Screen launches full-screen with brand icon
- ✅ Dashboard: KPIs, AreaChart, upcoming rail (click → edit), recent reviews, quick actions, **Onboarding Checklist**
- ✅ **Posts Queue** (Buffer-style) with filter tabs, search, row actions (edit/duplicate/delete/publish-now)
- ✅ Content Studio Composer: post-type, multi-platform, EN/BN/HI editors, AI caption + hashtag, live preview, **media upload + library picker**, edit mode
- ✅ Content Calendar — desktop 7-col grid + mobile agenda view; click-to-edit + compose-for-a-date
- ✅ Blogs Manager (CRUD + AI generation), Reviews (AI replies), Campaigns, Analytics, Integrations, **Notifications activity feed**, Settings
- ✅ Global Cmd/Ctrl+K AI Command Assistant
- ✅ **Vercel serverless** (6 functions, under Hobby's 12 limit): consolidated `/api/[resource].js`, AI generate, publish, Google OAuth (multi-scope), Facebook mock, disconnect, cron
- ✅ Backend FastAPI shim at `/app/backend` for the Emergent preview environment
- ✅ Real publishing engine — FB Graph API + IG media-publish + GBP localPosts when real tokens present
- ✅ Supabase schema + DEPLOYMENT.md + CHANGELOG.md + README.md + .env.example
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
