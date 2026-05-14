import supabase from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { code, state } = req.query;

  if (req.method === 'GET' && code) {
    try {
      const platform = state || 'google';
      const mockToken = `ya29.${Math.random().toString(36).substring(2, 15)}`;
      
      let accountName = 'Sankalp Interior Solution';
      let accountId = 'gbp_12345';
      
      if (platform === 'youtube') {
        accountName = 'Sankalp Interior';
        accountId = 'UC_abc123';
      }

      const { data: existing } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', platform)
        .single();

      if (existing) {
        await supabase
          .from('integrations')
          .update({
            is_connected: true,
            access_token: mockToken,
            account_id: accountId,
            account_name: accountName,
          })
          .eq('id', existing.id);
      }

      res.setHeader('Content-Type', 'text/html');
      const platformName = platform === 'google' ? 'Google Business Profile' : 'YouTube';
      const emoji = platform === 'google' ? '🏢' : '📺';
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connected!</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #4285F4 0%, #34A853 100%);
              color: white;
            }
            .card {
              background: white;
              color: #1a1a1a;
              padding: 40px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 320px;
            }
            .check {
              width: 60px;
              height: 60px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 30px;
              color: white;
            }
            h1 { margin: 0 0 10px; font-size: 22px; }
            p { margin: 0; opacity: 0.7; font-size: 14px; }
            .emoji { font-size: 40px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="emoji">${emoji}</div>
            <div class="check">✓</div>
            <h1>Connected!</h1>
            <p>${platformName} linked</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth-success', 
                platform: '${platform}',
                account: '${accountName}'
              }, '*');
            }
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error('Google OAuth error:', err);
      return res.status(500).send(`<script>window.close();</script>`);
    }
  }

  if (req.method === 'GET') {
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/auth/google`;
    const platform = req.query.platform || 'google';
    return res.redirect(302, `${redirectUri}?code=demo_google_123&state=${platform}`);
  }

  res.status(405).json({ error: 'Method not allowed' });
}