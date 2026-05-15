// Vercel serverless — X (Twitter) OAuth 2.0 with PKCE.
//
// Env vars on Vercel:
//   X_CLIENT_ID
//   X_CLIENT_SECRET
//
// Scopes: tweet.read tweet.write users.read offline.access
// State + code_verifier are persisted in a short-lived `oauth_state` Supabase
// table (or fallback: stateless plain-text verifier — less secure).

import supabase from '../_supabase.js';
import crypto from 'crypto';

const SCOPES = 'tweet.read tweet.write users.read offline.access';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function html(title, subtitle, success = true) {
  const color = success ? '#10b981' : '#ef4444';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:32px;border-radius:18px;background:#131B2B;border:1px solid #1E2A42;max-width:380px}
.ok{width:60px;height:60px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px}</style></head>
<body><div class="card"><div class="ok">${success ? '✓' : '×'}</div><h2 style="margin:0 0 6px">${title}</h2>
<p style="margin:0;opacity:.7;font-size:13px">${subtitle}</p></div>
<script>if(window.opener){window.opener.postMessage({type:'oauth-${success ? 'success' : 'error'}',platform:'x'},'*');}setTimeout(()=>window.close(),1800);</script>
</body></html>`;
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/x`;

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (req.method === 'GET' && !req.query.code) {
    if (!clientId) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(html('X not configured', 'Set X_CLIENT_ID and X_CLIENT_SECRET on Vercel.', false));
    }
    // PKCE verifier + challenge
    const verifier = b64url(crypto.randomBytes(32));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(16));

    // Persist verifier (we re-use the integrations.metadata field temporarily on platform 'x')
    await supabase.from('integrations').update({
      metadata: { _pkce_verifier: verifier, _pkce_state: state, _pkce_at: Date.now() },
    }).eq('platform', 'x');

    const authUrl = 'https://twitter.com/i/oauth2/authorize?' + new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    return res.redirect(authUrl);
  }

  if (req.method === 'GET' && req.query.code) {
    try {
      if (!clientId) throw new Error('X_CLIENT_ID not set');

      // Recover verifier
      const { data: row } = await supabase.from('integrations').select('metadata').eq('platform', 'x').maybeSingle();
      const verifier = row?.metadata?._pkce_verifier;
      if (!verifier) throw new Error('PKCE verifier missing — restart the flow.');
      if (row?.metadata?._pkce_state && row.metadata._pkce_state !== req.query.state) {
        throw new Error('State mismatch — possible CSRF.');
      }

      const form = new URLSearchParams({
        code: req.query.code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      });

      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      // Confidential clients must send Basic auth
      if (clientSecret) {
        headers.Authorization = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      }

      const tokRes = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers,
        body: form,
      });
      const tok = await tokRes.json();
      if (!tok.access_token) throw new Error(tok.error_description || tok.error || 'token exchange failed');

      // Fetch user profile
      const meRes = await fetch('https://api.twitter.com/2/users/me?user.fields=username,name,profile_image_url', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      });
      const me = await meRes.json();
      const u = me?.data;
      if (!u?.id) throw new Error('Could not fetch X profile');

      const upsert = {
        platform: 'x',
        is_connected: true,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token || null,
        account_id: u.id,
        account_name: u.username ? `@${u.username}` : u.name,
        metadata: {
          x_user_id: u.id,
          username: u.username,
          name: u.name,
          profile_image_url: u.profile_image_url,
          expires_in: tok.expires_in,
          scope: tok.scope,
          connected_at: new Date().toISOString(),
        },
      };
      const { data: existing } = await supabase.from('integrations').select('id').eq('platform', 'x').maybeSingle();
      if (existing?.id) {
        await supabase.from('integrations').update(upsert).eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert(upsert);
      }

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html('X connected', `@${u.username}`, true));
    } catch (err) {
      console.error('X OAuth error:', err);
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(html('Connection failed', String(err.message || err), false));
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
