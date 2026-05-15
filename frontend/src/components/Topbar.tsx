import { Bell, Plus, Search, Sun, Moon, Menu } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onCompose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onMenuClick?: () => void;
}

export default function Topbar({ title, subtitle, onCompose, theme, onToggleTheme, onMenuClick }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-ink-900/85 backdrop-blur-xl border-b border-white/5" data-testid="topbar">
      <div className="flex items-center gap-2 md:gap-4 px-4 md:px-8 py-4 md:py-5">
        <button onClick={onMenuClick} aria-label="Open menu" data-testid="topbar-menu-btn"
          className="md:hidden size-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0">
          <Menu className="size-5 text-ink-200" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg md:text-2xl font-semibold tracking-tight truncate" data-testid="topbar-title">{title}</h1>
          {subtitle && <p className="hidden md:block text-sm text-ink-300 mt-0.5">{subtitle}</p>}
        </div>
        <div className="relative hidden lg:block">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input placeholder="Search posts, blogs, reviews…" className="input-base pl-9 pr-3 py-2 w-[260px] xl:w-[280px] text-sm" data-testid="global-search-input" />
        </div>
        <button onClick={onToggleTheme} data-testid="theme-toggle-btn" aria-label="Toggle theme"
          className="size-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0">
          {theme === 'dark' ? <Sun className="size-[18px] text-ink-200" /> : <Moon className="size-[18px] text-ink-200" />}
        </button>
        <button data-testid="notifications-btn" className="hidden md:flex size-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 items-center justify-center relative shrink-0">
          <Bell className="size-[18px] text-ink-200" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-brand-orange" />
        </button>
        <button onClick={onCompose} data-testid="compose-btn"
          className="btn-primary rounded-xl px-3 md:px-4 h-10 text-sm flex items-center gap-2 shrink-0" aria-label="Compose">
          <Plus className="size-4" /><span className="hidden sm:inline">Compose</span>
        </button>
      </div>
    </header>
  );
}
