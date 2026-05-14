export default function SettingsView() {
  return (
    <div className="px-8 py-6" data-testid="settings-view">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Workspace</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Settings</h2>
      </div>
      <div className="card-elev p-6 max-w-2xl space-y-4">
        <div>
          <div className="text-sm font-semibold">Business profile</div>
          <p className="text-xs text-ink-400 mt-1">Sankalp Interior Solution — interior design firm.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-ink-400 mb-1">Brand orange</div>
            <div className="h-10 rounded-lg bg-brand-orange" />
          </div>
          <div>
            <div className="text-[11px] text-ink-400 mb-1">Brand blue</div>
            <div className="h-10 rounded-lg bg-brand-blue" />
          </div>
        </div>
        <div className="text-xs text-ink-400 pt-3 border-t border-white/8">Roles, audit logs and notification preferences are coming in V1.1.</div>
      </div>
    </div>
  );
}
