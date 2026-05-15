import { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import { api } from './lib/api';
import { pushToast } from './lib/toast';
import Login from './components/Login';
import Sidebar, { type ViewId } from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import Composer from './components/Composer';
import PostsView from './components/PostsView';
import CalendarView from './components/CalendarView';
import ReviewsView from './components/ReviewsView';
import IntegrationsView from './components/IntegrationsView';
import BlogsView from './components/BlogsView';
import CampaignsView from './components/CampaignsView';
import AnalyticsView from './components/AnalyticsView';
import MediaView from './components/MediaView';
import SEOView from './components/SEOView';
import InboxView from './components/InboxView';
import SettingsView from './components/SettingsView';
import NotificationsView from './components/NotificationsView';
import AICommand from './components/AICommand';
import ToastHost from './components/ToastHost';

if (typeof document !== 'undefined' && !document.getElementById('sankalp-fonts')) {
  const link = document.createElement('link');
  link.id = 'sankalp-fonts'; link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard:     { title: 'Good to see you back',     subtitle: 'A snapshot of your marketing operation.' },
  composer:      { title: 'Content Studio',            subtitle: 'Compose, preview and publish across every channel.' },
  posts:         { title: 'Posts Queue',               subtitle: 'Every post — drafts, queued, sent and failed.' },
  calendar:      { title: 'Content Calendar',          subtitle: 'Plan your week and month at a glance.' },
  blogs:         { title: 'Blog Manager',              subtitle: 'Write SEO-optimised posts with AI assistance.' },
  media:         { title: 'Media Library',             subtitle: 'Logos, banners, photos, videos.' },
  reviews:       { title: 'Reputation',                subtitle: 'Sentiment-tagged reviews with AI reply drafts.' },
  campaigns:     { title: 'Campaigns',                 subtitle: 'Festive, promotional and lead-gen pushes.' },
  seo:           { title: 'SEO Center',                subtitle: 'Search Console insights and content opportunities.' },
  inbox:         { title: 'Inbox & Replies',           subtitle: 'Unified messenger inbox with AI automations.' },
  analytics:     { title: 'Analytics',                 subtitle: 'Reach, engagement and conversion intelligence.' },
  integrations:  { title: 'Integrations',              subtitle: 'Connect your channels in one click.' },
  notifications: { title: 'Activity feed',             subtitle: 'Everything that happened across your channels.' },
  settings:      { title: 'Settings',                  subtitle: 'Workspace, brand, roles & notifications.' },
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewId>('dashboard');
  const [composerOpen, setComposerOpen] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [stats, setStats] = useState<any>({ pendingReviews: 0, scheduledPosts: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [composerDate, setComposerDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (typeof window !== 'undefined' && (localStorage.getItem('sankalp-theme') as any)) || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sankalp-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    api.dashboard().then(d => setStats(d.stats || {})).catch(() => {});
  }, [user, refreshKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAIOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openComposerNew = (defaultDate?: string) => {
    setEditingPost(null);
    setComposerDate(defaultDate || null);
    setComposerOpen(true);
  };
  const openComposerEdit = (post: any) => {
    setEditingPost(post);
    setComposerDate(null);
    setComposerOpen(true);
  };
  const closeComposer = () => {
    setComposerOpen(false);
    setTimeout(() => { setEditingPost(null); setComposerDate(null); }, 250);
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    pushToast({ title: 'Signed out', tone: 'info' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900">
        <div className="text-center">
          <div className="size-12 mx-auto rounded-2xl bg-gradient-to-br from-brand-orange to-brand-blue animate-pulse" />
          <p className="mt-4 text-sm text-ink-300">Booting Sankalp Marketing Hub…</p>
        </div>
        <ToastHost />
      </div>
    );
  }

  if (!user) return (<><Login /><ToastHost /></>);

  const meta = VIEW_META[view];

  return (
    <div className="min-h-screen flex bg-ink-900 text-ink-50">
      <Sidebar
        view={view}
        onChange={setView}
        pendingReviews={stats.pendingReviews || 0}
        scheduledPosts={stats.scheduledPosts || 0}
        unreadInbox={0}
        onLogout={logout}
        user={user}
        onOpenAI={() => setAIOpen(true)}
      />
      <main className="flex-1 min-w-0">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onCompose={() => openComposerNew()}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <div className="rise-in" key={view + refreshKey}>
          {view === 'dashboard' && <Dashboard onCompose={() => openComposerNew()} onView={(v) => setView(v as ViewId)} onEditPost={openComposerEdit} />}
          {view === 'composer'  && <ComposerLanding onOpen={() => openComposerNew()} />}
          {view === 'posts'     && <PostsView onEdit={openComposerEdit} onCompose={() => openComposerNew()} />}
          {view === 'calendar'  && <CalendarView onCompose={() => openComposerNew()} onEditPost={openComposerEdit} onComposeOnDate={(d) => openComposerNew(d)} />}
          {view === 'blogs'     && <BlogsView />}
          {view === 'media'     && <MediaView />}
          {view === 'reviews'   && <ReviewsView />}
          {view === 'campaigns' && <CampaignsView />}
          {view === 'seo'       && <SEOView />}
          {view === 'inbox'     && <InboxView />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'integrations'  && <IntegrationsView />}
          {view === 'notifications' && <NotificationsView />}
          {view === 'settings'  && <SettingsView />}
        </div>
      </main>

      <Composer
        key={`composer-${editingPost?.id || 'new'}-${composerDate || ''}`}
        open={composerOpen}
        onClose={closeComposer}
        onSaved={() => setRefreshKey(k => k + 1)}
        editingPost={editingPost}
        initialScheduledAt={composerDate}
      />
      <AICommand open={aiOpen} onClose={() => setAIOpen(false)} />
      <ToastHost />
    </div>
  );
}

function ComposerLanding({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="px-8 py-12" data-testid="composer-landing">
      <div className="card-elev p-10 max-w-3xl mx-auto text-center">
        <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-orange to-brand-blue mb-4" />
        <h2 className="font-display text-2xl font-semibold">Start composing</h2>
        <p className="text-sm text-ink-300 mt-2 max-w-md mx-auto">One draft, multiple platforms. AI-assisted captions, multi-language support and live previews.</p>
        <button onClick={onOpen} className="btn-primary mt-6 px-5 py-2.5 rounded-xl text-sm" data-testid="open-composer-btn">Open Content Studio</button>
      </div>
    </div>
  );
}
