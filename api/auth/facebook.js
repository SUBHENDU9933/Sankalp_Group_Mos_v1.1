import supabase from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { code, state, error } = req.query;

  if (req.method === 'GET' && code) {
    try {
      const mockToken = `EAAB_${Math.random().toString(36).substring(2, 15)}`;
      const mockPageId = '123456789';
      const mockPageName = 'Sankalp Interior Solution';

      const { data: existing } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', 'facebook')
        .single();

      if (existing) {
        await supabase
          .from('integrations')
          .update({
            is_connected: true,
            access_token: mockToken,
            account_id: mockPageId,
            account_name: mockPageName,
          })
          .eq('id', existing.id);
      }

      const { data: igExisting } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', 'instagram')
        .single();

      if (igExisting) {
        await supabase
          .from('integrations')
          .update({
            is_connected: true,
            access_token: mockToken,
            account_id: 'ig_' + mockPageId,
            account_name: '@sankalpinterior',
          })
          .eq('id', igExisting.id);
      }

      res.setHeader('Content-Type', 'text/html');
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">✓</div>
            <h1>Connected!</h1>
            <p>Facebook & Instagram linked</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth-success', 
                platform: 'facebook',
                account: '${mockPageName}'
              }, '*');
            }
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error('Facebook OAuth error:', err);
      return res.status(500).send(`<script>window.close();</script>`);
    }
  }

  if (req.method === 'GET') {
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/auth/facebook`;
    return res.redirect(302, `${redirectUri}?code=demo_code_123&state=facebook`);
  }

  res.status(405).json({ error: 'Method not allowed' });
}