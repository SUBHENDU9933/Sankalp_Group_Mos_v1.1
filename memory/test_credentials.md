# Sankalp Marketing Hub — Test Credentials

## Login (Supabase Auth)
- **Email**:    `admin@sankalp.local`
- **Password**: `Sankalp@2026`
- **Role**:     Super Admin
- **Sign-in**:  Email/password form OR Google OAuth (Supabase will require the Google app to be authorized for this Supabase project)

## Supabase Project
- **URL**: `https://vrsossdmdmbmnhmufuts.supabase.co`
- **Anon key** is in `/app/frontend/.env`
- **Service-role key** is in `/app/backend/.env`

## Important: First-time setup
Before live CRUD works you must run the schema SQL once:
1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `/app/supabase_schema.sql`
3. Run it once

The dashboard shows a friendly banner reminding you to do this, and all list APIs return `[]` gracefully until the tables exist.

## API base URL (preview)
- `https://72cccfa0-2418-4298-8300-871f82f5f3cd.preview.emergentagent.com/api/*`

## Endpoints to know
- `GET /api/health` – health check
- `GET /api/dashboard` – KPIs + recent/upcoming
- `GET|POST|PUT|DELETE /api/{posts|blogs|reviews|campaigns|integrations|media_library}`
- `POST /api/ai/generate` – AI assistance (Claude Sonnet 4.5 via Emergent LLM)
- `GET /api/auth/google` – Google OAuth start
- `GET /api/auth/facebook` – Mock Facebook OAuth (until business verification)
- `POST /api/auth/disconnect` – Disconnect a platform
- `POST /api/publish` – Mark a post as published

## LLM
- Claude Sonnet 4.5 via Emergent Universal LLM key (already in backend .env)
