// Vercel serverless — Consolidated CRUD + dashboard endpoint.
// Handles: posts, blogs, reviews, campaigns, integrations, media, media_library,
// analytics, dashboard.  One file = one serverless function (Hobby plan limit).
import supabase from './_supabase.js';

const TABLES = {
  posts: { table: 'posts', order: 'scheduled_at.asc.nullslast', filters: ['status', 'platform'] },
  blogs: { table: 'blogs', order: 'created_at.desc', filters: ['status'] },
  reviews: { table: 'reviews', order: 'created_at.desc', filters: ['sentiment', 'status'] },
  campaigns: { table: 'campaigns', order: 'created_at.desc', filters: ['status'] },
  integrations: { table: 'integrations', order: 'platform.asc', filters: ['platform'] },
  media: { table: 'media_library', order: 'created_at.desc', filters: ['folder'] },
  media_library: { table: 'media_library', order: 'created_at.desc', filters: ['folder'] },
  analytics: { table: 'analytics', order: 'date.asc', filters: ['metric_type', 'platform'] },
};

function safe(err) {
  const msg = (err && (err.message || err.toString())) || 'unknown';
  return /schema cache|does not exist|PGRST205/.test(msg);
}

async function handleDashboard(req, res) {
  try {
    const [posts, blogs, reviews, campaigns] = await Promise.all([
      supabase.from('posts').select('id,status,scheduled_at,created_at,platforms,title,content,media_urls'),
      supabase.from('blogs').select('id,status,title,created_at'),
      supabase.from('reviews').select('id,sentiment,status,rating,created_at,reviewer_name,comment,platform,reply_text'),
      supabase.from('campaigns').select('id,status,name,created_at'),
    ]);
    const arr = (x) => x?.data || [];
    const p = arr(posts), b = arr(blogs), r = arr(reviews), c = arr(campaigns);
    const cnt = (xs, k = 'status') => xs.reduce((a, x) => (a[x[k] || 'unknown'] = (a[x[k] || 'unknown'] || 0) + 1, a), {});
    const pc = cnt(p), bc = cnt(b), rc = cnt(r), sc = cnt(r, 'sentiment'), cc = cnt(c);
    const ratings = r.map(x => x.rating).filter(Boolean);
    const avg = ratings.length ? Math.round((ratings.reduce((a, x) => a + x, 0) / ratings.length) * 10) / 10 : 0;
    const now = new Date().toISOString();
    const upcoming = p.filter(x => x.status === 'scheduled' && (x.scheduled_at || '') >= now)
      .sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
      .slice(0, 6);
    const recentPosts = [...p].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5);
    const recentReviews = [...r].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5);
    const anyErr = [posts, blogs, reviews, campaigns].find(x => x.error);
    const needs_schema = anyErr && safe(anyErr.error);
    return res.json({
      stats: {
        scheduledPosts: pc.scheduled || 0, draftPosts: pc.draft || 0, publishedPosts: pc.published || 0,
        draftBlogs: bc.draft || 0, publishedBlogs: bc.published || 0,
        pendingReviews: rc.pending || 0,
        positiveReviews: sc.positive || 0, negativeReviews: sc.negative || 0, neutralReviews: sc.neutral || 0,
        activeCampaigns: cc.active || 0,
        totalPosts: p.length, totalBlogs: b.length, totalReviews: r.length, avgRating: avg,
      },
      recentPosts, upcomingPosts: upcoming, recentReviews,
      ...(needs_schema ? { needs_schema: true, schema_error: 'Run /app/supabase_schema.sql in Supabase SQL editor.' } : {}),
    });
  } catch (e) {
    return res.json({
      stats: { scheduledPosts: 0, draftPosts: 0, publishedPosts: 0, draftBlogs: 0, publishedBlogs: 0, pendingReviews: 0, positiveReviews: 0, negativeReviews: 0, activeCampaigns: 0, totalPosts: 0, totalBlogs: 0, avgRating: 0 },
      recentPosts: [], upcomingPosts: [], recentReviews: [],
      needs_schema: true, schema_error: String(e.message || e),
    });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const resource = req.query.resource;

  if (resource === 'dashboard') return handleDashboard(req, res);

  const cfg = TABLES[resource];
  if (!cfg) return res.status(404).json({ error: `Unknown resource: ${resource}` });

  try {
    if (req.method === 'GET') {
      let q = supabase.from(cfg.table).select('*');
      for (const f of cfg.filters) {
        const v = req.query[f];
        if (v) q = q.eq(f, v);
      }
      if (req.query.days && cfg.table === 'analytics') {
        const start = new Date(); start.setDate(start.getDate() - Number(req.query.days));
        q = q.gte('date', start.toISOString().slice(0, 10));
      }
      const [field, dir, ...mods] = cfg.order.split('.');
      const ascending = dir === 'asc';
      const nullsFirst = mods.includes('nullsfirst');
      q = q.order(field, { ascending, nullsFirst });
      const { data, error } = await q;
      if (error) {
        if (safe(error)) return res.json([]);
        throw error;
      }
      return res.json(data || []);
    }
    if (req.method === 'POST') {
      const body = { ...(req.body || {}) };
      if (!body.created_at) body.created_at = new Date().toISOString();
      const { data, error } = await supabase.from(cfg.table).insert(body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body || {};
      if (id == null) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from(cfg.table).update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (id == null) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from(cfg.table).delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
