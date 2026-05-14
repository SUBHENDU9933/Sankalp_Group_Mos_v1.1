import supabase from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    try {
      const { platform } = req.body;
      
      await supabase
        .from('integrations')
        .update({
          is_connected: false,
          access_token: null,
          account_id: null,
          account_name: null,
        })
        .eq('platform', platform);

      // Also disconnect Instagram if Facebook is disconnected
      if (platform === 'facebook') {
        await supabase
          .from('integrations')
          .update({
            is_connected: false,
            access_token: null,
            account_id: null,
            account_name: null,
          })
          .eq('platform', 'instagram');
      }
      
      return res.status(200).json({ success: true, platform });
    } catch (err) {
      console.error('Disconnect error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}