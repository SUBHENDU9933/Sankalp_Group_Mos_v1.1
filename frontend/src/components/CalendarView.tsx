import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { api } from '../lib/api';
import { platformDef } from '../lib/platforms';

export default function CalendarView({ onCompose }: { onCompose: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [mode, setMode] = useState<'month' | 'week'>('month');

  useEffect(() => { api.posts.list().then(setPosts).catch(console.error); }, []);

  const days = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = start.getDay();
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const total = end.getDate();
    const cells: { date: Date | null; items: any[] }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, items: [] });
    for (let d = 1; d <= total; d++) {
      const day = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const dayStr = day.toISOString().slice(0, 10);
      const items = posts.filter(p => (p.scheduled_at || p.published_at || '').slice(0, 10) === dayStr);
      cells.push({ date: day, items });
    }
    return cells;
  }, [cursor, posts]);

  return (
    <div className="px-8 py-6" data-testid="calendar-view">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Content Calendar</div>
          <h2 className="font-display text-2xl font-semibold mt-1">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button onClick={() => setMode('week')} className={`px-3 py-1.5 text-xs ${mode==='week'?'bg-white/10':''}`}>Week</button>
            <button onClick={() => setMode('month')} className={`px-3 py-1.5 text-xs ${mode==='month'?'bg-white/10':''}`}>Month</button>
          </div>
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="size-9 rounded-lg border border-white/10 hover:bg-white/5"><ChevronLeft className="size-4 mx-auto" /></button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs">Today</button>
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="size-9 rounded-lg border border-white/10 hover:bg-white/5"><ChevronRight className="size-4 mx-auto" /></button>
          <button onClick={onCompose} className="btn-primary rounded-lg px-3 py-1.5 text-xs">+ New post</button>
        </div>
      </div>

      <div className="card-elev overflow-hidden">
        <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-wider text-ink-400 border-b border-white/5">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((c, i) => (
            <div key={i} className={`min-h-[110px] border-r border-b border-white/5 p-2 ${c.date && c.date.toDateString() === new Date().toDateString() ? 'bg-brand-orange/5' : ''}`}>
              {c.date && (
                <>
                  <div className="text-[11px] font-medium text-ink-400 mb-1.5">{c.date.getDate()}</div>
                  <div className="space-y-1">
                    {c.items.slice(0, 3).map(p => (
                      <div key={p.id} className="text-[11px] px-1.5 py-1 rounded-md bg-white/5 border border-white/8 truncate flex items-center gap-1">
                        {(p.platforms || []).slice(0, 2).map((pl: string) => {
                          const def = platformDef(pl); if (!def) return null;
                          const Icon = def.icon;
                          return <Icon key={pl} className="size-3 shrink-0" style={{ color: def.brand }} />;
                        })}
                        <span className="truncate">{(p.title || p.content || '').slice(0, 20)}</span>
                      </div>
                    ))}
                    {c.items.length > 3 && <div className="text-[10px] text-ink-500">+{c.items.length - 3} more</div>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="mt-6 text-center text-sm text-ink-400 flex flex-col items-center gap-3 py-12">
          <CalIcon className="size-10 text-ink-500" />
          No posts yet. <button onClick={onCompose} className="btn-primary px-4 py-2 rounded-lg text-xs">Plan your first post</button>
        </div>
      )}
    </div>
  );
}
