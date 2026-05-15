import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import supabase from '../lib/supabase';
import { pushToast } from '../lib/toast';

const HERO_IMG = 'https://static.prod-images.emergentagent.com/jobs/a2ed2df1-87d3-4ab9-817b-f487b74f494b/images/35f8fdc44bb2f151e4f923956a922b410a1410fbcf1e99ebb74938f7490ae078.png';
const LOGO = 'https://customer-assets.emergentagent.com/job_a2ed2df1-87d3-4ab9-817b-f487b74f494b/artifacts/7ewjwywe_logo.jpg';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return pushToast({ title: 'Supabase not configured', tone: 'error' });
    setBusy(true);
    try {
      const { error } = mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) pushToast({ title: 'Auth failed', description: error.message, tone: 'error' });
      else pushToast({ title: mode === 'signup' ? 'Account created' : 'Welcome back', tone: 'success' });
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    if (!supabase) return pushToast({ title: 'Supabase not configured', tone: 'error' });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) pushToast({ title: 'Google sign-in failed', description: error.message, tone: 'error' });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]" data-testid="login-screen">
      {/* LEFT — brand story */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1A]/90 via-[#0A0F1A]/55 to-[#1F4FA1]/60" />
          <div className="absolute inset-0 grain" />
        </div>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-white/95 p-1.5 shadow-2xl shadow-black/30">
            <img src={LOGO} alt="Sankalp" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">Sankalp</div>
            <div className="text-xs text-ink-300 -mt-0.5">Interior Solution · Marketing Hub</div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-orange-soft mb-4">Marketing Operating System</p>
          <h1 className="font-display text-5xl xl:text-6xl font-semibold leading-[1.05]">
            Every channel.<br />
            <span className="grad-text">One command center.</span>
          </h1>
          <p className="mt-6 text-ink-200/90 leading-relaxed">
            Schedule, publish, monitor reviews, and craft AI-assisted content for Facebook, Instagram,
            Google Business, YouTube and your blog — all from one beautifully crafted private dashboard.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {['Multi-platform publishing', 'AI caption studio', 'Review automation', 'Visual content calendar'].map((f, i) => (
              <div key={f} className="flex items-center gap-2 text-ink-100">
                <span className="size-1.5 rounded-full bg-brand-orange" />{f}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-ink-300">
          <ShieldCheck className="size-4 text-brand-orange-soft" />
          Private internal platform · self-owned · low recurring cost
        </div>
      </div>

      {/* RIGHT — auth form */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-ink-900">
        <div className="absolute inset-0 grain pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="size-10 rounded-xl bg-white/95 p-1"><img src={LOGO} alt="Sankalp" className="w-full h-full object-contain rounded-lg" /></div>
            <div>
              <div className="font-display font-semibold">Sankalp</div>
              <div className="text-xs text-ink-300">Marketing Hub</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-ink-200 mb-6">
            <Sparkles className="size-3.5 text-brand-orange" /> Welcome to the hub
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{mode === 'signup' ? 'Create your workspace' : 'Sign in to continue'}</h2>
          <p className="text-sm text-ink-300 mt-2">Use your team email or continue with Google.</p>

          <button onClick={handleGoogle} data-testid="google-signin-btn"
            className="mt-7 w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 bg-white text-ink-900 font-medium hover:bg-ink-50 transition shadow-lg shadow-black/20">
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-ink-400">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <label className="block">
              <span className="text-xs text-ink-300">Work email</span>
              <div className="relative mt-1">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input data-testid="login-email-input" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@sankalpinterior.com" className="input-base pl-10" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-ink-300">Password</span>
              <div className="relative mt-1">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input data-testid="login-password-input" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input-base pl-10" minLength={6} />
              </div>
            </label>

            <button type="submit" disabled={busy} data-testid="login-submit-btn"
              className="btn-primary w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2">
              {busy ? 'Working…' : (mode === 'signup' ? 'Create workspace' : 'Sign in')} <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="text-center text-sm text-ink-400 mt-6">
            {mode === 'signin' ? (
              <>&nbsp;</>
            ) : (
              <>Have an account? <button onClick={() => setMode('signin')} className="text-brand-orange hover:underline">Sign in</button></>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-[11px] text-ink-400">
            <a href="/privacy" className="hover:text-brand-orange-soft" data-testid="login-privacy-link">Privacy</a>
            <span className="opacity-30">•</span>
            <a href="/terms" className="hover:text-brand-orange-soft" data-testid="login-terms-link">Terms</a>
            <span className="opacity-30">•</span>
            <a href="/data-deletion" className="hover:text-brand-orange-soft" data-testid="login-data-deletion-link">Data Deletion</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
