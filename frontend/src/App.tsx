import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, PenSquare, Image, FileText, Star, 
  BarChart3, Megaphone, Settings, Plus, Clock, CheckCircle2,
  Globe, Facebook, Instagram, Youtube, Search, TrendingUp,
  MessageSquare, Users, Folder, Zap, Moon, Sun, LogOut,
  ChevronRight, Edit3, Trash2, Eye, Send, Sparkles, Languages,
  Building2, Hash, Link2, X
} from 'lucide-react';
import supabase from './lib/supabase';
import { signInWithGoogle, handleGoogleRedirect } from './lib/googleAuth';

handleGoogleRedirect();

type User = any;
type View = 'dashboard' | 'composer' | 'scheduler' | 'blogs' | 'media' | 'reviews' | 'campaigns' | 'seo' | 'integrations';

interface Post {
  id: number;
  title: string;
  content: string;
  content_en?: string;
  content_bn?: string;
  content_hi?: string;
  platforms: string[];
  languages: string[];
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at: string;
  post_type: string;
  media_urls: string[];
  campaign_id?: number;
}

interface Blog {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo_title: string;
  meta_description: string;
  featured_image: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at?: string;
}

interface Review {
  id: number;
  platform: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  status: string;
  reply_text?: string;
}

interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function App() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  
  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postContent, setPostContent] = useState({ en: '', bn: '', hi: '' });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [languageOrder, setLanguageOrder] = useState<string[]>(['en']);
  const [scheduleDate, setScheduleDate] = useState('');
  const [postType, setPostType] = useState('social');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [dashRes, postsRes, blogsRes, reviewsRes, campaignsRes, intRes] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/posts').then(r => r.json()),
        fetch('/api/blogs').then(r => r.json()),
        fetch('/api/reviews').then(r => r.json()),
        fetch('/api/campaigns').then(r => r.json()),
        fetch('/api/integrations').then(r => r.json()),
      ]);
      setDashboardData(dashRes);
      setPosts(postsRes);
      setBlogs(blogsRes);
      setReviews(reviewsRes);
      setCampaigns(campaignsRes);
      setIntegrations(intRes);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // Buffer-style OAuth popup handler
  const connectPlatform = (platform: string) => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    let authUrl = '';
    if (platform === 'facebook' || platform === 'instagram') {
      authUrl = '/api/auth/facebook';
    } else if (platform === 'google' || platform === 'youtube') {
      authUrl = `/api/auth/google?platform=${platform}`;
    } else {
      // For demo, simulate connection
      authUrl = `/api/auth/facebook`;
    }
    
    const popup = window.open(
      authUrl,
      `${platform}-oauth`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    // Listen for OAuth success message
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth-success' && event.data?.platform) {
        window.removeEventListener('message', handleMessage);
        fetchAllData(); // Refresh integrations
        // Show success toast
        setTimeout(() => {
          alert(`✓ ${event.data.account} connected successfully!`);
        }, 500);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        fetchAllData();
      }
    }, 500);
  };

  const disconnectPlatform = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}? You won't be able to publish to this platform.`)) return;
    
    try {
      await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      fetchAllData();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const handleLogin = async (email: string, password: string, isSignUp: boolean) => {
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const savePost = async () => {
    const content = languageOrder.map(lang => postContent[lang as keyof typeof postContent]).filter(Boolean).join('\n\n---\n\n');
    
    const postData = {
      title: content.substring(0, 50) + '...',
      content,
      content_en: postContent.en,
      content_bn: postContent.bn,
      content_hi: postContent.hi,
      platforms: selectedPlatforms,
      languages: selectedLanguages,
      status: scheduleDate ? 'scheduled' : 'draft',
      scheduled_at: scheduleDate || new Date().toISOString(),
      post_type: postType,
      media_urls: [],
    };

    try {
      if (editingPost) {
        await fetch('/api/posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id, ...postData }),
        });
      } else {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      }
      setComposerOpen(false);
      setEditingPost(null);
      setPostContent({ en: '', bn: '', hi: '' });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return;
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchAllData();
  };

  const replyToReview = async (id: number, reply: string) => {
    await fetch('/api/reviews', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reply_text: reply, status: 'replied' }),
    });
    fetchAllData();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0a0a0b] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm opacity-60">Loading Sankalp Marketing Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen darkMode={darkMode} onLogin={handleLogin} />;
  }

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-[#1877F2]' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-[#E4405F]' },
    { id: 'google', name: 'Google Business', icon: Building2, color: 'text-[#4285F4]' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-[#FF0000]' },
    { id: 'threads', name: 'Threads', icon: Hash, color: 'text-white' },
  ];

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'composer', label: 'Content Studio', icon: PenSquare },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'blogs', label: 'Blog Manager', icon: FileText },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'seo', label: 'SEO Dashboard', icon: BarChart3 },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-[#0a0a0b] text-white' : 'bg-[#fafafa] text-gray-900'} transition-colors`}>
      {/* Sidebar */}
      <aside className={`w-[260px] shrink-0 ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'} border-r flex flex-col fixed h-full z-30`}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight leading-none">Sankalp</h1>
              <p className="text-[11px] opacity-60 mt-0.5">Marketing Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  view === item.id
                    ? darkMode 
                      ? 'bg-white/10 text-white' 
                      : 'bg-gray-900 text-white'
                    : darkMode
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
                {item.id === 'reviews' && reviews.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {reviews.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium transition-colors shadow-lg shadow-violet-600/20"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </nav>

        <div className={`p-3 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[11px] opacity-50">Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 opacity-60" /> : <Moon className="w-3.5 h-3.5 opacity-60" />}
              </button>
              <button
                onClick={handleLogout}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                <LogOut className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[260px] min-h-screen">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {/* Dashboard */}
          {view === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-[28px] font-semibold tracking-tight">Good morning, Sankalp 👋</h1>
                  <p className={`text-[14px] mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Here's what's happening with your marketing today</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    Last 30 days
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Scheduled Posts', value: dashboardData?.stats.scheduledPosts || 0, change: '+12%', icon: Clock, color: 'violet' },
                  { label: 'Drafts', value: dashboardData?.stats.draftPosts || 0, change: '+3', icon: Edit3, color: 'amber' },
                  { label: 'Published', value: dashboardData?.stats.publishedPosts || 0, change: '+24%', icon: CheckCircle2, color: 'emerald' },
                  { label: 'Pending Reviews', value: dashboardData?.stats.pendingReviews || 0, change: '2 new', icon: Star, color: 'rose' },
                ].map((stat) => (
                  <div key={stat.label} className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        stat.color === 'violet' ? 'bg-violet-500/10 text-violet-500' :
                        stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                        stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                        stat.change.startsWith('+') 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className={`text-[13px] ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{stat.label}</p>
                    <p className="text-[28px] font-semibold mt-1 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming */}
                <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[15px] font-semibold">Upcoming Schedule</h2>
                    <button onClick={() => setView('scheduler')} className="text-[12px] text-violet-500 hover:text-violet-400 font-medium">View calendar →</button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData?.upcomingPosts?.length ? dashboardData.upcomingPosts.map((post: Post) => (
                      <div key={post.id} className={`group p-4 rounded-xl border ${darkMode ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <Calendar className="w-4 h-4 opacity-60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium line-clamp-1">{post.content?.substring(0, 80) || 'Untitled post'}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`text-[11px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                                {new Date(post.scheduled_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {post.platforms?.slice(0, 3).map((p) => {
                                  const platform = platforms.find(pl => pl.id === p);
                                  return platform ? <platform.icon key={p} className={`w-3 h-3 ${platform.color}`} /> : null;
                                })}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                        </div>
                      </div>
                    )) : (
                      <div className={`text-center py-12 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-[13px]">No scheduled posts</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions & Integrations */}
                <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-[13px] font-semibold mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Create social post', icon: PenSquare, action: () => setComposerOpen(true) },
                        { label: 'Write blog post', icon: FileText, action: () => setView('blogs') },
                        { label: 'Upload media', icon: Image, action: () => setView('media') },
                      ].map((action) => (
                        <button
                          key={action.label}
                          onClick={action.action}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors text-left`}
                        >
                          <action.icon className="w-4 h-4 opacity-60" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-[13px] font-semibold mb-3">Connected Platforms</h3>
                    <div className="space-y-2.5">
                      {platforms.map((platform) => {
                        const connected = integrations.find(i => i.platform === platform.id)?.is_connected;
                        return (
                          <div key={platform.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <platform.icon className={`w-4 h-4 ${platform.color}`} />
                              <span className="text-[12px]">{platform.name}</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                <h2 className="text-[15px] font-semibold mb-5">Recent Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {posts.slice(0, 6).map((post) => (
                    <div key={post.id} className={`p-4 rounded-xl border ${darkMode ? 'border-white/5 hover:border-white/10' : 'border-gray-100 hover:border-gray-200'} transition-colors group cursor-pointer`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide ${
                          post.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' :
                          post.status === 'scheduled' ? 'bg-violet-500/10 text-violet-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {post.status}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingPost(post); setComposerOpen(true); }} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => deletePost(post.id)} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] line-clamp-2 leading-snug">{post.content?.substring(0, 100)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {post.platforms?.map(p => {
                          const pf = platforms.find(pl => pl.id === p);
                          return pf ? <pf.icon key={p} className={`w-3.5 h-3.5 ${pf.color} opacity-70`} /> : null;
                        })}
                        {post.languages?.length > 0 && (
                          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            {post.languages.join(' • ').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content Studio */}
          {view === 'composer' && (
            <div className="max-w-5xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-[24px] font-semibold tracking-tight">Content Studio</h1>
                  <p className={`text-[13px] mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Create and manage your marketing content</p>
                </div>
                <button onClick={() => setComposerOpen(true)} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium flex items-center gap-2 shadow-lg shadow-violet-600/20">
                  <Plus className="w-4 h-4" />
                  New Content
                </button>
              </div>

              <div className={`rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'} overflow-hidden`}>
                <div className={`px-5 py-3 border-b ${darkMode ? 'border-white/5' : 'border-gray-200'} flex items-center gap-4`}>
                  {['All', 'Drafts', 'Scheduled', 'Published'].map((filter) => (
                    <button key={filter} className={`text-[13px] font-medium pb-3 -mb-px border-b-2 transition-colors ${filter === 'All' ? 'border-violet-500 text-violet-500' : `border-transparent ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'}`}`}>
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="divide-y divide-white/5">
                  {posts.map((post) => (
                    <div key={post.id} className={`p-5 ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              post.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' :
                              post.status === 'scheduled' ? 'bg-violet-500/15 text-violet-400' :
                              'bg-amber-500/15 text-amber-400'
                            }`}>
                              {post.status}
                            </span>
                            <span className={`text-[11px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                              {new Date(post.scheduled_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <p className="text-[14px] leading-snug line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5">
                              {post.platforms?.map(p => {
                                const pf = platforms.find(pl => pl.id === p);
                                return pf ? <pf.icon key={p} className={`w-3.5 h-3.5 ${pf.color}`} /> : null;
                              })}
                            </div>
                            {post.languages && (
                              <div className="flex items-center gap-1">
                                <Languages className="w-3 h-3 opacity-40" />
                                <span className="text-[11px] opacity-60">{post.languages.join(' + ').toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingPost(post); setPostContent({ en: post.content_en || '', bn: post.content_bn || '', hi: post.content_hi || '' }); setSelectedPlatforms(post.platforms || []); setSelectedLanguages(post.languages || ['en']); setComposerOpen(true); }} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                            <Edit3 className="w-4 h-4 opacity-60" />
                          </button>
                          <button onClick={() => deletePost(post.id)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                            <Trash2 className="w-4 h-4 opacity-60" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scheduler View */}
          {view === 'scheduler' && (
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight mb-6">Content Calendar</h1>
              <div className={`rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'} p-6`}>
                <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={`p-3 text-center text-[11px] font-medium uppercase tracking-wide ${darkMode ? 'bg-[#0a0a0b] text-zinc-500' : 'bg-gray-50 text-gray-500'}`}>
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date();
                    date.setDate(1 - new Date(date.getFullYear(), date.getMonth(), 1).getDay() + i);
                    const isCurrentMonth = date.getMonth() === new Date().getMonth();
                    const dayPosts = posts.filter(p => new Date(p.scheduled_at).toDateString() === date.toDateString());
                    
                    return (
                      <div key={i} className={`min-h-[110px] p-2 ${darkMode ? 'bg-[#111113]' : 'bg-white'} ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                        <div className={`text-[12px] mb-1.5 ${date.toDateString() === new Date().toDateString() ? 'w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center font-medium' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 3).map(post => (
                            <div key={post.id} className="text-[10px] px-1.5 py-1 rounded bg-violet-500/20 text-violet-300 truncate">
                              {post.content?.substring(0, 20)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Blogs */}
          {view === 'blogs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-[24px] font-semibold tracking-tight">Blog Manager</h1>
                  <p className={`text-[13px] mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Connected to sankalpinterior.com</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Blog Post
                </button>
              </div>

              <div className="grid gap-4">
                {blogs.map((blog) => (
                  <div key={blog.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'} transition-colors`}>
                    <div className="flex items-start gap-4">
                      {blog.featured_image && (
                        <img src={blog.featured_image} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-medium text-[15px] truncate">{blog.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            blog.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {blog.status}
                          </span>
                        </div>
                        <p className={`text-[13px] line-clamp-2 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{blog.excerpt}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`text-[11px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>/{blog.slug}</span>
                          {blog.tags?.map(tag => (
                            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                          <Eye className="w-4 h-4 opacity-60" />
                        </button>
                        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                          <Edit3 className="w-4 h-4 opacity-60" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {view === 'reviews' && (
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight mb-6">Review Management</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Positive', count: reviews.filter(r => r.sentiment === 'positive').length, color: 'emerald' },
                  { label: 'Neutral', count: reviews.filter(r => r.sentiment === 'neutral').length, color: 'amber' },
                  { label: 'Negative', count: reviews.filter(r => r.sentiment === 'negative').length, color: 'rose' },
                ].map(stat => (
                  <div key={stat.label} className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                    <p className={`text-[12px] ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{stat.label}</p>
                    <p className="text-[24px] font-semibold mt-1">{stat.count}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        review.sentiment === 'positive' ? 'bg-emerald-500/15 text-emerald-400' :
                        review.sentiment === 'negative' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>
                        <Star className="w-5 h-5" fill="currentColor" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-[14px]">{review.reviewer_name}</h4>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                            ))}
                          </div>
                          <span className={`text-[11px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{review.platform}</span>
                        </div>
                        <p className={`text-[13px] leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{review.comment}</p>
                        
                        {review.reply_text ? (
                          <div className={`mt-3 p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <p className="text-[11px] font-medium opacity-60 mb-1">Your reply</p>
                            <p className="text-[12px]">{review.reply_text}</p>
                          </div>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              className={`flex-1 px-3 py-1.5 rounded-lg text-[12px] ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border focus:outline-none focus:ring-1 focus:ring-violet-500`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  replyToReview(review.id, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            <button className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[12px] font-medium hover:bg-violet-500">
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns */}
          {view === 'campaigns' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-[24px] font-semibold tracking-tight">Campaign Center</h1>
                <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'} transition-all group cursor-pointer`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-violet-500/15' : 'bg-violet-50'}`}>
                        <Megaphone className="w-5 h-5 text-violet-500" />
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                        campaign.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-[15px] mb-1">{campaign.name}</h3>
                    <p className={`text-[12px] line-clamp-2 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{campaign.description}</p>
                    <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      <span className="text-[11px] opacity-60">
                        {new Date(campaign.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {new Date(campaign.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO Dashboard */}
          {view === 'seo' && (
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight mb-6">SEO Dashboard</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Organic Traffic', value: '12.4K', change: '+18%', icon: TrendingUp },
                  { label: 'Top Keywords', value: '247', change: '+12', icon: Search },
                  { label: 'Avg CTR', value: '3.2%', change: '+0.4%', icon: Eye },
                  { label: 'Indexed Pages', value: '156', change: '+8', icon: Globe },
                ].map((metric) => (
                  <div key={metric.label} className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className="w-4 h-4 opacity-40" />
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">{metric.change}</span>
                    </div>
                    <p className={`text-[12px] ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{metric.label}</p>
                    <p className="text-[22px] font-semibold mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
                <h3 className="text-[14px] font-semibold mb-4">Top Performing Keywords</h3>
                <div className="space-y-2.5">
                  {[
                    { kw: 'interior designer kolkata', pos: 3, clicks: 1240, ctr: '4.2%' },
                    { kw: 'modular kitchen kolkata', pos: 5, clicks: 890, ctr: '3.8%' },
                    { kw: 'home interior design', pos: 8, clicks: 650, ctr: '2.9%' },
                    { kw: 'sankalp interior', pos: 1, clicks: 520, ctr: '12.4%' },
                    { kw: 'false ceiling design', pos: 6, clicks: 410, ctr: '3.1%' },
                  ].map((row) => (
                    <div key={row.kw} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-medium ${row.pos <= 3 ? 'bg-emerald-500/15 text-emerald-400' : row.pos <= 5 ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-500/15 text-zinc-400'}`}>{row.pos}</span>
                        <span className="text-[13px] font-medium">{row.kw}</span>
                      </div>
                      <div className="flex items-center gap-6 text-[12px]">
                        <span className={darkMode ? 'text-zinc-400' : 'text-gray-600'}>{row.clicks} clicks</span>
                        <span className={darkMode ? 'text-zinc-400' : 'text-gray-600'}>{row.ctr} CTR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {view === 'integrations' && (
            <div className="max-w-4xl">
              <h1 className="text-[24px] font-semibold tracking-tight mb-2">Platform Integrations</h1>
              <p className={`text-[13px] mb-6 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Connect your social accounts to publish directly</p>
              
              <div className="grid gap-3">
                {platforms.map((platform) => {
                  const integration = integrations.find(i => i.platform === platform.id);
                  const isConnected = integration?.is_connected;
                  
                  return (
                    <div key={platform.id} className={`group relative overflow-hidden p-5 rounded-2xl border transition-all ${darkMode ? 'bg-[#111113] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'} ${isConnected ? 'ring-1 ring-emerald-500/20' : ''}`}>
                      {isConnected && (
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full" />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-500/10' : darkMode ? 'bg-white/5' : 'bg-gray-50'} transition-colors`}>
                            <platform.icon className={`w-5.5 h-5.5 ${platform.color}`} />
                            {isConnected && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-[14px]">{platform.name}</h3>
                              {isConnected && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium uppercase tracking-wide">Active</span>
                              )}
                            </div>
                            <p className={`text-[12px] mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                              {isConnected ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  {integration.account_name} • Connected
                                </span>
                              ) : (
                                'Click to connect your account'
                              )}
                            </p>
                            {isConnected && platform.id === 'facebook' && (
                              <p className={`text-[11px] mt-1 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>12.4K followers • Last sync: just now</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isConnected && (
                            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors`}>
                              <Settings className="w-4 h-4 opacity-50" />
                            </button>
                          )}
                          <button 
                            onClick={() => isConnected ? disconnectPlatform(platform.id) : connectPlatform(platform.id)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                            isConnected 
                              ? darkMode ? 'bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-zinc-400' : 'bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600'
                              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30'
                          }`}>
                            {isConnected ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                      
                      {isConnected && (
                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'} flex items-center justify-between`}>
                          <div className="flex items-center gap-4 text-[11px]">
                            <span className={darkMode ? 'text-zinc-500' : 'text-gray-500'}>
                              <span className="text-emerald-400 font-medium">✓</span> Publishing enabled
                            </span>
                            <span className={darkMode ? 'text-zinc-500' : 'text-gray-500'}>
                              <span className="text-emerald-400 font-medium">✓</span> Analytics connected
                            </span>
                          </div>
                          <span className={`text-[10px] ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>ID: {integration.account_id?.substring(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Google Analytics & Search Console */}
                {[
                  { name: 'Google Analytics', icon: BarChart3, color: 'text-[#E37400]' },
                  { name: 'Google Search Console', icon: Search, color: 'text-[#4285F4]' },
                ].map((tool) => (
                  <div key={tool.name} className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'} flex items-center justify-between`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <tool.icon className={`w-5 h-5 ${tool.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-[14px]">{tool.name}</h3>
                        <p className={`text-[12px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Connect for analytics</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-[13px] font-medium bg-violet-600 hover:bg-violet-500 text-white">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media & other views placeholder */}
          {['media'].includes(view) && (
            <div className={`p-12 rounded-2xl border text-center ${darkMode ? 'bg-[#111113] border-white/5' : 'bg-white border-gray-200'}`}>
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="font-medium mb-1">Media Library</h3>
              <p className={`text-[13px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Upload and organize your project photos, videos, and brand assets</p>
            </div>
          )}
        </div>
      </main>

      {/* Composer Modal */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[20px] ${darkMode ? 'bg-[#111113] border border-white/10' : 'bg-white border border-gray-200'} shadow-2xl flex flex-col`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                    <PenSquare className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[15px]">Create Post</h2>
                    <p className={`text-[12px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Multi-language content for Sankalp</p>
                  </div>
                </div>
                <button onClick={() => setComposerOpen(false)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Platform Selection */}
                <div className="mb-6">
                  <label className="text-[12px] font-medium uppercase tracking-wide opacity-60 mb-2.5 block">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                        className={`px-3.5 py-2 rounded-xl border text-[13px] font-medium flex items-center gap-2 transition-all ${
                          selectedPlatforms.includes(p.id)
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : darkMode ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <p.icon className={`w-4 h-4 ${selectedPlatforms.includes(p.id) ? 'text-white' : p.color}`} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="mb-6">
                  <label className="text-[12px] font-medium uppercase tracking-wide opacity-60 mb-2.5 block">Languages</label>
                  <div className="flex items-center gap-2 mb-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          const newLangs = selectedLanguages.includes(lang.code)
                            ? selectedLanguages.filter(l => l !== lang.code)
                            : [...selectedLanguages, lang.code];
                          setSelectedLanguages(newLangs);
                          setLanguageOrder(newLangs);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                          selectedLanguages.includes(lang.code)
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {lang.native}
                      </button>
                    ))}
                  </div>
                  {selectedLanguages.length > 1 && (
                    <p className={`text-[11px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Order: {languageOrder.map(l => languages.find(x => x.code === l)?.native).join(' → ')}</p>
                  )}
                </div>

                {/* Content Editors */}
                <div className="space-y-4">
                  {languageOrder.map((langCode) => {
                    const lang = languages.find(l => l.code === langCode)!;
                    return (
                      <div key={langCode}>
                        <label className="text-[12px] font-medium flex items-center gap-2 mb-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-white/10' : 'bg-gray-900 text-white'}`}>
                            {lang.code.toUpperCase()}
                          </span>
                          {lang.name} Content
                        </label>
                        <textarea
                          value={postContent[langCode as keyof typeof postContent]}
                          onChange={(e) => setPostContent(prev => ({ ...prev, [langCode]: e.target.value }))}
                          placeholder={`Write your ${lang.name} content here...`}
                          className={`w-full h-28 px-3.5 py-2.5 rounded-xl text-[14px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                            darkMode ? 'bg-[#0a0a0b] border border-white/10 placeholder-zinc-600' : 'bg-gray-50 border border-gray-200 placeholder-gray-400'
                          }`}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-3">
                            <button className={`text-[11px] flex items-center gap-1 ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'}`}>
                              <Hash className="w-3 h-3" />
                              Hashtags
                            </button>
                            <button className={`text-[11px] flex items-center gap-1 ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'}`}>
                              <Sparkles className="w-3 h-3" />
                              AI Assist
                            </button>
                          </div>
                          <span className={`text-[11px] ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{postContent[langCode as keyof typeof postContent].length} chars</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Schedule */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <label className="text-[12px] font-medium uppercase tracking-wide opacity-60 mb-2.5 block">Schedule</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className={`px-3.5 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                        darkMode ? 'bg-[#0a0a0b] border border-white/10' : 'bg-gray-50 border border-gray-200'
                      }`}
                    />
                    <select value={postType} onChange={(e) => setPostType(e.target.value)} className={`px-3.5 py-2 rounded-xl text-[13px] focus:outline-none ${darkMode ? 'bg-[#0a0a0b] border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                      <option value="social">Social Post</option>
                      <option value="google">Google Business</option>
                      <option value="offer">Offer Post</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${darkMode ? 'border-white/10 bg-[#0c0c0d]' : 'border-gray-200 bg-gray-50'} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2">
                  <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
                    <Image className="w-4 h-4 opacity-60" />
                  </button>
                  <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
                    <Folder className="w-4 h-4 opacity-60" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setComposerOpen(false)} className={`px-4 py-2 rounded-xl text-[13px] font-medium ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
                    Cancel
                  </button>
                  <button onClick={savePost} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium flex items-center gap-1.5 shadow-lg shadow-violet-600/20">
                    <Send className="w-3.5 h-3.5" />
                    {scheduleDate ? 'Schedule' : 'Save Draft'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoginScreen({ darkMode, onLogin }: { darkMode: boolean; onLogin: (email: string, password: string, isSignUp: boolean) => void }) {
  const [email, setEmail] = useState('demo@sankalp.com');
  const [password, setPassword] = useState('password123');
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-[#0a0a0b]' : 'bg-gray-50'}`}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-600/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className={`text-[26px] font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sankalp Marketing Hub</h1>
          <p className={`text-[14px] mt-1.5 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Internal marketing automation platform</p>
        </div>

        <div className={`p-7 rounded-[20px] border shadow-xl ${darkMode ? 'bg-[#111113] border-white/10' : 'bg-white border-gray-200'}`}>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password, isSignUp); }} className="space-y-4">
            <div>
              <label className={`text-[12px] font-medium mb-1.5 block ${darkMode ? 'text-zinc-400' : 'text-gray-700'}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  darkMode ? 'bg-[#0a0a0b] border border-white/10 text-white placeholder-zinc-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="you@sankalp.com"
                required
              />
            </div>
            <div>
              <label className={`text-[12px] font-medium mb-1.5 block ${darkMode ? 'text-zinc-400' : 'text-gray-700'}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  darkMode ? 'bg-[#0a0a0b] border border-white/10 text-white placeholder-zinc-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[14px] font-medium transition-colors shadow-lg shadow-violet-600/20">
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-5">
            <div className={`absolute inset-0 flex items-center ${darkMode ? 'opacity-20' : 'opacity-100'}`}>
              <div className={`w-full border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`} />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-3 text-[11px] uppercase tracking-wide ${darkMode ? 'bg-[#111113] text-zinc-500' : 'bg-white text-gray-500'}`}>or</span>
            </div>
          </div>

          <button onClick={() => signInWithGoogle('Sankalp Marketing Hub')} className={`w-full py-2.5 rounded-xl border text-[14px] font-medium flex items-center justify-center gap-2.5 transition-colors ${darkMode ? 'border-white/10 hover:bg-white/5 text-zinc-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className={`text-center text-[12px] mt-5 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-violet-500 hover:text-violet-400 font-medium">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className={`text-center text-[11px] mt-6 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
          Private internal platform • Sankalp Interior Solution
        </p>
      </div>
    </div>
  );
}