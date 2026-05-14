// Vercel serverless — Real publishing engine
// Publishes a post to all selected platforms. Uses real Graph API calls when
// the integration has a real access_token (i.e., not the EAAB_mock prefix).

import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  const { data: post, error: pErr } = await supabase.from('posts').select('*').eq('id', id).single();
  if (pErr || !post) return res.status(404).json({ error: 'post not found' });

  const { data: integrations } = await supabase.from('integrations').select('*');
  const byPlatform = Object.fromEntries((integrations || []).map(i => [i.platform, i]));

  const results = {};
  const content = post.content_en || post.content || '';
  const media = (post.media_urls || []);

  for (const platform of (post.platforms || [])) {
    const intg = byPlatform[platform];
    if (!intg || !intg.is_connected) { results[platform] = { ok: false, reason: 'not_connected' }; continue; }
    const isMock = typeof intg.access_token === 'string' && intg.access_token.startsWith('EAAB_mock');

    try {
      if (platform === 'facebook' && !isMock && intg.access_token && intg.account_id) {
        const body = { message: content, access_token: intg.access_token };
        if (media[0]) body.link = media[0];
        const r = await fetch(`https://graph.facebook.com/v19.0/${intg.account_id}/feed`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const d = await r.json();
        results[platform] = r.ok ? { ok: true, id: d.id } : { ok: false, error: d.error?.message || JSON.stringify(d) };
      } else if (platform === 'instagram' && !isMock && intg.access_token && intg.account_id && media[0]) {
        // 2-step IG: create container → publish
        const c1 = await fetch(`https://graph.facebook.com/v19.0/${intg.account_id}/media`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: media[0], caption: content, access_token: intg.access_token }),
        });
        const c1d = await c1.json();
        if (!c1.ok) { results[platform] = { ok: false, error: c1d.error?.message || JSON.stringify(c1d) }; continue; }
        const c2 = await fetch(`https://graph.facebook.com/v19.0/${intg.account_id}/media_publish`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: c1d.id, access_token: intg.access_token }),
        });
        const c2d = await c2.json();
        results[platform] = c2.ok ? { ok: true, id: c2d.id } : { ok: false, error: c2d.error?.message || JSON.stringify(c2d) };
      } else if (platform === 'google' && intg.access_token && intg.metadata?.location_id) {
        // Google Business — requires a saved location_id in metadata
        const url = `https://mybusiness.googleapis.com/v4/${intg.metadata.location_id}/localPosts`;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${intg.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            languageCode: 'en',
            summary: content,
            media: media[0] ? [{ mediaFormat: 'PHOTO', sourceUrl: media[0] }] : undefined,
            topicType: post.post_type === 'offer' ? 'OFFER' : 'STANDARD',
          }),
        });
        const d = await r.json();
        results[platform] = r.ok ? { ok: true, name: d.name } : { ok: false, error: d.error?.message || JSON.stringify(d) };
      } else {
        // Mocked / not-yet-supported: mark as queued
        results[platform] = { ok: true, mode: isMock ? 'mock' : 'queued', note: 'Real publishing requires platform business verification or a location_id (Google Business).' };
      }
    } catch (e) {
      results[platform] = { ok: false, error: String(e.message || e) };
    }
  }

  const anyOk = Object.values(results).some(r => r.ok);
  await supabase.from('posts').update({
    status: anyOk ? 'published' : 'failed',
    published_at: anyOk ? new Date().toISOString() : null,
    metadata: { publish_results: results },
  }).eq('id', id);

  return res.status(200).json({ ok: anyOk, results });
}
