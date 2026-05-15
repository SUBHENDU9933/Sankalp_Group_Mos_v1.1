// Vercel serverless — Disconnect a connected platform.
// Clears tokens but keeps the row so the UI still shows all 8 platforms.

import supabase from '../_supabase.js';

const LINKED = {
  facebook: ['instagram'], // disconnecting FB also kills IG (same page token)
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { platform } = req.body || {};
    if (!platform) return res.status(400).json({ error: 'platform required' });

    const platforms = [platform, ...(LINKED[platform] || [])];
    for (const p of platforms) {
      await supabase
        .from('integrations')
        .update({
          is_connected: false,
          access_token: null,
          refresh_token: null,
          account_id: null,
          account_name: null,
          metadata: null,
        })
        .eq('platform', p);
    }
    return res.status(200).json({ success: true, disconnected: platforms });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
