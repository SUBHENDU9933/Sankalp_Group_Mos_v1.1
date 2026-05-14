import { useEffect, useState } from 'react';
import { FileText, Plus, Edit3, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { pushToast } from '../lib/toast';

export default function BlogsView() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const load = () => api.blogs.list().then(setBlogs).catch(console.error);
  useEffect(() => { load(); }, []);

  const aiGenerate = async () => {
    if (!editing?.title) return pushToast({ title: 'Add a title first', tone: 'info' });
    setAiBusy(true);
    try {
      const res = await api.ai.generate({ task: 'seo_blog', prompt: editing.title });
      setEditing((p: any) => ({ ...p, content: res?.text, excerpt: (res?.text || '').slice(0, 160) }));
      pushToast({ title: 'Blog draft generated', tone: 'success' });
    } catch (e: any) {
      pushToast({ title: 'AI failed', description: e.message, tone: 'error' });
    } finally { setAiBusy(false); }
  };

  const save = async (publish = false) => {
    const payload = { ...editing, status: publish ? 'published' : (editing.status || 'draft'), published_at: publish ? new Date().toISOString() : null };
    try {
      if (editing.id) await api.blogs.update(payload); else await api.blogs.create(payload);
      pushToast({ title: publish ? 'Blog published' : 'Blog saved', tone: 'success' });
      setEditing(null); load();
    } catch (e: any) { pushToast({ title: 'Failed', description: e.message, tone: 'error' }); }
  };

  return (
    <div className="px-8 py-6" data-testid="blogs-view">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Content</div>
          <h2 className="font-display text-2xl font-semibold mt-1">Blog Manager</h2>
        </div>
        <button onClick={() => setEditing({ title: '', content: '', tags: [], status: 'draft' })} className="btn-primary rounded-lg px-3 py-2 text-sm flex items-center gap-2" data-testid="new-blog-btn">
          <Plus className="size-4" /> New blog
        </button>
      </div>

      {!editing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {blogs.map((b: any) => (
            <div key={b.id} className="card-elev p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block uppercase tracking-wider ${b.status==='published'?'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30':'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>{b.status}</div>
                  <h3 className="font-display text-lg font-semibold mt-2 line-clamp-2">{b.title}</h3>
                  <p className="text-sm text-ink-300 mt-2 line-clamp-3">{b.excerpt || (b.content || '').slice(0, 160)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => setEditing(b)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 flex items-center gap-1.5"><Edit3 className="size-3.5" /> Edit</button>
                <button onClick={async () => { if (confirm('Delete blog?')) { await api.blogs.remove(b.id); load(); } }} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-400/50 hover:text-red-300 flex items-center gap-1.5"><Trash2 className="size-3.5" /> Delete</button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="lg:col-span-2 text-center py-16 text-ink-400">
              <FileText className="size-10 mx-auto mb-3 text-ink-500" />
              No blogs yet. Start by clicking "New blog".
            </div>
          )}
        </div>
      ) : (
        <div className="card-elev p-6 space-y-4">
          <div className="flex items-center justify-between">
            <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Blog title…" className="input-base !text-lg !font-semibold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="slug (auto-generated if empty)" className="input-base" />
            <input value={editing.featured_image || ''} onChange={e => setEditing({ ...editing, featured_image: e.target.value })} placeholder="Featured image URL" className="input-base" />
          </div>
          <input value={editing.meta_description || ''} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} placeholder="SEO meta description" className="input-base" />
          <textarea value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })} placeholder="Write or generate your blog content in markdown…" className="input-base min-h-[280px] font-mono text-sm" />
          <div className="flex items-center justify-between">
            <button onClick={aiGenerate} disabled={aiBusy} className="text-sm px-3 py-2 rounded-lg bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 flex items-center gap-1.5">
              {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate with AI
            </button>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="text-sm px-3 py-2 rounded-lg border border-white/10 hover:border-white/25">Cancel</button>
              <button onClick={() => save(false)} className="text-sm px-3 py-2 rounded-lg border border-white/10 hover:border-white/25">Save draft</button>
              <button onClick={() => save(true)} className="btn-primary text-sm px-4 py-2 rounded-lg">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
