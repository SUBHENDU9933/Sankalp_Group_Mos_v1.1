import { useState } from 'react';
import LegalLayout from './LegalLayout';

export default function DataDeletionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', platforms: '', reason: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent('Data Deletion Request — Sankalp Marketing Hub');
    const body = encodeURIComponent(
      `Hello Sankalp Privacy Team,\n\n` +
      `I am submitting a request to delete my data from Sankalp Marketing Hub.\n\n` +
      `Name: ${form.name}\n` +
      `Email associated with the account: ${form.email}\n` +
      `Connected platforms to disconnect (Meta, Google, Instagram, YouTube, X, Threads, etc.): ${form.platforms || 'all'}\n` +
      `Reason (optional): ${form.reason || 'n/a'}\n\n` +
      `Please confirm receipt and proceed with full deletion of my account, connected tokens, content, and any associated analytics within 30 days as described in your Data Deletion Policy.\n\n` +
      `Thank you.`
    );
    window.location.href = `mailto:info.sankalpgrp@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <LegalLayout
      title="Data Deletion"
      subtitle="Request the complete removal of your account, connected social tokens, content and associated data from Sankalp Marketing Hub at any time."
      effectiveDate="February 15, 2026"
      metaDescription="Data Deletion instructions for Sankalp Marketing Hub. How to request removal of your account, OAuth tokens, content and analytics data, with a 30-day completion timeline."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">1. Your Right to Deletion</h2>
        <p>
          You can request deletion of every piece of personal data that Sankalp Marketing Hub holds about you, including
          your account record, connected platform OAuth tokens, content drafts and published posts, media files, and
          captured analytics. This right is offered to all users regardless of jurisdiction, in alignment with the GDPR,
          India&rsquo;s Digital Personal Data Protection Act 2023, and the developer policies of Meta, Google and X.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">2. What Gets Deleted</h2>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Your authentication record (name, email, hashed password) in our Supabase Auth store.</li>
          <li>All OAuth access tokens, refresh tokens and platform metadata in the <code className="text-brand-orange-soft">integrations</code> table.</li>
          <li>Posts, drafts, scheduled items, blogs, campaigns, reviews and media-library entries you created.</li>
          <li>Cached analytics, AI generation logs, and any telemetry tied to your user ID.</li>
          <li>Any backups containing the above are pruned in the next scheduled rotation (within 30 days).</li>
        </ul>
        <p className="mt-3">
          Where applicable, we also call the corresponding platform&rsquo;s token-revocation endpoint so the third party
          (e.g. Meta, Google) invalidates the OAuth grant on its side.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">3. How to Submit a Request</h2>
        <p>Choose either method below:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border border-white/10 rounded-xl p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-brand-orange-soft">Option A — Inside the app</div>
            <ol className="list-decimal pl-5 mt-3 space-y-1 text-sm">
              <li>Sign in to Sankalp Marketing Hub.</li>
              <li>Open <strong>Settings → Account</strong>.</li>
              <li>Click <strong>Delete my account &amp; data</strong> and confirm.</li>
            </ol>
            <p className="text-xs text-ink-400 mt-3">The in-app deletion is the fastest route and is immediate.</p>
          </div>
          <div className="border border-white/10 rounded-xl p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-brand-orange-soft">Option B — Email request</div>
            <p className="text-sm mt-3">Send a deletion request from the email address associated with your account to:</p>
            <a href="mailto:info.sankalpgrp@gmail.com" className="block mt-2 font-semibold text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a>
            <p className="text-xs text-ink-400 mt-3">Subject line: &ldquo;Data Deletion Request — Sankalp Marketing Hub&rdquo;.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">4. Submit a Request Now</h2>
        <p>Prefer a form? Fill the fields below and your email client will open a pre-filled deletion request:</p>

        <form onSubmit={submit} className="mt-5 border border-white/10 rounded-2xl p-6 bg-ink-800 space-y-4" data-testid="deletion-request-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-ink-300">Full name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none"
                data-testid="deletion-name-input"
              />
            </label>
            <label className="block">
              <span className="text-xs text-ink-300">Account email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none"
                data-testid="deletion-email-input"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-ink-300">Platforms to disconnect (optional — defaults to all)</span>
            <input
              value={form.platforms}
              onChange={(e) => setForm({ ...form, platforms: e.target.value })}
              placeholder="e.g. Facebook, Instagram, YouTube"
              className="mt-1 w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none"
              data-testid="deletion-platforms-input"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-300">Reason (optional)</span>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="mt-1 w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none resize-none"
              data-testid="deletion-reason-input"
            />
          </label>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-gradient-to-r from-brand-orange to-brand-orange-deep text-white font-semibold text-sm shadow-lg shadow-brand-orange/20 hover:opacity-95"
            data-testid="deletion-submit-btn"
          >
            Open my email client with the request
          </button>
          {submitted && (
            <div className="text-xs text-emerald-300 border border-emerald-400/30 bg-emerald-400/5 rounded-lg p-3" data-testid="deletion-submitted-msg">
              Your email client should now show a pre-filled message addressed to info.sankalpgrp@gmail.com. If not,
              please email us directly. We will confirm receipt within 72 hours.
            </div>
          )}
        </form>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">5. Confirmation Timeline</h2>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Within 72 hours</strong> — we acknowledge your request and confirm the identity of the requestor by email.</li>
          <li><strong>Within 7 calendar days</strong> — all live records, tokens and content are erased from our database, and platform OAuth grants are revoked.</li>
          <li><strong>Within 30 calendar days</strong> — backups that may still contain your data are pruned per our retention rotation; you receive a final confirmation email.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">6. Compliance Statement</h2>
        <p>
          This deletion process is designed to satisfy: (a) Article 17 of the GDPR (&ldquo;Right to erasure&rdquo;), (b)
          Section 12 of the Digital Personal Data Protection Act 2023 (India), (c) the
          {' '}<a className="text-brand-orange-soft hover:underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/docs/development/maintaining-your-app/data-deletion-callback/">Meta Data Deletion Callback policy</a>,
          and (d) the equivalent Google, YouTube and X user-data deletion requirements. We do not retain any user data
          longer than is strictly necessary for the purposes stated in our <a className="text-brand-orange-soft hover:underline" href="/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">7. Questions</h2>
        <div className="mt-3 border border-white/10 rounded-xl p-5 bg-ink-800">
          <div className="font-semibold text-ink-50">Sankalp Interior Solution — Privacy Officer</div>
          <div className="text-sm mt-2">
            Email: <a href="mailto:info.sankalpgrp@gmail.com" className="text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a>
          </div>
          <div className="text-sm">Website: <a href="https://mos.sankalpinterior.com" className="text-brand-orange-soft hover:underline">mos.sankalpinterior.com</a></div>
        </div>
      </section>
    </LegalLayout>
  );
}
