import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Calendar, CheckCircle2, FileText, Megaphone, MessageCircleHeart, PenSquare, Sparkles, Star, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api';
import { platformDef } from '../lib/platforms';

interface Props {
  onCompose: () => void;
  onView: (v: any) => void;
}

export default function Dashboard({ onCompose, onView }: Props) {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, a] = await Promise.all([api.dashboard(), api.analytics.list(7)]);
        setData(d); setAnalytics(a || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const needsSchema = (data as any).needs_schema;
  const s = data.stats || {};

  // Pivot analytics: date → {fb, ig, gb}
  const grouped: Record<string, any> = {};
  for (const row of analytics) {
    grouped[row.date] = grouped[row.date] || { date: row.date };
    grouped[row.date][row.platform] = (grouped[row.date][row.platform] || 0) + Number(row.value || 0);
  }
  const chartData = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return (
    <div className="px-8 py-6 space-y-8" data-testid="dashboard-view">
      {needsSchema && (
        <div className="rise-in card-elev p-5 border-l-4 border-l-brand-orange flex items-start gap-4" data-testid="schema-banner">
          <div className="size-10 rounded-xl bg-brand-orange/15 flex items-center justify-center"><Sparkles className="size-5 text-brand-orange" /></div>
          <div className="flex-1">
            <div className="font-semibold">One-time setup — run the Supabase schema</div>
            <p className="text-sm text-ink-300 mt-1">Open your Supabase project → SQL editor → paste the contents of <code className="text-brand-orange-soft">/app/supabase_schema.sql</code> and run once. Tables, indexes and demo seed data will be created instantly.</p>
          </div>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Scheduled Posts" value={s.scheduledPosts} delta="this week" icon={Calendar} accent="orange" testid="kpi-scheduled" />
        <KPI label="Published" value={s.publishedPosts} delta="total" icon={CheckCircle2} accent="success" testid="kpi-published" />
        <KPI label="Pending Reviews" value={s.pendingReviews} delta="needs reply" icon={Star} accent="warn" testid="kpi-pending-reviews" />
        <KPI label="Active Campaigns" value={s.activeCampaigns} delta="running" icon={Megaphone} accent="blue" testid="kpi-campaigns" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card-elev p-6 relative overflow-hidden" data-testid="reach-chart">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Reach across channels</div>
              <h3 className="font-display text-xl font-semibold mt-1">Last 7 days</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1877F2]" />Facebook</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#E4405F]" />Instagram</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-orange" />Google</span>
            </div>
          </div>
          <div className="h-[260px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1877F2" stopOpacity={0.4}/><stop offset="100%" stopColor="#1877F2" stopOpacity={0}/></linearGradient>
                    <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E4405F" stopOpacity={0.4}/><stop offset="100%" stopColor="#E4405F" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F47B20" stopOpacity={0.5}/><stop offset="100%" stopColor="#F47B20" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip contentStyle={{ background:'#131B2B', border:'1px solid #1E2A42', borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="facebook"  stroke="#1877F2" strokeWidth={2} fill="url(#fb)" />
                  <Area type="monotone" dataKey="instagram" stroke="#E4405F" strokeWidth={2} fill="url(#ig)" />
                  <Area type="monotone" dataKey="google"    stroke="#F47B20" strokeWidth={2} fill="url(#gb)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Upcoming schedule */}
        <div className="card-elev p-6 flex flex-col" data-testid="upcoming-rail">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Coming up</div>
              <h3 className="font-display text-xl font-semibold mt-1">Upcoming</h3>
            </div>
            <button onClick={() => onView('calendar')} className="text-xs text-brand-orange hover:underline">Calendar →</button>
          </div>
          {data.upcomingPosts?.length ? (
            <div className="space-y-3 flex-1">
              {data.upcomingPosts.slice(0, 5).map((p: any, i: number) => (
                <div key={p.id} className={`rise-in rise-in-${i+1} flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-brand-orange/40 transition`}>
                  <div className="size-9 rounded-lg bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center text-xs font-semibold">
                    {new Date(p.scheduled_at).getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.title || p.content?.slice(0, 60)}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {(p.platforms || []).slice(0, 4).map((pl: string) => {
                        const def = platformDef(pl);
                        if (!def) return null;
                        const Icon = def.icon;
                        return <Icon key={pl} className="size-3.5" style={{ color: def.brand }} />;
                      })}
                      <span className="text-[11px] text-ink-400 ml-1">{new Date(p.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-ink-400 text-sm gap-3">
              <Calendar className="size-8 opacity-50" />
              Nothing scheduled yet.
              <button onClick={onCompose} className="btn-primary rounded-lg px-3 py-1.5 text-xs">Plan a post</button>
            </div>
          )}
        </div>
      </div>

      {/* Recent reviews + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elev p-6" data-testid="recent-reviews-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Reputation</div>
              <h3 className="font-display text-xl font-semibold mt-1">Recent reviews</h3>
            </div>
            <button onClick={() => onView('reviews')} className="text-xs text-brand-orange hover:underline">Review center →</button>
          </div>
          {data.recentReviews?.length ? (
            <div className="space-y-3">
              {data.recentReviews.slice(0, 4).map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-deep flex items-center justify-center text-xs font-bold">{(r.reviewer_name || 'A')[0]}</div>
                      <div>
                        <div className="text-sm font-medium">{r.reviewer_name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1,2,3,4,5].map(i => <Star key={i} className={`size-3 ${i <= r.rating ? 'fill-brand-orange text-brand-orange' : 'text-ink-600'}`} />)}
                        </div>
                      </div>
                    </div>
                    <SentimentBadge sentiment={r.sentiment} />
                  </div>
                  <p className="text-sm text-ink-200 mt-3 line-clamp-2">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={MessageCircleHeart} label="No reviews yet" hint="Connect Google or Facebook to start fetching reviews." />}
        </div>

        <div className="card-elev p-6" data-testid="quick-actions-card">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Quick actions</div>
          <h3 className="font-display text-xl font-semibold mt-1 mb-5">Jump back in</h3>
          <div className="grid grid-cols-2 gap-3">
            <Action icon={PenSquare} label="New post" sub="Compose content" onClick={onCompose} />
            <Action icon={FileText} label="New blog" sub="Long-form content" onClick={() => onView('blogs')} />
            <Action icon={Megaphone} label="New campaign" sub="Festive / lead-gen" onClick={() => onView('campaigns')} />
            <Action icon={Star} label="Reply to reviews" sub={`${s.pendingReviews || 0} pending`} onClick={() => onView('reviews')} />
            <Action icon={TrendingUp} label="View analytics" sub="Weekly reports" onClick={() => onView('analytics')} />
            <Action icon={Activity} label="Connect channels" sub="Integrations" onClick={() => onView('integrations')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, icon: Icon, accent, testid }: any) {
  const tone = accent === 'orange' ? 'from-brand-orange/30 to-brand-orange/5 text-brand-orange'
             : accent === 'success' ? 'from-emerald-400/25 to-emerald-400/5 text-emerald-300'
             : accent === 'warn'    ? 'from-amber-400/25 to-amber-400/5 text-amber-300'
             : 'from-brand-blue/30 to-brand-blue/5 text-sky-300';
  return (
    <div className="card-elev p-5 relative overflow-hidden" data-testid={testid}>
      <div className={`absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br ${tone} blur-2xl opacity-50`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-300">{label}</div>
          <div className="font-display text-3xl font-semibold mt-2">{value ?? 0}</div>
          <div className="text-[11px] text-ink-400 mt-1.5 flex items-center gap-1"><ArrowUpRight className="size-3" />{delta}</div>
        </div>
        <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center ${tone.split(' ').slice(-1)[0]}`}><Icon className="size-5" /></div>
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  const map: Record<string, string> = {
    positive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    neutral:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
    negative: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  const cls = map[sentiment || 'neutral'] || map.neutral;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${cls}`}>{sentiment || 'neutral'}</span>;
}

function Action({ icon: Icon, label, sub, onClick }: any) {
  return (
    <button onClick={onClick} className="text-left p-4 rounded-xl bg-white/3 border border-white/5 hover:border-brand-orange/45 hover:bg-white/6 transition group">
      <Icon className="size-5 text-brand-orange mb-2 group-hover:scale-110 transition" />
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[11px] text-ink-400 mt-0.5">{sub}</div>
    </button>
  );
}

function EmptyState({ icon: Icon, label, hint }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 text-ink-300 gap-2">
      <Icon className="size-9 text-ink-500" />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-ink-500 max-w-[260px]">{hint}</div>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-sm text-ink-400">Analytics will appear after your first published posts.</div>;
}

function Skeleton() {
  return (
    <div className="px-8 py-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28" />)}</div>
      <div className="grid grid-cols-3 gap-6"><div className="skeleton h-[300px] col-span-2" /><div className="skeleton h-[300px]" /></div>
    </div>
  );
}

