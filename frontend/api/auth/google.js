// Vercel serverless — Google OAuth (multi-scope per platform)
// Handles: Google Business, YouTube, Search Console, Analytics
// Uses dynamic host from x-forwarded-host so it works on every custom domain.

import supabase from '../_supabase.js';

const SCOPES = {
  google:    'openid email profile https://www.googleapis.com/auth/business.manage',
  business:  'openid email profile https://www.googleapis.com/auth/business.manage',
  youtube:   'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
  gsc:       'openid email profile https://www.googleapis.com/auth/webmasters.readonly',
  ga:        'openid email profile https://www.googleapis.com/auth/analytics.readonly',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/google`;

  try {
    // Start of flow
    if (req.method === 'GET' && !req.query.code) {
      const platform = req.query.platform || 'google';
      const scope = SCOPES[platform] || SCOPES.google;
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope,
        state: platform,
      });
      return res.redirect(authUrl);
    }

    // OAuth callback
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

      const state = req.query.state || 'google';
      const upsertData = {
        is_connected: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        account_id: profile.id,
        account_name: profile.name || profile.email,
        metadata: { email: profile.email, picture: profile.picture, scope: tokens.scope, expires_in: tokens.expires_in },
      };

      const { data: existing } = await supabase.from('integrations').select('id').eq('platform', state).maybeSingle();
      if (existing?.id) {
        await supabase.from('integrations').update(upsertData).eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert({ ...upsertData, platform: state });
      }

      const safeName = (profile.name || profile.email || state).replace(/[<>'"\\]/g, '');
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Connected</title>
<style>body{font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:32px;border-radius:18px;background:#131B2B;border:1px solid #1E2A42}
.ok{width:60px;height:60px;border-radius:50%;background:#F47B20;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px}</style></head>
<body><div class="card"><div class="ok">✓</div><h2 style="margin:0 0 6px">Connected</h2><p style="margin:0;opacity:.7;font-size:13px">${safeName}</p></div>
<script>if(window.opener){window.opener.postMessage({type:'oauth-success',platform:'${state}',account:'${safeName}'},'*');}setTimeout(()=>window.close(),1200);</script></body></html>`);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
