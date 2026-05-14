import { Bell, Plus, Search, Sun, Moon } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onCompose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Topbar({ title, subtitle, onCompose, theme, onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-ink-900/85 backdrop-blur-xl border-b border-white/5" data-testid="topbar">
      <div className="flex items-center gap-4 px-8 py-5">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight truncate" data-testid="topbar-title">{title}</h1>
          {subtitle && <p className="text-sm text-ink-300 mt-0.5">{subtitle}</p>}
        </div>
        <div className="relative hidden md:block">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input placeholder="Search posts, blogs, reviews…" className="input-base pl-9 pr-3 py-2 w-[280px] text-sm" data-testid="global-search-input" />
        </div>
        <button onClick={onToggleTheme} data-testid="theme-toggle-btn" aria-label="Toggle theme"
          className="size-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 flex items-center justify-center">
          {theme === 'dark' ? <Sun className="size-[18px] text-ink-200" /> : <Moon className="size-[18px] text-ink-200" />}
        </button>
        <button data-testid="notifications-btn" className="size-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 flex items-center justify-center relative">
          <Bell className="size-[18px] text-ink-200" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-brand-orange" />
        </button>
        <button onClick={onCompose} data-testid="compose-btn" className="btn-primary rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus className="size-4" /> Compose
        </button>
      </div>
    </header>
  );
}
