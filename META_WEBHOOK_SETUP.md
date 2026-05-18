# Meta Webhooks + WhatsApp Cloud API Setup

You've already created the apps and have credentials. This guide wires them into Sankalp Marketing Hub and verifies everything works.

> ⚠️ **Before you deploy**, ROTATE every secret that was shared in chat (Meta App Secret, Instagram App Secret, WhatsApp permanent access token). Once rotated, paste the NEW values **only** into Vercel → Settings → Environment Variables.

---

## Step 1 — Run the SQL migration

In Supabase → SQL Editor, paste and run:
```
/app/supabase_migration_v1_3.sql
```
This creates the `messages` table that the webhook writes to and that the Inbox view will read from.

## Step 2 — Add env vars on Vercel

| Variable | Value (from your records) |
|---|---|
| `META_APP_ID` | the Facebook/Meta app ID |
| `META_APP_SECRET` | the Facebook/Meta app secret (**rotated**) |
| `INSTAGRAM_APP_ID` | optional — only if you use Instagram Login (separate flow) |
| `INSTAGRAM_APP_SECRET` | optional — only if you use Instagram Login |
| `WHATSAPP_ACCESS_TOKEN` | the WhatsApp permanent access token (**rotated**) |
| `WHATSAPP_PHONE_NUMBER_ID` | the From phone-number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | your WABA ID |
| `META_WEBHOOK_VERIFY_TOKEN` | the shared secret (free text, anything you choose, must match what you'll paste into the Meta webhook config) |
| `CRON_SECRET` | already documented separately |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | already documented |
| `SUPABASE_SERVICE_ROLE_KEY` | already documented |
| `ANTHROPIC_API_KEY` | already documented |

Click **Redeploy** so the new env vars apply.

## Step 3 — Verify the webhook endpoint is reachable

After the Vercel deploy completes, run this from any terminal:

```bash
curl -i "https://mos.sankalpinterior.com/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=ping"
```

Expected response:
```
HTTP/2 200
content-type: text/plain
…

ping
```

If you see `403` with `verify token mismatch`, your `META_WEBHOOK_VERIFY_TOKEN` env var on Vercel doesn't match what you sent in the URL.

## Step 4 — Subscribe webhooks in the Meta app

### Facebook Page / Instagram
1. Meta Developers → your app → **Webhooks** → **Page** (or **Instagram**).
2. Click **Edit Subscription** / **Add Subscription**.
3. **Callback URL**: `https://mos.sankalpinterior.com/api/webhooks/meta`
4. **Verify Token**: the same string you set as `META_WEBHOOK_VERIFY_TOKEN`.
5. Click **Verify and Save**. The endpoint will receive a `GET ?hub.mode=subscribe&hub.verify_token=…` and respond `200 OK` with the challenge — this confirms the wiring.
6. Subscribe to these fields:
   - **Page**: `messages`, `messaging_postbacks`, `feed` (for comments)
   - **Instagram**: `messages`, `comments`, `mentions`
7. In **Page Token** section, also subscribe each Page you manage (click each Page name).

### WhatsApp
1. Same app → **WhatsApp → Configuration → Webhook**.
2. **Callback URL**: `https://mos.sankalpinterior.com/api/webhooks/meta` (same endpoint — handles all three sources).
3. **Verify Token**: same `META_WEBHOOK_VERIFY_TOKEN`.
4. Click **Verify and Save**.
5. Subscribe to webhook fields: `messages` (minimum) — covers inbound + delivery statuses.

## Step 5 — Test the live flow

### Test Facebook Messenger
- Send a message to your Page from a personal Facebook account.
- Within ~1 second, Supabase `messages` table should have a new row:
  - `channel: 'page'`
  - `event_type: 'message'`
  - `text: 'your test text'`
  - `sender_id`, `received_at`, full `raw` payload populated.

### Test Instagram DM
- Send a DM to your linked Instagram Business account.
- Expect a row with `channel: 'instagram'`, `event_type: 'message'`.

### Test WhatsApp inbound
- Send a WhatsApp message to your business number from your phone.
- Expect a row with `channel: 'whatsapp'`, `event_type: 'text'` (or `image`, `audio`, etc.).

### Test WhatsApp outbound
The publish engine now treats `whatsapp` as a platform. Create a post like:
```json
{
  "platforms": ["whatsapp"],
  "content_en": "Hello from Sankalp 👋",
  "metadata": { "whatsapp": { "recipients": ["+91XXXXXXXXXX"] } }
}
```
…then call `POST /api/publish` with `{ "id": <post_id> }`. Or for a template (required for first contact outside 24h window):
```json
"metadata": {
  "whatsapp": {
    "recipients": ["+91XXXXXXXXXX"],
    "template": "hello_world",
    "language": "en_US"
  }
}
```

## Step 6 — Signature verification

The webhook automatically verifies the `X-Hub-Signature-256` header against `META_APP_SECRET`. Events that fail verification are dropped silently and never written to the DB (anti-spoofing).

If you ever see `[meta-webhook] signature verification failed` in Vercel logs, it means either:
- The wrong app secret is configured.
- Someone (or a stale subscription) is hitting your endpoint with payloads signed by a different app.

---

## What's next

- The webhook writes raw events; the in-app **Inbox view** will surface them. That UI piece is on the P1 backlog (Customer Communication Center).
- WhatsApp Business templates must be pre-approved in Meta Business Manager before you can send them outside the 24-hour conversation window.
- For high volume, consider moving message processing into a background queue. For your current scale, the inline insert is fine.
