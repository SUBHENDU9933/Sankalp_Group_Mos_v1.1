// Vercel Cron — pulls real per-platform metrics into `analytics` daily.
// This is what AnalyticsView.tsx charts. Runs once/day (Vercel Hobby-plan cron limit).
// Configure the schedule in vercel.json.
//
// Covers: Facebook (page fan count), Instagram (followers), YouTube (subscribers +
// total views), X (followers). Google Business Profile Performance API and Threads
// Insights are NOT included yet — GBP's insights API changed significantly and
// Threads has no public follower-count endpoint at the time of writing; both need
// dedicated implementation when you're ready to prioritise them.

import supabase from '../_supabase.js';

async function pullFacebook(intg, debug) {
  const pageId = intg.metadata?.page_id || intg.account_id;
  if (!pageId || !intg.access_token) return { metrics: [], raw: { skipped: 'missing page_id or token' } };
  const r = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=fan_count&access_token=${intg.access_token}`);
  const d = await r.json();
  const metrics = (r.ok && d.fan_count != null) ? [{ metric_type: 'followers', value: d.fan_count }] : [];
  return { metrics, raw: debug ? d : undefined };
}

async function pullInstagram(intg, debug) {
  const igId = intg.metadata?.ig_business_id || intg.account_id;
  if (!igId || !intg.access_token) return { metrics: [], raw: { skipped: 'missing ig_business_id or token' } };
  const r = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=followers_count&access_token=${intg.access_token}`);
  const d = await r.json();
  const metrics = (r.ok && d.followers_count != null) ? [{ metric_type: 'followers', value: d.followers_count }] : [];
  return { metrics, raw: debug ? d : undefined };
}

async function pullYouTube(intg, debug) {
  const channelId = intg.metadata?.channel_id;
  if (!intg.access_token) return { metrics: [], raw: { skipped: 'missing token' } };
  // No stored channel_id (OAuth enrichment may have failed) — fall back to mine=true.
  const url = channelId
    ? `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`
    : `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${intg.access_token}` } });
  const d = await r.json();
  const stats = d.items?.[0]?.statistics;
  const out = [];
  if (stats?.subscriberCount != null) out.push({ metric_type: 'followers', value: Number(stats.subscriberCount) });
  if (stats?.viewCount != null) out.push({ metric_type: 'reach', value: Number(stats.viewCount) });
  return { metrics: out, raw: debug ? d : undefined };
}

async function pullX(intg, debug) {
  const userId = intg.metadata?.x_user_id || intg.account_id;
  if (!userId || !intg.access_token) return { metrics: [], raw: { skipped: 'missing x_user_id or token' } };
  const r = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`, {
    headers: { Authorization: `Bearer ${intg.access_token}` },
  });
  const d = await r.json();
  const followers = d.data?.public_metrics?.followers_count;
  const metrics = followers != null ? [{ metric_type: 'followers', value: followers }] : [];
  return { metrics, raw: debug ? d : undefined };
}

const PULLERS = { facebook: pullFacebook, instagram: pullInstagram, youtube: pullYouTube, x: pullX, twitter: pullX };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const required = process.env.CRON_SECRET;
  if (required) {
    const provided = req.headers['x-cron-secret'] || req.query.key || '';
    if (provided !== required) return res.status(401).json({ error: 'invalid cron secret' });
  }
  const debug = req.query.debug === '1';

  const today = new Date().toISOString().slice(0, 10);
  const { data: integrations, error } = await supabase.from('integrations').select('*').eq('is_connected', true);
  if (error) return res.status(500).json({ error: error.message });

  const results = {};
  const rows = [];
  for (const intg of integrations || []) {
    const puller = PULLERS[intg.platform];
    if (!puller) continue;
    // Mock/unverified tokens (e.g. Facebook/Instagram pre-business-verification) — skip, not an error.
    if (intg.access_token?.startsWith('EAAB_mock')) { results[intg.platform] = 'skipped (mock token)'; continue; }
    try {
      const { metrics, raw } = await puller(intg, debug);
      for (const m of metrics) {
        rows.push({ date: today, platform: intg.platform, metric_type: m.metric_type, value: m.value });
      }
      results[intg.platform] = metrics.length ? `${metrics.length} metric(s)` : 'no data returned';
      if (debug) results[`${intg.platform}_raw`] = raw;
    } catch (e) {
      results[intg.platform] = `error: ${String(e.message || e)}`;
    }
  }

  if (rows.length) {
    // One row per (date, platform, metric_type) per day — delete today's existing rows for
    // these platforms first so re-runs don't duplicate.
    const platforms = [...new Set(rows.map(r => r.platform))];
    await supabase.from('analytics').delete().eq('date', today).in('platform', platforms);
    const { error: insErr } = await supabase.from('analytics').insert(rows);
    if (insErr) return res.status(500).json({ ok: false, error: insErr.message, results });
  }

  return res.status(200).json({ ok: true, date: today, inserted: rows.length, results });
}
