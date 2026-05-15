# Sankalp Marketing Hub — v1.1.0

A self-owned hybrid digital marketing operating system for **Sankalp Interior Solution**.
A premium internal alternative to Buffer / Hootsuite / Meta Business Suite, with multi-platform publishing, AI assistance, blog management, review automation, and analytics — all on a low recurring-cost stack (Vite + Vercel + Supabase).

## 🚀 Stack
- **Frontend**: Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + Recharts
- **Backend**: 6 Vercel serverless functions (`/api/*`) + Supabase Postgres + Storage
- **AI**: Anthropic Claude Sonnet 4.5 (or OpenAI GPT-4o fallback)
- **Auth**: Supabase Auth (email/password + Google OAuth)

## ✨ Features

| Module | Status |
|--------|--------|
| Dashboard + KPIs + Onboarding checklist | ✅ |
| Posts Queue (Buffer-style) | ✅ |
| Content Studio Composer (multi-language, multi-platform, AI, live preview) | ✅ |
| Content Calendar (desktop grid + mobile agenda) | ✅ |
| Media Library (upload, search, delete, picker) | ✅ |
| Blog Manager + AI generation | ✅ |
| Review management + AI replies | ✅ |
| Campaigns | ✅ |
| Analytics | ✅ |
| Integrations (Google Business, YouTube, Search Console, Analytics) | ✅ Real |
| Facebook + Instagram | ⏳ Mocked until Meta verification |
| Threads + X | ⏳ Deferred |
| Inbox + DM automation | ⏳ V1.2 |
| Mobile-app UI (BottomNav, drawer, agenda) | ✅ |
| Dark / Light theme | ✅ |
| Vercel Cron (scheduled publishing) | ✅ Hourly |

## 📦 Project structure

```
/
├── frontend/              ← Vercel project root
│   ├── api/               ← serverless functions
│   │   ├── [resource].js  ← CRUD for posts/blogs/reviews/etc + dashboard
│   │   ├── ai/generate.js ← AI text generation
│   │   ├── publish.js     ← Real publishing engine
│   │   ├── cron/publish.js ← Vercel Cron worker
│   │   └── auth/          ← Google + Facebook OAuth
│   ├── src/
│   │   ├── components/    ← All React components
│   │   ├── hooks/         ← React hooks
│   │   ├── lib/           ← API client, Supabase, platforms, upload
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
├── backend/               ← FastAPI shim (Emergent preview only — NOT deployed to Vercel)
├── supabase_schema.sql    ← Database schema migration
├── DEPLOYMENT.md          ← Detailed deployment guide
├── CHANGELOG.md
└── README.md
```

## 🛠️ Setup (production / Vercel)

See **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** for the full step-by-step guide. Quick version:

1. **Supabase**: run [`supabase_schema.sql`](./supabase_schema.sql) → enable Google auth provider → create public `media` bucket → add upload policy
2. **Google Cloud**: add authorized origins + redirect URIs for your Vercel domain + Supabase callback
3. **Vercel**: connect this repo → set Root Directory to `frontend` → add env vars from [`frontend/.env.example`](./frontend/.env.example)
4. **Deploy**: push to `main` → Vercel auto-builds. AI starts working as soon as `ANTHROPIC_API_KEY` is set

## 🔑 Default credentials (development)

- Email: `admin@sankalp.local`
- Password: `Sankalp@2026`
- (Or sign in with Google after the Supabase Google provider is enabled)

## 📱 Mobile app

Built-in PWA support — open `mos.sankalpinterior.com` on iPhone/Android → **Share → Add to Home Screen** → launches full-screen with the Sankalp icon and full BottomNav UI.

## 🗺️ Roadmap (V1.2+)

- Real Facebook + Instagram publishing (after Meta business verification)
- Google Business location-picker UI
- YouTube video upload page (resumable uploads)
- Unified Inbox with DM webhooks + AI auto-reply + Lead capture
- SEO Center with real Search Console + Analytics data
- Service Worker for offline draft composing
- Team members & granular roles (Super Admin / Content / SEO / Support / Viewer)
- Approval workflow

## 📄 License

Private internal software for Sankalp Interior Solution. Not for public distribution.
