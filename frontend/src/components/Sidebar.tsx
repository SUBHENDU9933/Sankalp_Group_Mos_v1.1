import { LayoutDashboard, PenSquare, Calendar, FileText, Image as ImageIcon, Star, Megaphone, BarChart3, Link2, Settings, MessagesSquare, Search, Sparkles, ListChecks, Bell } from 'lucide-react';

export type ViewId =
  | 'dashboard' | 'composer' | 'posts' | 'calendar' | 'blogs' | 'media'
  | 'reviews' | 'campaigns' | 'seo' | 'inbox' | 'analytics' | 'integrations'
  | 'notifications' | 'settings';

interface Props {
  view: ViewId;
  onChange: (v: ViewId) => void;
  pendingReviews?: number;
  scheduledPosts?: number;
  unreadInbox?: number;
  onLogout: () => void;
  user?: any;
  onOpenAI: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const LOGO = 'https://customer-assets.emergentagent.com/job_a2ed2df1-87d3-4ab9-817b-f487b74f494b/artifacts/7ewjwywe_logo.jpg';

export default function Sidebar({ view, onChange, pendingReviews = 0, scheduledPosts = 0, unreadInbox = 0, onLogout, user, onOpenAI, mobileOpen, onMobileClose }: Props) {
  const groups: { label: string; items: { id: ViewId; label: string; icon: any; badge?: number }[] }[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'composer',  label: 'Content Studio', icon: PenSquare },
        { id: 'posts',     label: 'Posts Queue', icon: ListChecks, badge: scheduledPosts },
        { id: 'calendar',  label: 'Calendar', icon: Calendar },
      ],
    },
    {
      label: 'Channels',
      items: [
        { id: 'inbox',     label: 'Inbox & Replies', icon: MessagesSquare, badge: unreadInbox },
        { id: 'reviews',   label: 'Reviews', icon: Star, badge: pendingReviews },
        { id: 'integrations', label: 'Integrations', icon: Link2 },
      ],
    },
    {
      label: 'Content',
      items: [
        { id: 'blogs',     label: 'Blog Manager', icon: FileText },
        { id: 'media',     label: 'Media Library', icon: ImageIcon },
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { id: 'analytics',     label: 'Analytics', icon: BarChart3 },
        { id: 'seo',           label: 'SEO Center', icon: Search },
        { id: 'notifications', label: 'Activity', icon: Bell },
        { id: 'settings',      label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />}
      <aside
        className={`w-[280px] md:w-[260px] shrink-0 h-screen flex flex-col bg-[#05080F] border-r border-white/5
          ${mobileOpen ? 'fixed top-0 left-0 z-50 translate-x-0' : 'fixed -translate-x-full'} 
          md:sticky md:top-0 md:translate-x-0 transition-transform duration-300 ease-out`}
        data-testid="sidebar">
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-white/95 p-1 shadow-lg">
          <img src={LOGO} alt="Sankalp Interior" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="flex-1">
          <div className="font-display text-[15px] font-semibold tracking-tight leading-none">Sankalp</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 mt-1">Marketing Hub</div>
        </div>
        <button onClick={onMobileClose} className="md:hidden size-8 rounded-lg hover:bg-white/5 flex items-center justify-center" aria-label="Close">
          <span className="text-ink-300 text-xl leading-none">×</span>
        </button>
      </div>

      <button onClick={onOpenAI} data-testid="open-ai-command-btn"
        className="mx-4 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/8 bg-white/5 hover:bg-white/8 text-xs text-ink-200 transition">
        <Sparkles className="size-4 text-brand-orange" />
        <span className="flex-1 text-left">Ask the AI assistant…</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-ink-300">⌘K</kbd>
      </button>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {groups.map(g => (
          <div key={g.label}>
            <div className="px-3 text-[10px] uppercase tracking-[0.22em] text-ink-500 mb-2">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map(it => {
                const active = view === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => { onChange(it.id); onMobileClose?.(); }}
                    data-testid={`nav-${it.id}`}
                    className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition group ${
                      active ? 'bg-white/8 text-white active-bar' : 'text-ink-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <it.icon className={`size-[17px] ${active ? 'text-brand-orange' : 'text-ink-400 group-hover:text-ink-200'}`} />
                    <span className="font-medium">{it.label}</span>
                    {!!it.badge && it.badge > 0 && (
                      <span className="ml-auto text-[10px] font-semibold rounded-full bg-brand-orange/95 text-white px-1.5 py-0.5 min-w-[18px] text-center">
                        {it.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center text-xs font-bold">
            {(user?.email?.[0] || 'S').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.user_metadata?.full_name || user?.email || 'Workspace owner'}</div>
            <div className="text-[10px] text-ink-500">Super Admin</div>
          </div>
          <button data-testid="logout-btn" onClick={onLogout} className="text-[11px] text-ink-400 hover:text-brand-orange transition">Sign out</button>
        </div>
      </div>
    </aside>
    </>
  );
}
