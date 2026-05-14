// Vercel serverless — AI text generation for Sankalp Marketing Hub
// Tries (in order): Anthropic, OpenAI. Requires ONE of these env vars on Vercel:
//   ANTHROPIC_API_KEY  → Claude Sonnet 4.5 (preferred)
//   OPENAI_API_KEY     → GPT-4o (fallback)

const SYS = {
  caption: "You are a senior social-media copywriter for Sankalp Interior Solution, a premium interior-design firm. Write a short, scroll-stopping social caption that's elegant, warm, and architectural in feel. Match the platform's tone. Do NOT use emojis unless asked. Return ONLY the caption — no preamble.",
  hashtags: "Generate 12-15 high-relevance hashtags for Sankalp Interior Solution (interior design firm in India). Mix broad and niche. Return as a single space-separated line. Each must start with #.",
  ad_copy: "Write conversion-focused ad copy for an interior design firm. Provide: a hook (max 6 words), 2 short sentences of body, and a strong CTA. Premium, no clichés. Return as markdown with **Hook:**, **Body:**, **CTA:** sections.",
  seo_blog: "Write a 600-800 word SEO blog for an interior-design firm. Include H2/H3 markdown headings, a short intro, 3-5 sections, and a closing CTA. Natural keyword usage. Return markdown only.",
  review_reply: "Draft a thoughtful, warm reply to a customer review for Sankalp Interior Solution. 2-3 sentences. Acknowledge specifics from the review, stay professional. No emojis. Return only the reply text.",
  command: "You are Sankalp Marketing Hub's AI command assistant. Given the user's natural-language request, respond with a concise structured plan in markdown (use bullets / short sections) describing what content/campaign you'd create and the recommended platforms, timing, and tone.",
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { task = 'command', prompt = '', platform, language } = req.body || {};
  let system = SYS[task] || SYS.command;
  if (platform) system += `\nTarget platform: ${platform}.`;
  if (language && language !== 'en') {
    const langs = { bn: 'Bengali (বাংলা)', hi: 'Hindi (हिन्दी)' };
    system += `\nWrite the response in ${langs[language] || language}.`;
  }

  const anth = process.env.ANTHROPIC_API_KEY;
  const oai  = process.env.OPENAI_API_KEY;

  try {
    if (anth) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anth,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1400,
          system,
          messages: [{ role: 'user', content: prompt || 'Please respond.' }],
        }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) });
      const text = (data.content || []).map(c => c.text || '').join('') || '';
      return res.status(200).json({ text, task, platform, language, model: 'claude-sonnet-4-5' });
    }
    if (oai) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${oai}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: prompt || 'Please respond.' },
          ],
          max_tokens: 1400,
        }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) });
      const text = data.choices?.[0]?.message?.content || '';
      return res.status(200).json({ text, task, platform, language, model: 'gpt-4o' });
    }
    return res.status(500).json({
      error: "No AI key configured. Add ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.",
      task,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
