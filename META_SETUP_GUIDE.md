# Meta Developer App Setup — Facebook + Instagram

A clear, end-to-end checklist to wire **real** Facebook Page + Instagram Business publishing into Sankalp Marketing Hub.

> Time required: ~20-30 minutes (excluding Meta's app review which only matters if you ever want OTHER users to log in — for your own business it works in **Development mode** out of the box).

---

## Prerequisites

1. A **Facebook Page** for Sankalp Interior Solution (you must be admin).
2. An **Instagram Business** account, linked to that Page (Settings → Linked Accounts → Instagram).
3. A **Meta Business Suite** profile (optional but recommended).

---

## Step 1 — Create the Meta App

1. Go to <https://developers.facebook.com/apps/>.
2. Click **Create App** → **Business** → Next.
3. Fill in:
   - App name: `Sankalp Marketing Hub`
   - App contact email: your email
   - Business portfolio: pick yours, or skip.
4. Click **Create App**.

## Step 2 — Add Products

In the left sidebar of your new app, click **Add Product** and add:

| Product | What it's for |
|---|---|
| **Facebook Login for Business** | Page OAuth |
| **Instagram Graph API** | IG Business publishing |

## Step 3 — Configure Facebook Login Settings

1. Sidebar → **Facebook Login for Business** → **Settings**.
2. **Valid OAuth Redirect URIs** — add:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/facebook
   https://sankalp.yourdomain.com/api/auth/facebook   ← if you have a custom domain
   ```
3. **Allowed Domains for the JavaScript SDK** — add the same hosts (without `/api/...`).
4. Save changes.

## Step 4 — Grab App ID + App Secret

1. Sidebar → **App Settings → Basic**.
2. Copy:
   - **App ID** → goes into `FACEBOOK_APP_ID`
   - **App secret** (click **Show**) → goes into `FACEBOOK_APP_SECRET`
3. Also fill **Privacy Policy URL** + **Terms of Service URL** + **App Icon** (any 1024×1024 PNG). Required to leave Development mode later, but harmless to do now.

## Step 5 — Add to Vercel

In Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `FACEBOOK_APP_ID` | from Step 4 | Production, Preview |
| `FACEBOOK_APP_SECRET` | from Step 4 | Production, Preview |

Click **Redeploy** (Deployments → ⋯ → Redeploy) so the new env vars are picked up.

## Step 6 — Test the Flow

1. Open your live app → **Settings → Integrations**.
2. Click **Connect** on the Facebook card.
3. A Meta consent screen opens. **Make sure you check the Page + Instagram permissions** when prompted.
4. After approving, the popup closes and you should see both **Facebook** and **Instagram** marked as connected.

### What gets stored in Supabase

`integrations` table — two rows updated:

```jsonc
// platform: 'facebook'
{
  is_connected: true,
  access_token: "<long-lived PAGE token>",
  refresh_token: "<long-lived USER token>",     // used to re-fetch pages
  account_id: "<page_id>",
  account_name: "Sankalp Interior Solution",
  metadata: { page_id, user_id, user_name, pages_count, all_pages, connected_at }
}

// platform: 'instagram'
{
  is_connected: true,
  access_token: "<same PAGE token>",
  account_id: "<ig_business_id>",
  account_name: "@sankalpinterior",
  metadata: { ig_business_id, linked_page_id, profile_picture_url, connected_at }
}
```

## Step 7 — Publish a Real Post

Compose a post → select **Facebook** and/or **Instagram** → **Publish now**. The result is in `posts.metadata.publish_results`:

```jsonc
{
  facebook:  { ok: true, id: "100123_456...", url: "https://facebook.com/..." },
  instagram: { ok: true, id: "1789...", container: "1788..." }
}
```

Open Facebook/Instagram in another tab to confirm.

---

## Common errors & fixes

| Error | Fix |
|---|---|
| `URL Blocked: This redirect failed because the redirect URI is not white-listed` | Add your exact Vercel URL to **Valid OAuth Redirect URIs** in Step 3. The protocol must match (`https://`). |
| `No Facebook Pages found on this account` | You must be admin of at least one Page. Create one at <https://facebook.com/pages/create>. |
| `(#200) Permissions error` when posting to FB | The Page wasn't selected during the consent step. **Disconnect** and **Reconnect**, and tick the Page in the permissions screen. |
| `The user must be an Instagram Business or Creator account` | In the IG mobile app → Settings → Account → switch to a **Business** account, then link it to the Facebook Page. |
| `image_url is invalid or inaccessible` | The image must be publicly reachable HTTPS. Supabase Storage public bucket URLs work. |

## Going to "Live" mode (only if you want other users to log in too)

If only you/your team uses the app, **stay in Development mode** — it works perfectly.

If you ever want a customer-facing login:

1. Sidebar → **App Review → Permissions and Features**.
2. Submit for review: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
3. Provide a screencast showing how each scope is used. Approval typically takes 3-7 days.
