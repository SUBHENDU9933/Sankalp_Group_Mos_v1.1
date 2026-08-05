import { useEffect, useState } from 'react';
import { MessagesSquare, Sparkles, Send, Loader2, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import { pushToast } from '../lib/toast';

function relTime(iso?: string) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function InboxView() {
  const [messages, setMessages] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'page' | 'instagram' | 'whatsapp'>('unread');
  const [reply, setReply] = useState<Record<number, string>>({});
  const [aiBusy, setAiBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.messages.list().then(setMessages).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const items = messages.filter(m =>
    filter === 'all' ? true : filter === 'unread' ? !m.read_at : m.channel === filter
  );

  const markRead = async (m: any) => {
    if (m.read_at) return;
    await api.messages.update({ id: m.id, read_at: new Date().toISOString() });
    load();
  };

  const generateReply = async (m: any) => {
    setAiBusy(m.id);
    try {
      const res = await api.ai.generate({
        task: 'dm_reply',
        prompt: `Inbound ${m.event_type || 'message'} on ${m.channel}: "${m.text || '(no text — attachment only)'}". Draft a reply.`,
      });
      setReply(prev => ({ ...prev, [m.id]: (res?.text || '').toString().trim() }));
      pushToast({ title: 'AI reply drafted', tone: 'success' });
    } catch (e: any) {
      pushToast({ title: 'AI failed', description: e.message, tone: 'error' });
    } finally { setAiBusy(null); }
  };

  // Marks the drafted reply as sent in our records. Actually delivering the reply
  // back through Messenger/IG/WhatsApp Send APIs is not wired yet — this logs intent
  // so nothing is silently lost, and gives you the exact text to paste manually today.
  const markReplied = async (id: number) => {
    const text = reply[id]?.trim();
    if (!text) return;
    try {
      await api.messages.update({ id, reply_text: text, replied_at: new Date().toISOString(), read_at: new Date().toISOString() });
      pushToast({ title: 'Marked as replied', description: 'Copy the text into the platform — outbound send API isn\'t wired yet.', tone: 'info' });
      load();
    } catch (e: any) {
      pushToast({ title: 'Failed', description: e.message, tone: 'error' });
    }
  };

  const unreadCount = messages.filter(m => !m.read_at).length;

  return (
    <div className="px-8 py-6 space-y-5" data-testid="inbox-view">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Channels</div>
          <h2 className="font-display text-2xl font-semibold mt-1">Inbox & Replies</h2>
        </div>
        <div className="flex gap-1.5">
          {(['unread', 'all', 'page', 'instagram', 'whatsapp'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} data-testid={`inbox-filter-${f}`}
              className={`px-3 py-1.5 text-xs rounded-full border capitalize ${filter === f ? 'bg-white/10 border-white/20' : 'border-white/10 hover:border-white/20'}`}>
              {f}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-16 text-ink-400 text-sm">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="card-elev p-12 text-center text-ink-300 flex flex-col items-center gap-3">
          <MessagesSquare className="size-10 text-ink-500" />
          <div className="font-semibold">Nothing here</div>
          <p className="text-sm max-w-md">
            Messenger, Instagram DM/comment and WhatsApp events land here automatically once Meta webhooks are
            configured (see META_WEBHOOK_SETUP.md) and the corresponding channel is connected in Integrations.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((m, i) => (
          <div key={m.id} onClick={() => markRead(m)}
            className={`card-elev p-4 rise-in rise-in-${(i % 6) + 1} ${!m.read_at ? 'border-l-4 border-l-brand-orange' : ''}`}
            data-testid={`inbox-item-${m.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-deep flex items-center justify-center text-xs font-bold shrink-0">
                  {(m.sender_id || '?').toString().slice(-2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span className="capitalize">{m.channel}</span>
                    <span>·</span>
                    <span className="capitalize">{(m.event_type || '').replace(/^status:/, '')}</span>
                    <span>·</span>
                    <span>{relTime(m.received_at)}</span>
                  </div>
                  <p className="text-sm mt-1 text-ink-100 truncate">{m.text || <em className="text-ink-500">attachment / no text</em>}</p>
                </div>
              </div>
              {m.replied_at && <CheckCheck className="size-4 text-emerald-400 shrink-0" />}
            </div>

            {m.replied_at ? (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-sm">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300 mb-1">Your reply</div>
                {m.reply_text}
              </div>
            ) : (
              <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                <textarea value={reply[m.id] || ''} onChange={e => setReply(prev => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="Draft a reply…" className="input-base min-h-[60px] text-sm"
                  data-testid={`inbox-reply-textarea-${m.id}`} />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => generateReply(m)} disabled={aiBusy === m.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 transition flex items-center gap-1.5 disabled:opacity-50"
                    data-testid={`inbox-ai-reply-${m.id}`}>
                    {aiBusy === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} AI suggest
                  </button>
                  <button onClick={() => markReplied(m.id)} disabled={!reply[m.id]?.trim()}
                    className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                    data-testid={`inbox-mark-replied-${m.id}`}>
                    <Send className="size-3.5" /> Mark replied
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
