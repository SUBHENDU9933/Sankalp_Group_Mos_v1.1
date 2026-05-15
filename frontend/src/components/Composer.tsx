import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar as CalIcon, Send, Globe2, Languages, Image as ImageIcon, Hash, Upload, Trash2, Loader2 } from 'lucide-react';
import { PUBLISHABLE_PLATFORMS, platformDef } from '../lib/platforms';
import { api } from '../lib/api';
import { pushToast } from '../lib/toast';
import { uploadToSupabase } from '../lib/upload';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingPost?: any;
  initialScheduledAt?: string | null;
}

const LANGS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'hi', label: 'Hindi',   native: 'हिन्दी' },
];

const POST_TYPES = [
  { id: 'social',  label: 'Social Post' },
  { id: 'story',   label: 'Story' },
  { id: 'reel',    label: 'Reel / Short' },
  { id: 'offer',   label: 'Offer / Promo' },
  { id: 'gbp_post', label: 'Google Business' },
];

export default function Composer({ open, onClose, onSaved, editingPost, initialScheduledAt }: Props) {
  const [content, setContent] = useState<{ en: string; bn: string; hi: string }>(
    () => ({ en: editingPost?.content_en || editingPost?.content || '', bn: editingPost?.content_bn || '', hi: editingPost?.content_hi || '' })
  );
  const [platforms, setPlatforms] = useState<string[]>(editingPost?.platforms || ['facebook', 'instagram']);
  const [langs, setLangs] = useState<string[]>(editingPost?.languages || ['en']);
  const [scheduleAt, setScheduleAt] = useState<string>(
    editingPost?.scheduled_at ? editingPost.scheduled_at.slice(0, 16) : (initialScheduledAt || '')
  );
  const [postType, setPostType] = useState<string>(editingPost?.post_type || 'social');
  const [previewLang, setPreviewLang] = useState<'en' | 'bn' | 'hi'>('en');
  const [previewPlatform, setPreviewPlatform] = useState<string>(platforms[0] || 'facebook');
  const [showLibrary, setShowLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>(editingPost?.media_urls || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const r = await uploadToSupabase(f);
        urls.push(r.url);
      }
      setMediaUrls(prev => [...prev, ...urls]);
      pushToast({ title: `${urls.length} file${urls.length > 1 ? 's' : ''} uploaded`, tone: 'success' });
    } catch (e: any) {
      pushToast({ title: 'Upload failed', description: e.message + ' — make sure a public "media" bucket exists in Supabase Storage.', tone: 'error' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const removeMedia = (i: number) => setMediaUrls(prev => prev.filter((_, idx) => idx !== i));

  const togglePlatform = (id: string) => {
    setPlatforms(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      if (!next.includes(previewPlatform) && next.length > 0) setPreviewPlatform(next[0]);
      return next;
    });
  };
  const toggleLang = (code: string) => setLangs(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code]);

  const handleAI = async (mode: 'caption' | 'hashtags') => {
    const seed = content[previewLang] || `Sankalp Interior Solution — ${postType} for ${platforms.join(', ')}`;
    setAiBusy(true);
    try {
      const res = await api.ai.generate({
        task: mode,
        prompt: mode === 'caption'
          ? `Write a scroll-stopping ${postType} caption for ${previewPlatform}. Topic / draft so far: ${seed || 'interior design transformation'}`
          : `Suggest hashtags for an interior design post on ${previewPlatform} for Sankalp Interior Solution.`,
        platform: previewPlatform,
        language: previewLang,
      });
      const text = (res?.text || '').toString().trim();
      if (mode === 'caption') {
        setContent(prev => ({ ...prev, [previewLang]: text }));
      } else {
        setContent(prev => ({ ...prev, [previewLang]: (prev[previewLang] ? prev[previewLang] + '\n\n' : '') + text }));
      }
      pushToast({ title: 'AI suggestion ready', tone: 'success' });
    } catch (e: any) {
      pushToast({ title: 'AI failed', description: e.message, tone: 'error' });
    } finally { setAiBusy(false); }
  };

  const save = async (asDraft = false) => {
    const merged = langs.map(l => content[l as keyof typeof content]).filter(Boolean).join('\n\n---\n\n');
    const payload: any = {
      title: (content.en || content.bn || content.hi || '').slice(0, 60) || 'Untitled post',
      content: merged,
      content_en: content.en,
      content_bn: content.bn,
      content_hi: content.hi,
      platforms,
      languages: langs,
      status: asDraft ? 'draft' : (scheduleAt ? 'scheduled' : 'published'),
      scheduled_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
      post_type: postType,
      media_urls: mediaUrls,
    };
    setBusy(true);
    try {
      if (editingPost?.id) await api.posts.update({ id: editingPost.id, ...payload });
      else {
        const created = await api.posts.create(payload);
        if (!asDraft && !scheduleAt && created?.id) {
          try { await api.posts.publish(created.id); } catch { /* best-effort */ }
        }
      }
      pushToast({ title: asDraft ? 'Draft saved' : (scheduleAt ? 'Post scheduled' : 'Post published'), tone: 'success' });
      onSaved();
      onClose();
    } catch (e: any) {
      pushToast({ title: 'Save failed', description: e.message, tone: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="composer-overlay">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="ml-auto w-full md:max-w-[1180px] h-full bg-ink-900 md:border-l md:border-white/10 flex flex-col md:flex-row relative shadow-2xl"
          >
            {/* Mobile tabs bar */}
            <div className="lg:hidden sticky top-0 z-30 bg-ink-900/95 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center gap-2">
              <button onClick={onClose} className="size-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center" aria-label="Close" data-testid="composer-mobile-close">
                <X className="size-4" />
              </button>
              <div className="flex-1 flex items-center gap-1 rounded-lg bg-white/5 p-1">
                <button onClick={() => setMobileTab('form')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium ${mobileTab === 'form' ? 'bg-white/12 text-white' : 'text-ink-300'}`}
                  data-testid="composer-tab-form">Edit</button>
                <button onClick={() => setMobileTab('preview')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium ${mobileTab === 'preview' ? 'bg-white/12 text-white' : 'text-ink-300'}`}
                  data-testid="composer-tab-preview">Preview</button>
              </div>
            </div>

            {/* LEFT — form */}
            <div className={`flex-1 overflow-y-auto p-5 md:p-8 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`} data-testid="composer-form">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Content Studio</div>
                  <h2 className="font-display text-2xl font-semibold mt-1">{editingPost ? 'Edit post' : 'Compose new post'}</h2>
                </div>
                <button onClick={onClose} className="hidden lg:flex size-9 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center" data-testid="composer-close-btn">
                  <X className="size-4" />
                </button>
              </div>

              {/* Post type */}
              <div className="mb-5">
                <div className="text-xs text-ink-300 mb-2">Post type</div>
                <div className="flex flex-wrap gap-2">
                  {POST_TYPES.map(pt => (
                    <button key={pt.id} onClick={() => setPostType(pt.id)} data-testid={`post-type-${pt.id}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        postType === pt.id ? 'bg-brand-orange/15 border-brand-orange/50 text-brand-orange' : 'border-white/10 text-ink-300 hover:border-white/25'
                      }`}>{pt.label}</button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-ink-300 flex items-center gap-1.5"><Globe2 className="size-3.5" /> Publish to</div>
                  <div className="text-[11px] text-ink-500">{platforms.length} selected</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PUBLISHABLE_PLATFORMS.map(p => {
                    const active = platforms.includes(p.id);
                    const Icon = p.icon;
                    return (
                      <button key={p.id} onClick={() => togglePlatform(p.id)} data-testid={`composer-platform-${p.id}`}
                        className={`p-3 rounded-xl border text-left transition ${active ? 'border-brand-orange/55 bg-white/5' : 'border-white/8 hover:border-white/20'}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" style={{ color: p.brand }} />
                          <span className="text-xs font-medium">{p.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-ink-300 flex items-center gap-1.5"><Languages className="size-3.5" /> Languages</div>
                </div>
                <div className="flex gap-2">
                  {LANGS.map(l => {
                    const active = langs.includes(l.code);
                    return (
                      <button key={l.code} onClick={() => toggleLang(l.code)} data-testid={`composer-lang-${l.code}`}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${active ? 'bg-brand-orange/12 border-brand-orange/55 text-brand-orange' : 'border-white/10 text-ink-300'}`}>
                        {l.native}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption editors per selected lang */}
              <div className="space-y-3 mb-5">
                {langs.map((l) => (
                  <div key={l} className="card-elev p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] uppercase tracking-wider text-ink-400">{LANGS.find(x => x.code === l)?.native} caption</div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setPreviewLang(l as any); handleAI('caption'); }} disabled={aiBusy}
                          className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 transition disabled:opacity-50"
                          data-testid={`composer-ai-caption-${l}`}>
                          <Sparkles className="size-3" /> AI caption
                        </button>
                        <button onClick={() => { setPreviewLang(l as any); handleAI('hashtags'); }} disabled={aiBusy}
                          className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md bg-brand-blue/20 text-sky-300 hover:bg-brand-blue/30 transition disabled:opacity-50">
                          <Hash className="size-3" /> Hashtags
                        </button>
                      </div>
                    </div>
                    <textarea
                      data-testid={`composer-text-${l}`}
                      value={content[l as keyof typeof content]}
                      onChange={(e) => setContent(prev => ({ ...prev, [l]: e.target.value }))}
                      onFocus={() => setPreviewLang(l as any)}
                      placeholder={`Write your ${LANGS.find(x => x.code === l)?.label} caption…`}
                      className="w-full bg-transparent border-none outline-none resize-none min-h-[120px] text-sm leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[11px] text-ink-500 mt-2">
                      <span>{content[l as keyof typeof content].length} chars</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Media attach */}
              <div className="card-elev p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-ink-300 flex items-center gap-1.5"><ImageIcon className="size-3.5" /> Media ({mediaUrls.length})</div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowLibrary(true)} className="text-xs px-2.5 py-1.5 rounded-md bg-white/8 hover:bg-white/12 flex items-center gap-1.5">
                      <ImageIcon className="size-3" /> Library
                    </button>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="composer-upload-btn"
                      className="text-xs px-2.5 py-1.5 rounded-md bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 flex items-center gap-1.5 disabled:opacity-50">
                      {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />} Upload
                    </button>
                  </div>
                  <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden"
                    onChange={(e) => handleUpload(e.target.files)} />
                </div>
                {mediaUrls.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {mediaUrls.map((u, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/8 group" data-testid={`composer-media-${i}`}>
                        {u.match(/\.(mp4|mov|webm)$/i)
                          ? <video src={u} className="w-full h-full object-cover" />
                          : <img src={u} alt="" className="w-full h-full object-cover" />}
                        <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 size-6 rounded-md bg-black/70 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-ink-500">Tip: upload images or short videos. They'll be attached to all selected platforms (Instagram requires at least one image).</div>
                )}
              </div>

              {/* Schedule */}
              <div className="card-elev p-4 mb-6">
                <div className="text-xs text-ink-300 mb-2 flex items-center gap-1.5"><CalIcon className="size-3.5" /> Schedule (optional)</div>
                <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)}
                  className="input-base" data-testid="composer-schedule-input" />
                <div className="text-[11px] text-ink-500 mt-2">{scheduleAt ? `Will publish at ${new Date(scheduleAt).toLocaleString()}` : 'Leave empty to publish immediately.'}</div>
              </div>

              <div className="sticky bottom-0 bg-ink-900/95 backdrop-blur -mx-5 md:-mx-8 px-5 md:px-8 py-3 md:py-4 border-t border-white/8 flex items-center justify-between pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-4">
                <button onClick={() => save(true)} disabled={busy} className="btn-ghost rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm" data-testid="composer-save-draft-btn">
                  Save draft
                </button>
                <button onClick={() => save(false)} disabled={busy || platforms.length === 0}
                  className="btn-primary rounded-xl px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm flex items-center gap-2" data-testid="composer-publish-btn">
                  <Send className="size-4" /> {scheduleAt ? 'Schedule' : 'Publish now'}
                </button>
              </div>
            </div>

            {/* RIGHT — live preview */}
            <div className={`${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'} lg:w-[420px] shrink-0 lg:border-l lg:border-white/8 bg-[#080C16] flex-col flex-1 lg:flex-initial`} data-testid="composer-preview">
              <div className="p-5 border-b border-white/8">
                <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400 mb-2">Live preview</div>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map(p => {
                    const def = platformDef(p);
                    if (!def) return null;
                    const Icon = def.icon;
                    return (
                      <button key={p} onClick={() => setPreviewPlatform(p)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition ${previewPlatform === p ? 'bg-white/8 border-white/20' : 'border-white/8 hover:border-white/15'}`}>
                        <Icon className="size-3.5" style={{ color: def.brand }} /> {def.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <PreviewCard platform={previewPlatform} content={content[previewLang] || content.en || ''} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showLibrary && (
        <LibraryPickerOverlay
          existing={mediaUrls}
          onClose={() => setShowLibrary(false)}
          onSelect={(urls) => { setMediaUrls(prev => [...prev, ...urls.filter(u => !prev.includes(u))]); setShowLibrary(false); }}
        />
      )}
    </AnimatePresence>
  );
}

function LibraryPickerOverlay({ existing, onClose, onSelect }: { existing: string[]; onClose: () => void; onSelect: (urls: string[]) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => { api.media.list().then(setItems).catch(() => {}); }, []);
  const toggle = (url: string) => setSelected(prev => {
    const next = new Set(prev); if (next.has(url)) next.delete(url); else next.add(url); return next;
  });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[85vh] card-elev p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Pick from Media Library</h3>
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center text-ink-400 text-sm">No media uploaded yet — close this and use Upload.</div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {items.map((m: any) => {
                const sel = selected.has(m.url);
                const used = existing.includes(m.url);
                const isVideo = (m.mime_type || '').startsWith('video');
                return (
                  <button key={m.id} disabled={used} onClick={() => toggle(m.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border ${sel ? 'border-brand-orange ring-2 ring-brand-orange/50' : 'border-white/8 hover:border-white/20'} ${used ? 'opacity-40' : ''}`}>
                    {isVideo ? <video src={m.url} className="w-full h-full object-cover" /> : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                    {used && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] uppercase tracking-wider">Already added</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/8">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-white/10 text-sm">Cancel</button>
          <button onClick={() => onSelect(Array.from(selected))} disabled={selected.size === 0} className="btn-primary rounded-lg px-3 py-2 text-sm disabled:opacity-50">
            Add {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ platform, content }: { platform: string; content: string }) {
  const def = platformDef(platform);
  if (!def) return null;
  const Icon = def.icon;
  const text = content || 'Your caption will appear here…';

  if (platform === 'instagram') {
    return (
      <div className="rounded-2xl bg-white text-black overflow-hidden shadow-xl">
        <div className="p-3 flex items-center gap-2 border-b">
          <div className="size-8 rounded-full" style={{ background: def.bg }} />
          <div className="text-xs font-semibold">sankalpinterior</div>
        </div>
        <div className="aspect-square bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center text-ink-400 text-xs">Photo or reel</div>
        <div className="p-3 text-sm whitespace-pre-wrap">{text}</div>
      </div>
    );
  }
  if (platform === 'x' || platform === 'threads') {
    return (
      <div className="rounded-2xl bg-white text-black p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-9 rounded-full" style={{ background: def.bg }} />
          <div>
            <div className="text-sm font-semibold">Sankalp Interior</div>
            <div className="text-[11px] text-ink-500">@sankalpinterior · now</div>
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
    );
  }
  if (platform === 'google') {
    return (
      <div className="rounded-2xl bg-white text-black p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-9 rounded-full flex items-center justify-center" style={{ background: def.bg }}><Icon className="size-4 text-white" /></div>
          <div>
            <div className="text-sm font-semibold">Sankalp Interior Solution</div>
            <div className="text-[11px] text-ink-500">Google Business · Post</div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-100 aspect-[16/9] mb-3 flex items-center justify-center text-ink-400 text-xs">Photo</div>
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
    );
  }
  if (platform === 'youtube') {
    return (
      <div className="rounded-2xl bg-white text-black overflow-hidden shadow-xl">
        <div className="aspect-video bg-black flex items-center justify-center text-white/60 text-xs">Video thumbnail</div>
        <div className="p-3">
          <div className="text-sm font-semibold line-clamp-2">{text.split('\n')[0] || 'Video title'}</div>
          <div className="text-[11px] text-ink-500 mt-1">Sankalp Interior · Just now</div>
        </div>
      </div>
    );
  }
  // facebook (default)
  return (
    <div className="rounded-2xl bg-white text-black p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-10 rounded-full" style={{ background: def.bg }} />
        <div>
          <div className="text-sm font-semibold">Sankalp Interior Solution</div>
          <div className="text-[11px] text-ink-500">Just now · 🌐</div>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap">{text}</p>
      <div className="rounded-xl bg-gray-100 aspect-video mt-3 flex items-center justify-center text-ink-400 text-xs">Photo / Video</div>
    </div>
  );
}
