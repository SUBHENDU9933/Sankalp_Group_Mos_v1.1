import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const LOGO = 'https://customer-assets.emergentagent.com/job_a2ed2df1-87d3-4ab9-817b-f487b74f494b/artifacts/7ewjwywe_logo.jpg';

interface Props {
  title: string;
  subtitle?: string;
  effectiveDate?: string;
  metaDescription: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, subtitle, effectiveDate, metaDescription, children }: Props) {
  useEffect(() => {
    document.title = `${title} · Sankalp Marketing Hub`;
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', metaDescription);
    if (!meta.parentNode) document.head.appendChild(meta);
    // Canonical
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
    if (!canonical.parentNode) document.head.appendChild(canonical);
  }, [title, metaDescription]);

  return (
    <div className="min-h-screen bg-ink-900 text-ink-50" data-testid={`legal-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Top navigation bar */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-ink-900/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="legal-home-link">
            <img src={LOGO} alt="Sankalp" className="size-9 rounded-lg object-cover" />
            <div>
              <div className="font-display text-sm font-semibold leading-tight">Sankalp</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400">Marketing Hub</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link to="/privacy" className="px-3 py-2 rounded-lg hover:bg-white/5 text-ink-200" data-testid="nav-privacy">Privacy</Link>
            <Link to="/terms" className="px-3 py-2 rounded-lg hover:bg-white/5 text-ink-200" data-testid="nav-terms">Terms</Link>
            <Link to="/data-deletion" className="px-3 py-2 rounded-lg hover:bg-white/5 text-ink-200" data-testid="nav-data-deletion">Data Deletion</Link>
            <Link to="/" className="ml-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-orange to-brand-orange-deep text-white font-medium shadow-lg shadow-brand-orange/20" data-testid="nav-back-app">Open App</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-brand-orange-soft">Legal</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-3 leading-tight">{title}</h1>
        {subtitle && <p className="text-base sm:text-lg text-ink-300 mt-4 max-w-2xl">{subtitle}</p>}
        {effectiveDate && (
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-ink-400 border border-white/10 rounded-full px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-brand-orange" />
            Effective {effectiveDate}
          </div>
        )}
      </section>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-6 sm:px-10 pb-24">
        <div className="prose-legal space-y-8 text-[15px] leading-relaxed text-ink-200">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-ink-950">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-display font-semibold">Sankalp Interior Solution</div>
            <div className="text-ink-400 mt-1 text-xs">Private marketing operating system for our team.</div>
          </div>
          <div>
            <div className="text-ink-300 text-xs uppercase tracking-[0.2em]">Legal</div>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link to="/privacy" className="text-ink-200 hover:text-brand-orange-soft">Privacy Policy</Link>
              <Link to="/terms" className="text-ink-200 hover:text-brand-orange-soft">Terms of Service</Link>
              <Link to="/data-deletion" className="text-ink-200 hover:text-brand-orange-soft">Data Deletion</Link>
            </div>
          </div>
          <div>
            <div className="text-ink-300 text-xs uppercase tracking-[0.2em]">Contact</div>
            <a href="mailto:info.sankalpgrp@gmail.com" className="block mt-2 text-ink-200 hover:text-brand-orange-soft">info.sankalpgrp@gmail.com</a>
          </div>
        </div>
        <div className="border-t border-white/5 text-center py-5 text-[11px] text-ink-500">
          © {new Date().getFullYear()} Sankalp Interior Solution. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
