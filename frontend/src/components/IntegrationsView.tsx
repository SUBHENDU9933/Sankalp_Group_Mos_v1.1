import { useEffect, useState } from 'react';
import { CheckCircle2, Link2, LinkIcon, PowerOff } from 'lucide-react';
import { PLATFORMS } from '../lib/platforms';
import { api, oauthPopup } from '../lib/api';
import { pushToast } from '../lib/toast';

export default function IntegrationsView() {
  const [list, setList] = useState<any[]>([]);

  const load = () => api.integrations.list().then(setList).catch(console.error);
  useEffect(() => { load(); }, []);

  const findInt = (id: string) => list.find(x => x.platform === id);

  const connect = (id: string) => {
    oauthPopup(id, (data) => {
      if (data?.type === 'oauth-success') pushToast({ title: 'Connected', description: data.account, tone: 'success' });
      load();
    });
  };

  const disconnect = async (id: string) => {
    if (!confirm(`Disconnect ${id}?`)) return;
    await api.integrations.disconnect(id);
    pushToast({ title: 'Disconnected', tone: 'info' });
    load();
  };

  return (
    <div className="px-8 py-6 space-y-5" data-testid="integrations-view">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Channels</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Integrations</h2>
        <p className="text-sm text-ink-300 mt-1 max-w-2xl">Connect Sankalp Marketing Hub to your social, search, and analytics tools. Google connections use real OAuth — Meta and X are simulated until business verification completes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((p, i) => {
          const Int = findInt(p.id);
          const connected = !!Int?.is_connected;
          const Icon = p.icon;
          return (
            <div key={p.id} className={`relative card-elev p-5 rise-in rise-in-${(i%6)+1}`} data-testid={`integration-card-${p.id}`}>
              {connected && <div className="absolute top-3 right-3 size-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />}
              <div className="size-12 rounded-xl flex items-center justify-center mb-4 shadow-lg" style={{ background: p.bg }}>
                <Icon className="size-6" style={{ color: p.accent }} />
              </div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-ink-400 mt-1 min-h-[32px]">{p.description}</div>
              {connected && Int?.account_name && (
                <div className="mt-3 text-xs flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="size-3.5" />{Int.account_name}</div>
              )}
              <div className="mt-4 flex items-center gap-2">
                {connected ? (
                  <button onClick={() => disconnect(p.id)} data-testid={`disconnect-${p.id}`}
                    className="text-xs px-3 py-2 rounded-lg border border-white/10 hover:border-red-400/50 hover:text-red-300 transition flex items-center gap-1.5">
                    <PowerOff className="size-3.5" /> Disconnect
                  </button>
                ) : (
                  <button onClick={() => connect(p.id)} data-testid={`connect-${p.id}`}
                    className="btn-primary text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                    <Link2 className="size-3.5" /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
