# Changelog

All notable changes to **Sankalp Marketing Hub** are documented here.

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
