import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { folder } = req.query;
      let query = supabase.from('media_library').select('*').order('created_at', { ascending: false });
      
      if (folder) query = query.eq('folder', folder);
      
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'POST') {
      const media = req.body;
      const { data, error } = await supabase
        .from('media_library')
        .insert({
          ...media,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase
        .from('media_library')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('media_library').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}