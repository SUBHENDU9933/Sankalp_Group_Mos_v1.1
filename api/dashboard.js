import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const [posts, blogs, reviews, campaigns] = await Promise.all([
        supabase.from('posts').select('id, status', { count: 'exact' }),
        supabase.from('blogs').select('id, status', { count: 'exact' }),
        supabase.from('reviews').select('id, sentiment, status', { count: 'exact' }),
        supabase.from('campaigns').select('id, status', { count: 'exact' })
      ]);

      const scheduledPosts = posts.data?.filter(p => p.status === 'scheduled').length || 0;
      const draftPosts = posts.data?.filter(p => p.status === 'draft').length || 0;
      const publishedPosts = posts.data?.filter(p => p.status === 'published').length || 0;
      
      const draftBlogs = blogs.data?.filter(b => b.status === 'draft').length || 0;
      const publishedBlogs = blogs.data?.filter(b => b.status === 'published').length || 0;
      
      const pendingReviews = reviews.data?.filter(r => r.status === 'pending').length || 0;
      const positiveReviews = reviews.data?.filter(r => r.sentiment === 'positive').length || 0;
      
      const activeCampaigns = campaigns.data?.filter(c => c.status === 'active').length || 0;

      const { data: recentPosts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: upcomingPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      return res.status(200).json({
        stats: {
          scheduledPosts,
          draftPosts,
          publishedPosts,
          draftBlogs,
          publishedBlogs,
          pendingReviews,
          positiveReviews,
          activeCampaigns,
          totalPosts: posts.count || 0,
          totalBlogs: blogs.count || 0,
        },
        recentPosts: recentPosts || [],
        upcomingPosts: upcomingPosts || [],
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}