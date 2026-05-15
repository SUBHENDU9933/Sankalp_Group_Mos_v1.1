import { useEffect, useState } from 'react';
import { Save, Globe2, Palette, Bell, Building2 } from 'lucide-react';
import { pushToast } from '../lib/toast';

const KEY = 'sankalp-workspace-settings';

interface Settings {
  workspace_name: string;
  business_email: string;
  business_phone: string;
  timezone: string;
  default_language: 'en' | 'bn' | 'hi';
  default_tone: string;
  notify_email: boolean;
  notify_browser: boolean;
  default_platforms: string[];
}

const DEFAULT: Settings = {
  workspace_name: 'Sankalp Interior Solution',
  business_email: '',
  business_phone: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  default_language: 'en',
  default_tone: 'warm-premium',
  notify_email: true,
  notify_browser: true,
  default_platforms: ['facebook', 'instagram'],
};

export default function SettingsView() {
  const [s, setS] = useState<Settings>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(s));
    pushToast({ title: 'Settings saved', tone: 'success' });
  };

  const togglePlatform = (p: string) => {
    setS(prev => ({ ...prev, default_platforms: prev.default_platforms.includes(p) ? prev.default_platforms.filter(x => x !== p) : [...prev.default_platforms, p] }));
  };

  return (
    <div className="px-8 py-6 space-y-6 max-w-3xl" data-testid="settings-view">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Workspace</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Settings</h2>
      </div>

      <section className="card-elev p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Building2 className="size-4 text-brand-orange" /> Business profile</div>
        <Field label="Workspace name" value={s.workspace_name} onChange={(v) => setS({ ...s, workspace_name: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Business email" value={s.business_email} onChange={(v) => setS({ ...s, business_email: v })} placeholder="hello@sankalpinterior.com" />
          <Field label="Phone (for lead capture)" value={s.business_phone} onChange={(v) => setS({ ...s, business_phone: v })} placeholder="+91…" />
        </div>
      </section>

      <section className="card-elev p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Globe2 className="size-4 text-brand-orange" /> Defaults</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Timezone" value={s.timezone} onChange={(v) => setS({ ...s, timezone: v })} />
          <div>
            <div className="text-xs text-ink-300 mb-1">Default language</div>
            <select className="input-base" value={s.default_language} onChange={e => setS({ ...s, default_language: e.target.value as any })}>
              <option value="en">English</option>
              <option value="bn">Bengali</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-300 mb-1">Default AI tone</div>
          <select className="input-base" value={s.default_tone} onChange={e => setS({ ...s, default_tone: e.target.value })}>
            <option value="warm-premium">Warm &amp; premium</option>
            <option value="bold-modern">Bold &amp; modern</option>
            <option value="elegant-classic">Elegant &amp; classic</option>
            <option value="playful">Playful</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div>
          <div className="text-xs text-ink-300 mb-2">Default platforms for new posts</div>
          <div className="flex flex-wrap gap-2">
            {['facebook', 'instagram', 'threads', 'x', 'google', 'youtube'].map(p => (
              <button key={p} onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition ${s.default_platforms.includes(p) ? 'bg-brand-orange/15 border-brand-orange/50 text-brand-orange' : 'border-white/10 text-ink-300'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card-elev p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Bell className="size-4 text-brand-orange" /> Notifications</div>
        <Check label="Email me when posts are published or fail" value={s.notify_email} onChange={(v) => setS({ ...s, notify_email: v })} />
        <Check label="Show browser notifications" value={s.notify_browser} onChange={(v) => setS({ ...s, notify_browser: v })} />
      </section>

      <section className="card-elev p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Palette className="size-4 text-brand-orange" /> Brand</div>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div>
            <div className="text-[11px] text-ink-400 mb-1">Primary</div>
            <div className="h-10 rounded-lg bg-brand-orange" />
            <div className="text-[10px] text-ink-500 mt-1">#F47B20</div>
          </div>
          <div>
            <div className="text-[11px] text-ink-400 mb-1">Secondary</div>
            <div className="h-10 rounded-lg bg-brand-blue" />
            <div className="text-[10px] text-ink-500 mt-1">#1F4FA1</div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} className="btn-primary rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"><Save className="size-4" /> Save changes</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-ink-300 mb-1">{label}</div>
      <input className="input-base" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="accent-brand-orange" />
      <span className="text-sm">{label}</span>
    </label>
  );
}
