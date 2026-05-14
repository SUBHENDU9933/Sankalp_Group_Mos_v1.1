import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'Generate a Diwali festive campaign for kitchens',
  'Write a 5-day Instagram content plan',
  'Draft a thoughtful reply to a 2-star review',
  'Suggest 10 SEO blog topics for interior design',
  'Create a Google Business post about modular wardrobes',
];

export default function AICommand({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!open) {/* parent opens */}
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const ask = async (text?: string) => {
    const prompt = (text ?? q).trim();
    if (!prompt) return;
    setBusy(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await api.ai.generate({ task: 'command', prompt });
      setHistory(h => [...h, { q: prompt, a: (res?.text || '').toString() }]);
      setQ('');
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setHistory(h => [...h, { q: prompt, a: `Error: ${e.message}` }]);
      }
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-start justify-center pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="ai-command-overlay">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="relative w-full max-w-2xl glass rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Sparkles className="size-5 text-brand-orange" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
                placeholder="Ask the AI assistant anything — campaigns, captions, replies…"
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder-ink-400" data-testid="ai-command-input" />
              <button onClick={() => ask()} disabled={busy || !q.trim()} className="btn-primary text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Ask
              </button>
              <button onClick={onClose} className="text-ink-400 hover:text-white"><X className="size-5" /></button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
              {history.length === 0 ? (
                <>
                  <div className="text-[11px] uppercase tracking-wider text-ink-500 mb-1">Try one of these</div>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => ask(s)} className="text-left text-sm px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 hover:border-brand-orange/45 transition" data-testid={`ai-suggest-${s.slice(0,12)}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-xs text-ink-400">You</div>
                    <div className="text-sm">{h.q}</div>
                    <div className="text-xs text-brand-orange mt-2">Sankalp AI</div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{h.a}</div>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-white/8 text-[11px] text-ink-500 flex items-center gap-3">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd> ask
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">esc</kbd> close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
