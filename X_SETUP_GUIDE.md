# X (Twitter) Developer App Setup

Wire up the **X** publishing card in Sankalp Marketing Hub. OAuth 2.0 + PKCE — modern, no OAuth 1.0a signing.

> Time required: ~10 minutes. Free tier is enough for posting (~50 writes/day).

---

## Step 1 — Apply for / log into Developer Portal

1. Go to <https://developer.x.com/en/portal/dashboard>.
2. Sign in with the X account that owns Sankalp Interior Solution's handle.
3. Apply for **Free** access if you haven't already. Approval is usually instant.

## Step 2 — Create a Project + App

1. Click **+ Add Project**. Name it `Sankalp Marketing Hub`.
2. Choose **Free** tier.
3. Inside the project click **+ Add App** → name it `Sankalp Hub`.
4. Save the **API Key**, **API Secret**, **Bearer Token** when shown (we won't need these for OAuth 2.0 but keep them safe).

## Step 3 — User Authentication Settings

1. App overview → **User Authentication Settings → Set up**.
2. **App permissions**: **Read and write** (write needed for posting tweets).
3. **Type of App**: **Web App, Automated App or Bot** (Confidential client).
4. **Callback URI / Redirect URL**:
   ```
   https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/x
   ```
5. **Website URL**: your business website.
6. Save. You'll now see **OAuth 2.0 Client ID** and **Client Secret** at the top.

## Step 4 — Add to Vercel

| Name | Value |
|---|---|
| `X_CLIENT_ID` | OAuth 2.0 Client ID |
| `X_CLIENT_SECRET` | OAuth 2.0 Client Secret |

Redeploy.

## Step 5 — Connect & Post

1. Settings → Integrations → click **Connect** on the X card.
2. Approve the scopes (Read + Write + offline_access).
3. Compose a post under 280 chars and select **X** as the target.
4. After publish, `posts.metadata.publish_results.x.id` will hold the tweet ID and `url` the permalink.

> Media on X requires the older v1.1 upload endpoint with OAuth 1.0a — out of scope for this build. Text-only and link-card embeds work great.
