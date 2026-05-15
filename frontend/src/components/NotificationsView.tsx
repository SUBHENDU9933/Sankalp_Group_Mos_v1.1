import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { platformDef } from '../lib/platforms';
import { CheckCircle2, AlertCircle, MessageCircleHeart, Send, Link2, Activity } from 'lucide-react';

interface Event {
  ts: string;
  title: string;
  description?: string;
  tone: 'success' | 'error' | 'info';
  icon: any;
}

export default function NotificationsView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [posts, reviews, integrations] = await Promise.all([
          api.posts.list(),
          api.reviews.list(),
          api.integrations.list(),
        ]);
        const evts: Event[] = [];

        for (const p of posts as any[]) {
          if (p.status === 'published' && p.published_at) {
            const results = p.metadata?.publish_results || {};
            const okCount = Object.values(results).filter((r: any) => r?.ok).length;
            const total = Object.keys(results).length;
            evts.push({
              ts: p.published_at,
              title: `Post published: ${(p.title || p.content || '').slice(0, 60)}`,
              description: total ? `${okCount}/${total} platforms successful` : `Sent to ${(p.platforms || []).join(', ')}`,
              tone: okCount === total ? 'success' : 'info',
              icon: Send,
            });
          }
          if (p.status === 'failed') {
            evts.push({
              ts: p.updated_at || p.created_at,
              title: `Post failed: ${(p.title || '').slice(0, 60)}`,
              description: 'Check the post details for error info.',
              tone: 'error',
              icon: AlertCircle,
            });
          }
        }
        for (const r of reviews as any[]) {
          evts.push({
            ts: r.created_at,
            title: `New ${r.sentiment || 'neutral'} review from ${r.reviewer_name}`,
            description: (r.comment || '').slice(0, 120),
            tone: r.sentiment === 'negative' ? 'error' : 'info',
            icon: MessageCircleHeart,
          });
        }
        for (const i of integrations as any[]) {
          if (i.is_connected) {
            evts.push({
              ts: i.updated_at || i.created_at,
              title: `${platformDef(i.platform)?.name || i.platform} connected`,
              description: i.account_name,
              tone: 'success',
              icon: Link2,
            });
          }
        }

        evts.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
        setEvents(evts.slice(0, 50));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="px-8 py-6 space-y-4" data-testid="notifications-view">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Workspace</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Activity feed</h2>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : events.length === 0 ? (
        <div className="card-elev p-12 text-center text-ink-400 flex flex-col items-center gap-2">
          <Activity className="size-10 text-ink-500" />
          <div className="font-semibold">No activity yet</div>
          <p className="text-sm">Publish posts, connect channels, or reply to reviews — activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => {
            const Icon = e.icon;
            const tone = e.tone === 'success' ? 'text-emerald-300 bg-emerald-500/15'
                       : e.tone === 'error'   ? 'text-red-300 bg-red-500/15'
                       : 'text-sky-300 bg-brand-blue/20';
            return (
              <div key={i} className={`card-elev p-4 flex items-start gap-4 rise-in rise-in-${(i%6)+1}`}>
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="size-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{e.title}</div>
                  {e.description && <div className="text-xs text-ink-400 mt-0.5">{e.description}</div>}
                </div>
                <div className="text-[11px] text-ink-500 shrink-0">{relTime(e.ts)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function relTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}
