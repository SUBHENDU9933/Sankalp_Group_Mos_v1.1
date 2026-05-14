import { useEffect, useState } from 'react';
import { Star, Sparkles, Send, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { pushToast } from '../lib/toast';

export default function ReviewsView() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative' | 'pending'>('all');
  const [reply, setReply] = useState<Record<number, string>>({});
  const [aiBusy, setAiBusy] = useState<number | null>(null);

  const load = () => api.reviews.list().then(setReviews).catch(console.error);
  useEffect(() => { load(); }, []);

  const items = reviews.filter(r =>
    filter === 'all' ? true : filter === 'pending' ? r.status === 'pending' : r.sentiment === filter
  );

  const generateReply = async (r: any) => {
    setAiBusy(r.id);
    try {
      const res = await api.ai.generate({
        task: 'review_reply',
        prompt: `Customer ${r.reviewer_name} left a ${r.rating}-star review on ${r.platform}: "${r.comment}". Draft a thoughtful reply.`,
      });
      setReply(prev => ({ ...prev, [r.id]: (res?.text || '').toString().trim() }));
      pushToast({ title: 'AI reply drafted', tone: 'success' });
    } catch (e: any) {
      pushToast({ title: 'AI failed', description: e.message, tone: 'error' });
    } finally { setAiBusy(null); }
  };

  const submitReply = async (id: number) => {
    const text = reply[id]?.trim();
    if (!text) return;
    try {
      await api.reviews.update({ id, reply_text: text, status: 'replied' });
      pushToast({ title: 'Reply published', tone: 'success' });
      load();
    } catch (e: any) {
      pushToast({ title: 'Failed', description: e.message, tone: 'error' });
    }
  };

  return (
    <div className="px-8 py-6 space-y-5" data-testid="reviews-view">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Reputation</div>
          <h2 className="font-display text-2xl font-semibold mt-1">Reviews</h2>
        </div>
        <div className="flex gap-1.5">
          {['all','pending','positive','neutral','negative'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} data-testid={`reviews-filter-${f}`}
              className={`px-3 py-1.5 text-xs rounded-full border ${filter===f ? 'bg-white/10 border-white/20' : 'border-white/10 hover:border-white/20'}`}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((r, i) => (
          <div key={r.id} className={`card-elev p-5 rise-in rise-in-${(i%6)+1}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-deep flex items-center justify-center font-bold">{(r.reviewer_name||'A')[0]}</div>
                <div>
                  <div className="font-semibold">{r.reviewer_name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`size-3.5 ${i <= r.rating ? 'fill-brand-orange text-brand-orange' : 'text-ink-600'}`} />)}
                    <span className="text-[11px] text-ink-500 ml-2 capitalize">{r.platform}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                r.sentiment==='positive' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : r.sentiment==='negative' ? 'bg-red-500/15 text-red-300 border-red-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>{r.sentiment}</span>
            </div>
            <p className="text-sm mt-3 text-ink-200">{r.comment}</p>

            {r.status === 'replied' ? (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-sm">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300 mb-1">Your reply</div>
                {r.reply_text}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <textarea value={reply[r.id] || ''} onChange={e => setReply(prev => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="Draft a thoughtful reply…" className="input-base min-h-[80px]"
                  data-testid={`reply-textarea-${r.id}`} />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => generateReply(r)} disabled={aiBusy === r.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 transition flex items-center gap-1.5 disabled:opacity-50"
                    data-testid={`ai-reply-${r.id}`}>
                    {aiBusy === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} AI suggest
                  </button>
                  <button onClick={() => submitReply(r.id)} disabled={!reply[r.id]?.trim()}
                    className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                    data-testid={`submit-reply-${r.id}`}>
                    <Send className="size-3.5" /> Post reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && <div className="text-center py-16 text-ink-400 text-sm">No reviews match this filter.</div>}
    </div>
  );
}
