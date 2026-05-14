import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const redirectUri =
    'https://sankalp-marketing-hub-v1.vercel.app/api/auth/google';

  try {
    // Start OAuth
    if (req.method === 'GET' && !req.query.code) {
      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth?' +
        new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: 'code',
          access_type: 'offline',
          prompt: 'consent',
          scope:
            'openid email profile https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/youtube.readonly',
        });

      return res.redirect(authUrl);
    }

    // OAuth callback
    if (req.method === 'GET' && req.query.code) {
      const tokenResponse = await fetch(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: req.query.code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        }
      );

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        return res.status(400).json(tokens);
      }

      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      const profile = await profileRes.json();

      const { error } = await supabase
        .from('integrations')
        .upsert(
          {
            platform: 'google',
            is_connected: true,
            access_token: tokens.access_token,
            account_id: profile.id,
            account_name: profile.name,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'platform',
          }
        );

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth-success',
                platform: 'google',
                account: '${profile.name}'
              }, '*');
            }
            window.close();
          </script>
        </body>
        </html>
      `);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ error: err.message });
  }
}
