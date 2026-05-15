import { LayoutDashboard, ListChecks, Plus, Calendar, MoreHorizontal, X, Star, Image as ImageIcon, MessagesSquare, Megaphone, BarChart3, FileText, Link2, Search, Settings, Bell, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { ViewId } from './Sidebar';

interface Props {
  view: ViewId;
  onChange: (v: ViewId) => void;
  onCompose: () => void;
  onOpenAI: () => void;
  pendingReviews?: number;
}

const MORE_ITEMS: { id: ViewId; label: string; icon: any }[] = [
  { id: 'reviews',      label: 'Reviews',         icon: Star },
  { id: 'inbox',        label: 'Inbox',           icon: MessagesSquare },
  { id: 'integrations', label: 'Integrations',    icon: Link2 },
  { id: 'blogs',        label: 'Blog Manager',    icon: FileText },
  { id: 'media',        label: 'Media Library',   icon: ImageIcon },
  { id: 'campaigns',    label: 'Campaigns',       icon: Megaphone },
  { id: 'analytics',    label: 'Analytics',       icon: BarChart3 },
  { id: 'seo',          label: 'SEO Center',      icon: Search },
  { id: 'notifications',label: 'Activity',        icon: Bell },
  { id: 'settings',     label: 'Settings',        icon: Settings },
];

export default function BottomNav({ view, onChange, onCompose, onOpenAI, pendingReviews = 0 }: Props) {
  const [more, setMore] = useState(false);

  const Tab = ({ id, label, Icon, badge }: { id: ViewId; label: string; Icon: any; badge?: number }) => {
    const active = view === id;
    return (
      <button onClick={() => onChange(id)} data-testid={`bottom-nav-${id}`}
        className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 ${active ? 'text-brand-orange' : 'text-ink-300'}`}>
        <Icon className="size-5" />
        <span className="text-[10px] font-medium">{label}</span>
        {!!badge && badge > 0 && (
          <span className="absolute top-1 right-[28%] text-[9px] font-bold rounded-full bg-brand-orange text-white px-1 min-w-[14px] text-center">{badge}</span>
        )}
      </button>
    );
  };

  return (
    <>
      <div className="md:hidden h-[78px]" aria-hidden /> {/* spacer so content isn't hidden behind nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/8 pb-[env(safe-area-inset-bottom)]" data-testid="bottom-nav">
        <div className="flex items-stretch h-[68px] relative px-1">
          <Tab id="dashboard" label="Home" Icon={LayoutDashboard} />
          <Tab id="posts" label="Queue" Icon={ListChecks} badge={pendingReviews ? 0 : undefined} />
          <button onClick={onCompose} aria-label="Compose"
            className="relative -top-5 size-14 rounded-full btn-primary flex items-center justify-center shadow-2xl shadow-brand-orange/40 mx-2 self-center"
            data-testid="bottom-nav-compose">
            <Plus className="size-6" />
          </button>
          <Tab id="calendar" label="Calendar" Icon={Calendar} />
          <button onClick={() => setMore(true)} data-testid="bottom-nav-more"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 ${more ? 'text-brand-orange' : 'text-ink-300'}`}>
            <MoreHorizontal className="size-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {more && (
        <div className="md:hidden fixed inset-0 z-50" data-testid="more-sheet">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMore(false)} />
          <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-ink-800 border-t border-white/8 max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] animate-[riseIn_.3s_ease]">
            <div className="sticky top-0 bg-ink-800 z-10 px-5 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">All sections</h3>
              <button onClick={() => setMore(false)} className="size-9 rounded-lg hover:bg-white/5 flex items-center justify-center"><X className="size-5" /></button>
            </div>
            <div className="px-3 py-3">
              <button onClick={() => { onOpenAI(); setMore(false); }} data-testid="more-ai-btn"
                className="w-full mb-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-orange/20 to-brand-blue/20 border border-brand-orange/30">
                <Sparkles className="size-5 text-brand-orange" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">AI Command Assistant</div>
                  <div className="text-[11px] text-ink-300">Ask anything — captions, campaigns, replies</div>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-2">
                {MORE_ITEMS.map(it => (
                  <button key={it.id} onClick={() => { onChange(it.id); setMore(false); }} data-testid={`more-${it.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition ${
                      view === it.id ? 'border-brand-orange/50 bg-brand-orange/10' : 'border-white/8 hover:bg-white/5'
                    }`}>
                    <it.icon className="size-5 text-brand-orange" />
                    <span className="text-sm font-medium">{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
