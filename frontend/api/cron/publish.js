// Vercel Cron — auto-publish scheduled posts whose time has come.
// Hobby plan: cron may run at most once per day. For minute-level publishing,
// either upgrade to Vercel Pro or trigger this endpoint via an external scheduler
// like cron-job.org (free) every minute.
import supabase from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const nowIso = new Date().toISOString();
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, scheduled_at, status, platforms')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso)
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const publishUrl = `${proto}://${host}/api/publish`;

    const results = [];
    for (const p of posts || []) {
      try {
        const r = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id }),
        });
        const j = await r.json();
        results.push({ id: p.id, ok: r.ok, ...j });
      } catch (e) {
        results.push({ id: p.id, ok: false, error: String(e.message || e) });
      }
    }
    return res.json({ ok: true, ran_at: nowIso, processed: results.length, results });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
