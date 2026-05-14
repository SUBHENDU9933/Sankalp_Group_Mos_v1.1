import { useToasts } from '../lib/toast';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export default function ToastHost() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]" data-testid="toast-host">
      {toasts.map(t => {
        const Icon = t.tone === 'error' ? XCircle : t.tone === 'success' ? CheckCircle2 : Info;
        const color = t.tone === 'error' ? 'text-red-400' : t.tone === 'success' ? 'text-emerald-400' : 'text-sky-400';
        return (
          <div key={t.id} className="glass rounded-xl p-3.5 pr-9 relative rise-in shadow-2xl shadow-black/40">
            <button onClick={() => dismiss(t.id)} className="absolute top-2 right-2 opacity-60 hover:opacity-100">
              <X className="size-3.5" />
            </button>
            <div className="flex items-start gap-2.5">
              <Icon className={`size-4 mt-0.5 ${color}`} />
              <div>
                <div className="text-sm font-semibold">{t.title}</div>
                {t.description && <div className="text-xs text-ink-300 mt-0.5">{t.description}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
