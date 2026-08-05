// Vercel serverless — real health check (frontend's lib/api.ts already calls this).
import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const checks = { supabase: false, anthropic: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY };
  try {
    const { error } = await supabase.from('posts').select('id').limit(1);
    checks.supabase = !error;
  } catch {
    checks.supabase = false;
  }
  const ok = checks.supabase;
  return res.status(ok ? 200 : 503).json({ ok, checks, time: new Date().toISOString() });
}
