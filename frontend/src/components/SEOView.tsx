import { Search, TrendingUp, Target, ChartLine } from 'lucide-react';

export default function SEOView() {
  return (
    <div className="px-8 py-6 space-y-5" data-testid="seo-view">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Intelligence</div>
        <h2 className="font-display text-2xl font-semibold mt-1">SEO Center</h2>
        <p className="text-sm text-ink-300 mt-1 max-w-2xl">Connect Google Search Console & Analytics from <span className="text-brand-orange">Integrations</span> to unlock impressions, clicks, CTR, keyword tracking and content-gap recommendations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Search, title: 'Keyword tracking', sub: 'Top queries from GSC, position movement, CTR.' },
          { icon: TrendingUp, title: 'Content opportunities', sub: 'Pages ranking #11-20 — push to top 10 with AI-generated content updates.' },
          { icon: Target, title: 'Meta optimisation', sub: 'AI-suggested titles & descriptions for higher CTR.' },
          { icon: ChartLine, title: 'Crawl health', sub: 'Sitemap status, indexed pages, errors.' },
        ].map((c, i) => (
          <div key={i} className={`card-elev p-5 rise-in rise-in-${i+1}`}>
            <c.icon className="size-5 text-brand-orange" />
            <div className="font-semibold mt-3">{c.title}</div>
            <p className="text-sm text-ink-300 mt-1.5">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="card-elev p-6 border-l-4 border-l-brand-orange">
        <div className="text-xs uppercase tracking-wider text-brand-orange-soft">Coming up next</div>
        <h3 className="font-display text-lg font-semibold mt-1">Live SEO data</h3>
        <p className="text-sm text-ink-300 mt-2">Once you connect Search Console + Analytics, your top queries, CTR, indexing health and content gaps will populate here automatically.</p>
      </div>
    </div>
  );
}
