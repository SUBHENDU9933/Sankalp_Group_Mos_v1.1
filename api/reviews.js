import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { sentiment, status } = req.query;
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      
      if (sentiment) query = query.eq('sentiment', sentiment);
      if (status) query = query.eq('status', status);
      
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'POST') {
      const review = req.body;
      if (review.rating && !review.sentiment) {
        if (review.rating >= 4) review.sentiment = 'positive';
        else if (review.rating === 3) review.sentiment = 'neutral';
        else review.sentiment = 'negative';
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({ ...review, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (updates.reply_text && !updates.replied_at) {
        updates.replied_at = new Date().toISOString();
        updates.status = 'replied';
      }
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}