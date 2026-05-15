// Vercel serverless — Google OAuth (multi-scope: Business / YouTube / GSC / GA).
// On callback we ALSO fetch the platform-specific account/channel/location and
// save them to integrations.metadata so publishing & analytics work end-to-end.

import supabase from '../_supabase.js';

const SCOPES = {
  google:    'openid email profile https://www.googleapis.com/auth/business.manage',
  business:  'openid email profile https://www.googleapis.com/auth/business.manage',
  youtube:   'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
  gsc:       'openid email profile https://www.googleapis.com/auth/webmasters.readonly',
  ga:        'openid email profile https://www.googleapis.com/auth/analytics.readonly',
};

// Fetch the first YouTube channel for the user.
async function fetchYouTubeChannel(token) {
  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&mine=true', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    const ch = d.items?.[0];
    if (!ch) return null;
    return {
      channel_id: ch.id,
      channel_title: ch.snippet?.title,
      subscribers: ch.statistics?.subscriberCount,
      thumbnail: ch.snippet?.thumbnails?.default?.url,
    };
  } catch { return null; }
}

// Fetch the first Google Business account + first location.
async function fetchGBP(token) {
  try {
    const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const acc = await accRes.json();
    const account = acc.accounts?.[0];
    if (!account) return null;
    const accountId = account.name?.split('/').pop();

    const locRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const loc = await locRes.json();
    const location = loc.locations?.[0];
    const locationId = location?.name?.split('/').pop();
    return {
      gbp_account_id: accountId,
      gbp_account_name: account.accountName,
      location_id: locationId,
      location_title: location?.title,
      all_locations: (loc.locations || []).map(l => ({ id: l.name?.split('/').pop(), title: l.title })),
    };
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/google`;

  try {
    // ===== Start of flow =====
    if (req.method === 'GET' && !req.query.code) {
      const platform = req.query.platform || 'google';
      const scope = SCOPES[platform] || SCOPES.google;
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not set on Vercel' });
      }
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        scope,
        state: platform,
      });
      return res.redirect(authUrl);
    }

    // ===== OAuth callback =====
    if (req.method === 'GET' && req.query.code) {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: req.query.code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenResponse.json();
      if (!tokens.access_token) return res.status(400).json(tokens);

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();

      const platform = req.query.state || 'google';

      // Platform-specific enrichment
      let extraMeta = {};
      if (platform === 'youtube') {
        const yt = await fetchYouTubeChannel(tokens.access_token);
        if (yt) extraMeta = yt;
      } else if (platform === 'google' || platform === 'business') {
        const gbp = await fetchGBP(tokens.access_token);
        if (gbp) extraMeta = gbp;
      }

      const upsertData = {
        is_connected: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        account_id: profile.id,
        account_name: extraMeta.channel_title || extraMeta.gbp_account_name || profile.name || profile.email,
        metadata: {
          email: profile.email,
          picture: profile.picture,
          scope: tokens.scope,
          expires_in: tokens.expires_in,
          connected_at: new Date().toISOString(),
          ...extraMeta,
        },
      };

      const { data: existing } = await supabase.from('integrations').select('id, refresh_token').eq('platform', platform).maybeSingle();
      // Preserve refresh_token if Google didn't return a new one (re-consent re-issues it; otherwise keeps existing)
      if (!tokens.refresh_token && existing?.refresh_token) upsertData.refresh_token = existing.refresh_token;

      if (existing?.id) {
        await supabase.from('integrations').update(upsertData).eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert({ ...upsertData, platform });
      }

      const safeName = String(upsertData.account_name || '').replace(/[<>'"\\]/g, '');
      const subtitle = extraMeta.channel_title
        ? `YouTube · ${safeName}`
        : extraMeta.location_title
          ? `Google Business · ${extraMeta.location_title}`
          : safeName;

      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Connected</title>
<style>body{font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:32px;border-radius:18px;background:#131B2B;border:1px solid #1E2A42;max-width:380px}
.ok{width:60px;height:60px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px}</style></head>
<body><div class="card"><div class="ok">✓</div><h2 style="margin:0 0 6px">Connected</h2>
<p style="margin:0;opacity:.7;font-size:13px">${subtitle}</p></div>
<script>if(window.opener){window.opener.postMessage({type:'oauth-success',platform:'${platform}',account:'${safeName}'},'*');}setTimeout(()=>window.close(),1500);</script></body></html>`);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
