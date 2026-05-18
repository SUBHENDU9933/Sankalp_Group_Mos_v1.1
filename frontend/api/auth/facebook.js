// Vercel serverless — Real Meta OAuth (Facebook Page + Instagram Business).
// Flow:
//   GET /api/auth/facebook                      → redirects to Meta authorize
//   GET /api/auth/facebook?code=...&state=...   → exchange code, fetch Pages,
//                                                 store the FIRST Page token,
//                                                 and detect the linked IG Business account.
//
// Env vars required on Vercel:
//   FACEBOOK_APP_ID
//   FACEBOOK_APP_SECRET
//
// Scopes:
//   pages_show_list, pages_manage_posts, pages_read_engagement,
//   instagram_basic, instagram_content_publish, business_management

import supabase from '../_supabase.js';

const SCOPES = [
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
  'public_profile',
  'email',
].join(',');

function html(title, subtitle, success = true) {
  const color = success ? '#10b981' : '#ef4444';
  const symbol = success ? '✓' : '×';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:32px;border-radius:18px;background:#131B2B;border:1px solid #1E2A42;max-width:380px}
.ok{width:60px;height:60px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px;color:#fff}
small{display:block;opacity:.5;margin-top:10px;font-size:11px}</style></head>
<body><div class="card"><div class="ok">${symbol}</div><h2 style="margin:0 0 6px">${title}</h2>
<p style="margin:0;opacity:.7;font-size:13px">${subtitle}</p>
<small>This window will close automatically.</small></div>
<script>if(window.opener){window.opener.postMessage({type:'oauth-${success ? 'success' : 'error'}',platform:'facebook'},'*');}setTimeout(()=>window.close(),1800);</script>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/facebook`;

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  // -----------------------------------------------------------------------
  // Initiate OAuth — redirect to Meta authorize
  // -----------------------------------------------------------------------
  if (req.method === 'GET' && !req.query.code) {
    if (!appId) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(html(
        'Meta App not configured',
        'Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in Vercel → Settings → Environment Variables. See /app/META_SETUP_GUIDE.md',
        false,
      ));
    }
    const authUrl = 'https://www.facebook.com/v19.0/dialog/oauth?' + new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state: 'facebook',
      scope: SCOPES,
      response_type: 'code',
    });
    return res.redirect(authUrl);
  }

  // -----------------------------------------------------------------------
  // OAuth callback — exchange code, save tokens
  // -----------------------------------------------------------------------
  if (req.method === 'GET' && req.query.code) {
    try {
      if (!appId || !appSecret) throw new Error('META_APP_ID / META_APP_SECRET not set');

      // 1. Exchange code for short-lived user token
      const tokRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: req.query.code,
      }));
      const tok = await tokRes.json();
      if (!tok.access_token) throw new Error(tok.error?.message || 'token exchange failed');

      // 2. Exchange short-lived → long-lived user token (60 days)
      const llRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: tok.access_token,
      }));
      const ll = await llRes.json();
      const userToken = ll.access_token || tok.access_token;

      // 3. Fetch user profile
      const profRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${userToken}`);
      const prof = await profRes.json();

      // 4. Fetch Pages with their page tokens + linked IG accounts
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${userToken}`);
      const pages = await pagesRes.json();
      if (!pages.data?.length) throw new Error('No Facebook Pages found on this account. You must be admin of at least one Page.');

      // Use the FIRST page (or one explicitly chosen via state in future)
      const page = pages.data[0];
      const pageToken = page.access_token; // PAGE TOKEN — long-lived & used for publishing
      const ig = page.instagram_business_account;

      // 5. Upsert Facebook integration
      const fbMeta = {
        page_id: page.id,
        user_id: prof.id,
        user_name: prof.name,
        user_email: prof.email,
        pages_count: pages.data.length,
        all_pages: pages.data.map(p => ({ id: p.id, name: p.name, ig: p.instagram_business_account?.username })),
        connected_at: new Date().toISOString(),
      };
      const fbUpsert = {
        platform: 'facebook',
        is_connected: true,
        access_token: pageToken,
        refresh_token: userToken, // store long-lived user token here for re-fetching pages later
        account_id: page.id,
        account_name: page.name,
        metadata: fbMeta,
      };
      const { data: fbExisting } = await supabase.from('integrations').select('id').eq('platform', 'facebook').maybeSingle();
      if (fbExisting?.id) {
        await supabase.from('integrations').update(fbUpsert).eq('id', fbExisting.id);
      } else {
        await supabase.from('integrations').insert(fbUpsert);
      }

      // 6. Upsert Instagram integration (linked to same Page token)
      if (ig?.id) {
        const igUpsert = {
          platform: 'instagram',
          is_connected: true,
          access_token: pageToken, // SAME page token works for /v19.0/{ig_id}/media
          refresh_token: userToken,
          account_id: ig.id,
          account_name: ig.username ? `@${ig.username}` : (ig.name || 'Instagram'),
          metadata: { ig_business_id: ig.id, linked_page_id: page.id, profile_picture_url: ig.profile_picture_url, connected_at: new Date().toISOString() },
        };
        const { data: igExisting } = await supabase.from('integrations').select('id').eq('platform', 'instagram').maybeSingle();
        if (igExisting?.id) {
          await supabase.from('integrations').update(igUpsert).eq('id', igExisting.id);
        } else {
          await supabase.from('integrations').insert(igUpsert);
        }
      }

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html(
        'Connected to Meta',
        `${page.name}${ig?.username ? ` · @${ig.username}` : ''}`,
        true,
      ));
    } catch (err) {
      console.error('Meta OAuth error:', err);
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(html('Connection failed', String(err.message || err), false));
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
