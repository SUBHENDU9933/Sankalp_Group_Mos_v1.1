# Threads (Meta) Developer App Setup

Threads requires a **separate** Meta app from Facebook because the scopes live in its own product.

## Step 1 — Create the Threads app

1. <https://developers.facebook.com/apps/> → **Create App** → **Other** → **Business**.
2. Name: `Sankalp Threads`.
3. In the app dashboard, click **Add Product** → look for **Threads API** → **Set up**.

## Step 2 — Configure Threads OAuth

1. Sidebar → **Threads API → Settings**.
2. **Redirect Callback URLs**:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/threads
   ```
3. App Settings → Basic — copy **App ID** and **App Secret**.

## Step 3 — Add scopes

In **Threads API → Use cases → Customize** enable:
- `threads_basic`
- `threads_content_publish`
- `threads_manage_insights`

## Step 4 — Vercel env vars

| Name | Value |
|---|---|
| `THREADS_APP_ID` | from Step 2 |
| `THREADS_APP_SECRET` | from Step 2 |

Redeploy.

## Step 5 — Connect & publish

1. Settings → Integrations → **Connect Threads**.
2. The popup OAuth flow saves the long-lived token (60 days) and your Threads user ID.
3. Posting flow:
   - **TEXT**: posts immediately.
   - **IMAGE**: 5-second wait between container + publish (handled automatically).
   - **VIDEO**: 15-second wait (large videos may need longer — check `metadata.publish_results.threads.error`).
