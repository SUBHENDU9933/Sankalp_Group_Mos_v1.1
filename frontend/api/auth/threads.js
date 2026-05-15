// Vercel serverless — Threads OAuth (Meta Threads Graph API).
// Threads requires a SEPARATE app/auth flow from Facebook/Instagram.
//
// Env vars on Vercel:
//   THREADS_APP_ID
//   THREADS_APP_SECRET
//
// Scopes: threads_basic, threads_content_publish, threads_manage_insights

import supabase from '../_supabase.js';

const SCOPES = 'threads_basic,threads_content_publish,threads_manage_insights';

function html(title, subtitle, success = true) {
  const color = success ? '#10b981' : '#ef4444';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:32px;border-radius:18px;background:#131B2B;border:1px solid #1E2A42;max-width:380px}
.ok{width:60px;height:60px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px}</style></head>
<body><div class="card"><div class="ok">${success ? '✓' : '×'}</div><h2 style="margin:0 0 6px">${title}</h2>
<p style="margin:0;opacity:.7;font-size:13px">${subtitle}</p></div>
<script>if(window.opener){window.opener.postMessage({type:'oauth-${success ? 'success' : 'error'}',platform:'threads'},'*');}setTimeout(()=>window.close(),1800);</script>
</body></html>`;
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/threads`;

  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET;

  if (req.method === 'GET' && !req.query.code) {
    if (!appId) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(html('Threads not configured', 'Set THREADS_APP_ID and THREADS_APP_SECRET on Vercel.', false));
    }
    const authUrl = 'https://threads.net/oauth/authorize?' + new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      response_type: 'code',
    });
    return res.redirect(authUrl);
  }

  if (req.method === 'GET' && req.query.code) {
    try {
      if (!appId || !appSecret) throw new Error('THREADS_APP_ID / THREADS_APP_SECRET not set');

      // Exchange code for short-lived token
      const form = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: req.query.code,
      });
      const tokRes = await fetch('https://graph.threads.net/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      const tok = await tokRes.json();
      if (!tok.access_token) throw new Error(tok.error_message || tok.error?.message || 'token exchange failed');

      // Exchange to long-lived (60d)
      const llRes = await fetch(`https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${tok.access_token}`);
      const ll = await llRes.json();
      const accessToken = ll.access_token || tok.access_token;

      // Fetch profile
      const profRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`);
      const prof = await profRes.json();
      if (!prof.id) throw new Error('Could not fetch Threads profile');

      const upsert = {
        platform: 'threads',
        is_connected: true,
        access_token: accessToken,
        account_id: prof.id,
        account_name: prof.username ? `@${prof.username}` : prof.name,
        metadata: {
          threads_user_id: prof.id,
          username: prof.username,
          profile_picture_url: prof.threads_profile_picture_url,
          connected_at: new Date().toISOString(),
        },
      };
      const { data: existing } = await supabase.from('integrations').select('id').eq('platform', 'threads').maybeSingle();
      if (existing?.id) {
        await supabase.from('integrations').update(upsert).eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert(upsert);
      }

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html('Threads connected', `@${prof.username || prof.name}`, true));
    } catch (err) {
      console.error('Threads OAuth error:', err);
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(html('Connection failed', String(err.message || err), false));
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
