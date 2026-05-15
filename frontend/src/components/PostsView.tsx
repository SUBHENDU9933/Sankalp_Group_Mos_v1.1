import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { platformDef } from '../lib/platforms';
import { Edit3, Trash2, Copy, Send, Search, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { pushToast } from '../lib/toast';

interface Props { onEdit: (post: any) => void; onCompose: () => void; }

export default function PostsView({ onEdit, onCompose }: Props) {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all'|'draft'|'scheduled'|'published'|'failed'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.posts.list().then(d => { setPosts(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search) {
      const blob = ((p.title || '') + ' ' + (p.content || '')).toLowerCase();
      if (!blob.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts: Record<string, number> = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    failed: posts.filter(p => p.status === 'failed').length,
  };

  const handleDuplicate = async (p: any) => {
    const { id: _id, created_at: _ca, published_at: _pa, ...rest } = p;
    try {
      await api.posts.create({ ...rest, status: 'draft', title: `${p.title || 'Untitled'} (copy)`, scheduled_at: null });
      pushToast({ title: 'Post duplicated', tone: 'success' });
      load();
    } catch (e: any) { pushToast({ title: 'Duplicate failed', description: e.message, tone: 'error' }); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this post permanently?')) return;
    try { await api.posts.remove(id); pushToast({ title: 'Post deleted', tone: 'info' }); load(); }
    catch (e: any) { pushToast({ title: 'Delete failed', description: e.message, tone: 'error' }); }
  };
  const handlePublishNow = async (id: number) => {
    try {
      const r: any = await api.posts.publish(id);
      const results = r?.results || {};
      const ok = Object.values(results).filter((x: any) => x?.ok).length;
      const total = Object.keys(results).length;
      pushToast({ title: 'Publishing complete', description: `${ok}/${total || 1} platforms successful`, tone: ok ? 'success' : 'error' });
      load();
    } catch (e: any) { pushToast({ title: 'Publish failed', description: e.message, tone: 'error' }); }
  };

  const tabs: [string, string, number][] = [
    ['all', 'All', counts.all], ['draft', 'Drafts', counts.draft],
    ['scheduled', 'Queue', counts.scheduled], ['published', 'Sent', counts.published],
    ['failed', 'Failed', counts.failed],
  ];

  return (
    <div className="px-8 py-6 space-y-4" data-testid="posts-view">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl bg-white/3 border border-white/8 p-1">
          {tabs.map(([k, label, n]) => (
            <button key={k} onClick={() => setFilter(k as any)} data-testid={`posts-filter-${k}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filter === k ? 'bg-white/10 text-white' : 'text-ink-300 hover:text-white'
              }`}>
              {label}<span className="text-[10px] text-ink-500">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…" className="input-base pl-9 w-64 text-sm" data-testid="posts-search-input" />
          </div>
          <button onClick={onCompose} className="btn-primary rounded-lg px-3 py-2 text-sm" data-testid="posts-new-btn">+ New post</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card-elev p-12 text-center text-ink-400">
          <FileText className="size-10 mx-auto mb-3 text-ink-500" />
          <p className="text-sm">{search || filter !== 'all' ? 'No posts match.' : 'No posts yet — compose your first one.'}</p>
          {!search && filter === 'all' && (
            <button onClick={onCompose} className="btn-primary rounded-lg px-3 py-1.5 text-xs mt-4">Compose</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <PostRow key={p.id} post={p} index={i}
              onEdit={() => onEdit(p)} onDuplicate={() => handleDuplicate(p)}
              onDelete={() => handleDelete(p.id)} onPublishNow={() => handlePublishNow(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostRow({ post, index, onEdit, onDuplicate, onDelete, onPublishNow }: any) {
  const status = post.status || 'draft';
  const badges: Record<string, { bg: string; label: string; Icon: any }> = {
    draft:     { bg: 'bg-ink-600/30 text-ink-200',         label: 'Draft',     Icon: FileText },
    scheduled: { bg: 'bg-brand-blue/20 text-sky-300',      label: 'Scheduled', Icon: Clock },
    published: { bg: 'bg-emerald-500/15 text-emerald-300', label: 'Published', Icon: CheckCircle2 },
    pending_connection: { bg: 'bg-amber-500/15 text-amber-300', label: 'Connect platform', Icon: AlertCircle },
    failed:    { bg: 'bg-red-500/15 text-red-300',         label: 'Failed',    Icon: AlertCircle },
  };
  const b = badges[status] || badges.draft;
  return (
    <div className={`card-elev p-4 flex items-center gap-4 rise-in rise-in-${(index%6)+1}`} data-testid={`post-row-${post.id}`}>
      <button onClick={onEdit} className="size-16 rounded-lg overflow-hidden bg-white/5 border border-white/8 shrink-0 hover:border-brand-orange/40 transition">
        {post.media_urls?.[0]
          ? (post.media_urls[0].match(/\.(mp4|mov|webm)$/i)
              ? <video src={post.media_urls[0]} className="w-full h-full object-cover" />
              : <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />)
          : <div className="w-full h-full flex items-center justify-center text-ink-500"><FileText className="size-5" /></div>}
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.bg} flex items-center gap-1 uppercase tracking-wider`}>
            <b.Icon className="size-3" />{b.label}
          </span>
          <div className="flex items-center gap-1.5">
            {(post.platforms || []).slice(0, 5).map((pl: string) => {
              const def = platformDef(pl); if (!def) return null;
              const Icon = def.icon;
              return <Icon key={pl} className="size-3.5" style={{ color: def.brand }} />;
            })}
          </div>
        </div>
        <div className="text-sm font-medium mt-1.5 line-clamp-2">{post.title || post.content?.slice(0, 110) || 'Untitled'}</div>
        <div className="text-[11px] text-ink-500 mt-1.5">
          {post.scheduled_at ? `📅 ${new Date(post.scheduled_at).toLocaleString()}` :
           post.published_at ? `✓ ${new Date(post.published_at).toLocaleString()}` :
           `Created ${new Date(post.created_at).toLocaleDateString()}`}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {status !== 'published' && (
          <button onClick={onPublishNow} className="size-8 rounded-lg bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 flex items-center justify-center" title="Publish now" data-testid={`publish-${post.id}`}>
            <Send className="size-3.5" />
          </button>
        )}
        <button onClick={onEdit} className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center" title="Edit"><Edit3 className="size-3.5" /></button>
        <button onClick={onDuplicate} className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center" title="Duplicate"><Copy className="size-3.5" /></button>
        <button onClick={onDelete} className="size-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-300 flex items-center justify-center" title="Delete"><Trash2 className="size-3.5" /></button>
      </div>
    </div>
  );
}
