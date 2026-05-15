import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  cta?: string;
  onClick?: () => void;
}

interface Props {
  onView: (v: string) => void;
}

const DISMISSED_KEY = 'sankalp-onboarding-dismissed';

export default function OnboardingChecklist({ onView }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [dash, integrations, media, posts] = await Promise.all([
          api.dashboard().catch(() => ({})),
          api.integrations.list().catch(() => []),
          api.media.list().catch(() => []),
          api.posts.list().catch(() => []),
        ]);
        const schemaOk = !(dash as any).needs_schema;
        const integrationsList = integrations as any[];
        const mediaList = media as any[];
        const postsList = posts as any[];
        const anyConnected = integrationsList.some(i => i.is_connected);
        const next: ChecklistItem[] = [
          { id: 'schema',       label: 'Run the Supabase schema',           description: 'Creates the tables in your database (one-time).',                                       done: schemaOk },
          { id: 'connect',      label: 'Connect at least one channel',      description: 'Google Business, YouTube, Facebook or Instagram.', done: anyConnected, cta: 'Integrations', onClick: () => onView('integrations') },
          { id: 'media',        label: 'Upload your first media',           description: 'Logos, banners, photos.',                          done: mediaList.length > 0,    cta: 'Media library', onClick: () => onView('media') },
          { id: 'post',         label: 'Create your first post',            description: 'Compose, attach media, publish or schedule.',      done: postsList.length > 0,    cta: 'New post',      onClick: () => onView('composer') },
          { id: 'settings',     label: 'Customise workspace settings',      description: 'Default platforms, language, tone.',               done: !!localStorage.getItem('sankalp-workspace-settings'), cta: 'Settings', onClick: () => onView('settings') },
        ];
        setItems(next);
      } catch (e) { /* noop */ }
    })();
  }, [onView]);

  if (dismissed) return null;
  if (items.length === 0) return null;
  const done = items.filter(i => i.done).length;
  if (done === items.length) return null;

  return (
    <div className="card-elev p-5 relative overflow-hidden" data-testid="onboarding-checklist">
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-brand-orange/15 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Get started</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange">{done}/{items.length} complete</span>
          </div>
          <h3 className="font-display text-xl font-semibold mt-1">Finish setting up Sankalp Marketing Hub</h3>
          <div className="mt-4 h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-orange to-brand-blue transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(c => !c)} className="text-xs text-ink-400 hover:text-white px-2">{collapsed ? 'Show' : 'Hide'}</button>
          <button onClick={() => { localStorage.setItem(DISMISSED_KEY, '1'); setDismissed(true); }} className="size-7 rounded-md hover:bg-white/5 flex items-center justify-center text-ink-400 hover:text-white" title="Dismiss"><X className="size-3.5" /></button>
        </div>
      </div>
      {!collapsed && (
        <div className="relative mt-4 space-y-1">
          {items.map((it, i) => (
            <div key={it.id} className={`flex items-center gap-3 p-3 rounded-lg ${it.done ? 'opacity-60' : 'hover:bg-white/4'} rise-in rise-in-${i+1}`}>
              {it.done ? <CheckCircle2 className="size-5 text-emerald-400 shrink-0" /> : <Circle className="size-5 text-ink-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${it.done ? 'line-through' : ''}`}>{it.label}</div>
                <div className="text-[11px] text-ink-400 mt-0.5">{it.description}</div>
              </div>
              {!it.done && it.cta && (
                <button onClick={it.onClick} className="text-xs px-2.5 py-1.5 rounded-md bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 transition flex items-center gap-1">
                  {it.cta}<ChevronRight className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
