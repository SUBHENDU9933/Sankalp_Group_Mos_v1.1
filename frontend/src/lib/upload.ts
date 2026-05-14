// Direct-to-Supabase Storage upload (no server roundtrip)
// Requires a public bucket named 'media' to exist in your Supabase project.
import supabase from './supabase';

export async function uploadToSupabase(file: File): Promise<{ url: string; path: string }> {
  if (!supabase) throw new Error('Supabase client not configured');
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl, path };
}
