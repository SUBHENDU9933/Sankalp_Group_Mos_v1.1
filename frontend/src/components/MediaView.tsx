import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import supabase from '../lib/supabase';
import { uploadToSupabase } from '../lib/upload';
import { Upload, Trash2, Search, Copy, Check, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { pushToast } from '../lib/toast';

interface Props {
  selectMode?: boolean;
  onSelect?: (urls: string[]) => void;
  onClose?: () => void;
}

export default function MediaView({ selectMode, onSelect, onClose }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = () => {
    setLoading(true);
    api.media.list().then((d: any[]) => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0, fail = 0;
    for (const f of Array.from(files)) {
      try {
        const r = await uploadToSupabase(f);
        await api.media_library.create({ filename: f.name, url: r.url, folder: 'default', mime_type: f.type, size_bytes: f.size });
        ok++;
      } catch (e) { fail++; console.error(e); }
    }
    if (ok) pushToast({ title: `${ok} file${ok > 1 ? 's' : ''} uploaded`, tone: 'success' });
    if (fail) pushToast({ title: `${fail} upload${fail > 1 ? 's' : ''} failed`, description: 'Make sure the public "media" bucket exists with upload policy.', tone: 'error' });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const handleDelete = async (m: any) => {
    if (!confirm(`Delete "${m.filename}"?`)) return;
    try {
      // Best-effort: extract storage path from URL and remove from Supabase Storage
      if (supabase && m.url) {
        const path = m.url.split('/storage/v1/object/public/media/')[1];
        if (path) await supabase.storage.from('media').remove([path]);
      }
      await api.media_library.remove(m.id);
      pushToast({ title: 'Deleted', tone: 'info' });
      load();
    } catch (e: any) { pushToast({ title: 'Delete failed', description: e.message, tone: 'error' }); }
  };

  const copyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); pushToast({ title: 'URL copied', tone: 'success' }); } catch {}
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const confirmSelection = () => {
    const urls = items.filter(i => selected.has(i.id)).map(i => i.url);
    onSelect?.(urls);
  };

  const filtered = items.filter(m => !search || (m.filename || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-8 py-6 space-y-4" data-testid="media-view">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Assets</div>
          <h2 className="font-display text-2xl font-semibold mt-1">Media Library</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search filename…" className="input-base pl-9 w-56 text-sm" />
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary rounded-lg px-3 py-2 text-sm flex items-center gap-2" data-testid="media-upload-btn">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          {selectMode && (
            <>
              <button onClick={confirmSelection} disabled={selected.size === 0} className="btn-primary rounded-lg px-3 py-2 text-sm disabled:opacity-50">
                Insert {selected.size > 0 ? `(${selected.size})` : ''}
              </button>
              <button onClick={onClose} className="size-9 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center"><X className="size-4" /></button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">{[...Array(12)].map((_, i) => <div key={i} className="aspect-square skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card-elev p-12 text-center text-ink-300 flex flex-col items-center gap-3">
          <ImageIcon className="size-10 text-ink-500" />
          <div className="font-semibold">No media yet</div>
          <p className="text-sm max-w-md">Click <b>Upload</b> to add images or videos. They'll be available to attach to your social posts and blogs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((m: any) => {
            const isVideo = (m.mime_type || '').startsWith('video') || /\.(mp4|mov|webm)$/i.test(m.url || '');
            const isSel = selected.has(m.id);
            return (
              <div key={m.id} className={`relative aspect-square rounded-xl overflow-hidden bg-white/5 border ${isSel ? 'border-brand-orange ring-2 ring-brand-orange/50' : 'border-white/8'} group cursor-pointer`}
                onClick={() => selectMode ? toggleSelect(m.id) : setPreview(m)}>
                {isVideo
                  ? <video src={m.url} className="w-full h-full object-cover" />
                  : <img src={m.url} alt={m.filename} className="w-full h-full object-cover" loading="lazy" />}
                {!selectMode && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-2 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); copyUrl(m.url); }} className="size-7 rounded-md bg-white/95 text-ink-900 flex items-center justify-center hover:bg-white" title="Copy URL"><Copy className="size-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(m); }} className="size-7 rounded-md bg-red-500/95 text-white flex items-center justify-center hover:bg-red-500" title="Delete"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                )}
                {selectMode && isSel && (
                  <div className="absolute top-2 right-2 size-6 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg"><Check className="size-3.5" /></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative max-w-3xl w-full max-h-[80vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {(preview.mime_type || '').startsWith('video')
              ? <video src={preview.url} controls className="max-h-[70vh] rounded-xl" />
              : <img src={preview.url} alt={preview.filename} className="max-h-[70vh] rounded-xl" />}
            <div className="mt-3 text-sm text-ink-300">{preview.filename}</div>
          </div>
          <button onClick={() => setPreview(null)} className="absolute top-6 right-6 size-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><X className="size-5" /></button>
        </div>
      )}
    </div>
  );
}
