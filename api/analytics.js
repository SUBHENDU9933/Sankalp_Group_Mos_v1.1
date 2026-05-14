import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { metric_type, days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      let query = supabase
        .from('analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (metric_type) query = query.eq('metric_type', metric_type);
      
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'POST') {
      const analytics = req.body;
      const { data, error } = await supabase
        .from('analytics')
        .insert({ ...analytics, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}