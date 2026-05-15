import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { platformDef } from '../lib/platforms';

interface Props {
  onCompose: () => void;
  onEditPost: (post: any) => void;
  onComposeOnDate: (datetimeLocal: string) => void;
}

export default function CalendarView({ onCompose, onEditPost, onComposeOnDate }: Props) {
  const [posts, setPosts] = useState<any[]>([]);
  const [cursor, setCursor] = useState(() => new Date());

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

  const handleDayClick = (d: Date) => {
    // Default to 09:00 of that date
    const local = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T09:00`;
    onComposeOnDate(local);
  };

  return (
    <div className="px-8 py-6" data-testid="calendar-view">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Content Calendar</div>
          <h2 className="font-display text-2xl font-semibold mt-1">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="size-9 rounded-lg border border-white/10 hover:bg-white/5"><ChevronLeft className="size-4 mx-auto" /></button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs">Today</button>
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="size-9 rounded-lg border border-white/10 hover:bg-white/5"><ChevronRight className="size-4 mx-auto" /></button>
          <button onClick={onCompose} className="btn-primary rounded-lg px-3 py-1.5 text-xs flex items-center gap-1"><Plus className="size-3" /> New post</button>
        </div>
      </div>

      <div className="card-elev overflow-hidden">
        <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-wider text-ink-400 border-b border-white/5">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((c, i) => {
            const isToday = c.date && c.date.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`min-h-[110px] border-r border-b border-white/5 p-2 group ${isToday ? 'bg-brand-orange/5' : ''} ${c.date ? 'hover:bg-white/3 cursor-pointer' : ''}`}
                onClick={() => c.date && c.items.length === 0 && handleDayClick(c.date)}
              >
                {c.date && (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-medium ${isToday ? 'text-brand-orange' : 'text-ink-400'}`}>{c.date.getDate()}</span>
                      {c.items.length === 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handleDayClick(c.date!); }} className="opacity-0 group-hover:opacity-100 size-5 rounded-md bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/30 flex items-center justify-center transition" title="Compose for this date">
                          <Plus className="size-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {c.items.slice(0, 3).map(p => (
                        <button key={p.id} onClick={(e) => { e.stopPropagation(); onEditPost(p); }}
                          className="w-full text-left text-[11px] px-1.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/8 hover:border-brand-orange/40 truncate flex items-center gap-1 transition">
                          {(p.platforms || []).slice(0, 2).map((pl: string) => {
                            const def = platformDef(pl); if (!def) return null;
                            const Icon = def.icon;
                            return <Icon key={pl} className="size-3 shrink-0" style={{ color: def.brand }} />;
                          })}
                          <span className="truncate">{(p.title || p.content || '').slice(0, 22)}</span>
                        </button>
                      ))}
                      {c.items.length > 3 && <div className="text-[10px] text-ink-500 pl-1">+{c.items.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="mt-6 text-center text-sm text-ink-400 flex flex-col items-center gap-3 py-12">
          <CalIcon className="size-10 text-ink-500" />
          No posts yet — click any empty day above, or use <button onClick={onCompose} className="btn-primary px-3 py-1.5 rounded-lg text-xs">+ New post</button>
        </div>
      )}
    </div>
  );
}
