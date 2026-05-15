// Vercel Cron — auto-publish scheduled posts whose time has come.
// Secure with a shared secret to prevent abuse from public callers.
// Set CRON_SECRET on Vercel and configure cron-job.org to send the same value
// in the `X-Cron-Secret` header (or `?key=` query string).

import supabase from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Cron-Secret');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Secret gate (optional — only enforced if CRON_SECRET is set)
  const required = process.env.CRON_SECRET;
  if (required) {
    const provided = req.headers['x-cron-secret'] || req.query.key || '';
    if (provided !== required) return res.status(401).json({ error: 'invalid cron secret' });
  }

  const nowIso = new Date().toISOString();
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, scheduled_at, status, platforms')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(25);
    if (error) return res.status(500).json({ error: error.message });

    if (!posts?.length) return res.json({ ok: true, ran_at: nowIso, processed: 0, results: [] });

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const publishUrl = `${proto}://${host}/api/publish`;

    // Mark all due posts as 'publishing' first so concurrent crons don't double-fire
    await supabase.from('posts').update({ status: 'publishing' }).in('id', posts.map(p => p.id));

    const results = [];
    for (const p of posts) {
      try {
        const r = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Cron-Secret': required || '' },
          body: JSON.stringify({ id: p.id }),
        });
        const j = await r.json().catch(() => ({}));
        results.push({ id: p.id, http: r.status, ...j });
      } catch (e) {
        results.push({ id: p.id, ok: false, error: String(e.message || e) });
        // Restore status so it can retry
        await supabase.from('posts').update({ status: 'scheduled' }).eq('id', p.id);
      }
    }
    return res.json({ ok: true, ran_at: nowIso, processed: results.length, results });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
