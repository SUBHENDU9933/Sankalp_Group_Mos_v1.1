# Sankalp Marketing Hub — Test Credentials

## Admin Login (Supabase Auth)
- **Email**:    `admin@sankalp.local`
- **Password**: `Sankalp@2026`
- **Role**:     Super Admin
- **Sign-in**:  Email/password form OR Google OAuth

## Supabase Project
- **URL**: `https://vrsossdmdmbmnhmufuts.supabase.co`
- **Anon key**: see `/app/frontend/.env`
- **Service-role key**: see `/app/backend/.env`

## First-time DB setup
1. Open Supabase Dashboard → SQL Editor.
2. Paste `/app/supabase_schema.sql` and run.
3. After upgrading to v1.2, also run `/app/supabase_migration_v1_2.sql`.

## Vercel — Env vars required for v1.2 publishing
See `/app/frontend/.env.example` for the full list. **Critical for real publishing:**

| Provider | Setup guide |
|---|---|
| Google (GBP, YouTube, GSC, GA) | already configured |
| Meta (Facebook + Instagram) | `/app/META_SETUP_GUIDE.md` |
| Threads | `/app/THREADS_SETUP_GUIDE.md` |
| X (Twitter) | `/app/X_SETUP_GUIDE.md` |

## Cron
- `cron-job.org` → `POST https://YOUR-VERCEL-DOMAIN/api/cron/publish`
- Add header **`X-Cron-Secret`** = value of `CRON_SECRET` on Vercel.

## Endpoints
- `GET  /api/dashboard` — KPIs
- `GET|POST|PUT|DELETE /api/{posts|blogs|reviews|campaigns|integrations|media_library|analytics}`
- `POST /api/publish` — body: `{ id: <postId> }` — fires real publishing flow
- `POST /api/cron/publish` — header `X-Cron-Secret: <secret>`
- `POST /api/ai/generate` — Claude/GPT generation
- `GET  /api/auth/{google|facebook|threads|x}` — start OAuth
- `POST /api/auth/disconnect` — body: `{ platform: 'facebook'|... }`

## LLM
- Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `ANTHROPIC_API_KEY`. Fallback: GPT-4o via `OPENAI_API_KEY`.
