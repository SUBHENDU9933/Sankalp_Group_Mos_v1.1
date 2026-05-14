import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, CalendarDays } from 'lucide-react';
import { api } from '../lib/api';
import { pushToast } from '../lib/toast';

export default function CampaignsView() {
  const [items, setItems] = useState<any[]>([]);
  const [creating, setCreating] = useState<any | null>(null);
  const load = () => api.campaigns.list().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.campaigns.create(creating);
      pushToast({ title: 'Campaign created', tone: 'success' });
      setCreating(null); load();
    } catch (e: any) { pushToast({ title: 'Failed', description: e.message, tone: 'error' }); }
  };

  return (
    <div className="px-8 py-6" data-testid="campaigns-view">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Marketing</div>
          <h2 className="font-display text-2xl font-semibold mt-1">Campaigns</h2>
        </div>
        <button onClick={() => setCreating({ name: '', campaign_type: 'promotional', status: 'active' })} className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="size-4" /> New campaign</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c: any, i) => (
          <div key={c.id} className={`card-elev p-5 rise-in rise-in-${(i%6)+1}`}>
            <div className="size-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center mb-3"><Megaphone className="size-5" /></div>
            <div className="text-[10px] uppercase tracking-wider text-ink-400">{c.campaign_type}</div>
            <h3 className="font-display text-lg font-semibold mt-1">{c.name}</h3>
            {c.description && <p className="text-sm text-ink-300 mt-2 line-clamp-3">{c.description}</p>}
            <div className="flex items-center gap-3 mt-4 text-[11px] text-ink-400">
              {c.start_date && <span className="flex items-center gap-1"><CalendarDays className="size-3" />{c.start_date}</span>}
              <span className={`ml-auto px-2 py-0.5 rounded-full border ${c.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-ink-300 border-white/10'}`}>{c.status}</span>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={async () => { if (confirm('Delete?')) { await api.campaigns.remove(c.id); load(); } }} className="text-[11px] text-ink-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="size-3" /> Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !creating && <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-ink-400">No campaigns yet.</div>}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCreating(null)} />
          <div className="card-elev p-6 max-w-md w-full relative">
            <h3 className="font-display text-lg font-semibold mb-4">New campaign</h3>
            <div className="space-y-3">
              <input className="input-base" placeholder="Campaign name" value={creating.name} onChange={e => setCreating({...creating, name: e.target.value})} />
              <select className="input-base" value={creating.campaign_type} onChange={e => setCreating({...creating, campaign_type: e.target.value})}>
                <option value="promotional">Promotional</option>
                <option value="festive">Festive</option>
                <option value="offer">Offer</option>
                <option value="lead_gen">Lead Generation</option>
              </select>
              <textarea className="input-base min-h-[80px]" placeholder="Description" value={creating.description || ''} onChange={e => setCreating({...creating, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="input-base" value={creating.start_date || ''} onChange={e => setCreating({...creating, start_date: e.target.value})} />
                <input type="date" className="input-base" value={creating.end_date || ''} onChange={e => setCreating({...creating, end_date: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCreating(null)} className="px-3 py-2 rounded-lg border border-white/10 text-sm">Cancel</button>
              <button onClick={save} disabled={!creating.name} className="btn-primary px-4 py-2 rounded-lg text-sm">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
