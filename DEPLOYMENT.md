# Sankalp Marketing Hub — Vercel Deployment Guide

## ✅ One-time setup (do this once after the latest deploy)

### 1. Supabase — run the schema
- Supabase Dashboard → SQL Editor → paste **`/app/supabase_schema.sql`** → Run.
- Creates 7 tables + seed demo data.

### 2. Supabase — enable Google provider (needed for the "Continue with Google" login button)
- Auth → Providers → Google → **Enable**
- Client ID / Secret: get these from Google Cloud Console → APIs & Services → Credentials.
  ⚠️ Never paste real values into this file — it is committed to a public repo.
- Auth → URL Configuration:
  - Site URL: `https://mos.sankalpinterior.com`
  - Additional Redirect URLs:
    ```
    https://mos.sankalpinterior.com/**
    https://sankalp-marketing-operations-system-v1-2x7ehdhcj.vercel.app/**
    http://localhost:3000/**
    ```

### 3. Supabase Storage — create a public bucket for media uploads
- Storage → **New bucket** → name: `media` → **Public bucket** ON → Create.
- (No policies needed because we toggled "Public bucket". The Composer uploads here directly.)

### 4. Google Cloud OAuth — authorized URIs
**Authorized JavaScript origins (3):**
```
https://mos.sankalpinterior.com
https://sankalp-marketing-operations-system-v1-2x7ehdhcj.vercel.app
http://localhost:3000
```
**Authorized redirect URIs (3):**
```
https://vrsossdmdmbmnhmufuts.supabase.co/auth/v1/callback
https://mos.sankalpinterior.com/api/auth/google
https://sankalp-marketing-operations-system-v1-2x7ehdhcj.vercel.app/api/auth/google
```

### 5. Vercel — Environment Variables
Settings → Environment Variables → add ALL of these (Production + Preview + Development):

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vrsossdmdmbmnhmufuts.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → "anon / publishable" key |
| `VITE_SUPABASE_URL` | `https://vrsossdmdmbmnhmufuts.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | same anon/publishable key as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → "service_role" key — **never commit this anywhere, it bypasses RLS entirely** |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console (see step 4) |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console — **never commit this** |
| `ANTHROPIC_API_KEY` | **YOUR Anthropic key** — get one at https://console.anthropic.com → API Keys → Create Key (Claude Sonnet 4.5) |
| `OPENAI_API_KEY` *(optional fallback)* | Your OpenAI key if you don't want to use Anthropic |
| `VITE_BACKEND_URL` | *(leave empty)* — frontend then uses relative /api/* on same domain |
| `WHATSAPP_TOKEN` *(optional)* | WhatsApp Cloud API permanent access token, for outbound WhatsApp posting |
| `WHATSAPP_PHONE_NUMBER_ID` *(optional)* | WhatsApp Cloud API phone_number_id |
| `WHATSAPP_TO` *(optional)* | Comma-separated recipient number(s) in E.164 format |
| `CRON_SECRET` *(optional but recommended)* | Any random string — protects `/api/cron/publish` and `/api/cron/analytics` from public callers |

After saving env vars, click **Redeploy** so the new envs are picked up.

> **About AI cost:** Each AI call uses ~1k-2k tokens (~$0.005 with Claude Sonnet 4.5). For internal team use it's pennies per day.

---

## 🔌 Connecting platforms (Integrations page)

### Google Business — REAL
1. Sign in to the app.
2. Integrations → click **Connect** on Google Business.
3. Choose your Google account → grant business.manage scope → done.
4. The first publish to Google Business will currently mark as `queued` because we need to save your Business Profile **location_id** in the integration's metadata. (V1.1 will add a location-picker UI.) For now you can manually paste your location_id into the `integrations` row via Supabase if you want immediate publishing.

### YouTube — REAL
1. Integrations → Connect YouTube → grant the yt scopes.
2. The token is stored; video upload UI is a P2 (deferred — YouTube uses resumable uploads which need a dedicated upload page).

### Facebook + Instagram — currently MOCKED
- Until Meta business verification is complete, `/api/auth/facebook` returns a mock token.
- After verification:
  1. Update `/app/frontend/api/auth/facebook.js` to do the real Facebook Login flow with `pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish` scopes.
  2. Save the **page access token** (not the user token) into `integrations.access_token`.
  3. Save the **Page ID** into `account_id`.
  4. Real publishing will work automatically — `/api/publish` already calls Graph API when the token is real (not prefixed `EAAB_mock`).

### Threads + X — deferred
No public publishing API without enterprise approvals.

---

## 🧪 Quick verification
1. Open `https://mos.sankalpinterior.com`.
2. Sign in with Google or use `admin@sankalp.local` / `Sankalp@2026`.
3. Click **Compose** → write a caption → click **AI caption** → if you see a generated caption, AI works.
4. Click the image button → upload a photo → it shows below the editor.
5. Click **Publish now** → status flips to published.
6. Dashboard → click the **sun/moon** icon in the topbar to toggle light/dark.

---

## ⚙️ Optional — scheduled publishing
Vercel Cron can hit `/api/cron/publish` every minute to publish posts whose `scheduled_at < now()`. We'll add this in V1.1.

## 📂 Files of note
- `/app/frontend/api/ai/generate.js` — AI endpoint (Anthropic + OpenAI)
- `/app/frontend/api/publish.js` — Real publishing engine (Graph API + GBP)
- `/app/frontend/api/auth/google.js` — Multi-scope Google OAuth
- `/app/frontend/api/auth/facebook.js` — Mock FB/IG OAuth (replace after Meta verification)
- `/app/frontend/api/_supabase.js` — Supabase server client
- `/app/supabase_schema.sql` — DB schema
- `/app/memory/test_credentials.md` — login credentials
