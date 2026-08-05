# Sankalp Marketing Hub — Local Dev Setup Notes

⚠️ This file previously contained real admin credentials in plaintext, in a **public** repo.
That password should be considered compromised — rotate it in Supabase Auth immediately if it
hasn't been already, and never commit real credentials here again.

## Admin Login (Supabase Auth)
Create your own admin user via Supabase Dashboard → Authentication → Users → Add user,
or store credentials in a local, git-ignored `.env` file — never in a tracked markdown file.

## Supabase Project
- **URL**: `https://vrsossdmdmbmnhmufuts.supabase.co`
- **Anon key / Service-role key**: keep these in Vercel → Settings → Environment Variables
  and in a local, git-ignored `.env` file only. Never commit them.

## First-time DB setup
1. Open Supabase Dashboard → SQL Editor.
2. Paste `/supabase_schema.sql` and run.
3. Run `supabase_migration_v1_2.sql`, `v1_3.sql`, `v1_4.sql` in order as needed.

## Vercel — Env vars required for publishing
See `DEPLOYMENT.md` for the full list.
