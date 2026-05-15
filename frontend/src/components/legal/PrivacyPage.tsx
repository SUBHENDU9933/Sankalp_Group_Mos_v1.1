import LegalLayout from './LegalLayout';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Sankalp Marketing Hub collects, uses, stores and safeguards information when you connect your social and business accounts to our platform."
      effectiveDate="February 15, 2026"
      metaDescription="Privacy Policy for Sankalp Marketing Hub — describes data collection, third-party integrations (Meta, Google, Instagram, YouTube, Supabase, Vercel), retention, and user rights."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">1. Introduction</h2>
        <p>
          This Privacy Policy describes how <strong>Sankalp Interior Solution</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;), the operator of the application <strong>Sankalp Marketing Hub</strong> (the
          &ldquo;Service&rdquo;), collects, uses, discloses and protects information when you, your authorised users, or
          customers interact with our application at <a href="https://mos.sankalpinterior.com" className="text-brand-orange-soft hover:underline">mos.sankalpinterior.com</a>.
        </p>
        <p className="mt-3">
          By signing in, connecting a third-party account, or otherwise using the Service, you agree to the practices
          described below. If you do not agree, please discontinue use and contact us at
          {' '}<a href="mailto:info.sankalpgrp@gmail.com" className="text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">2. Information We Collect</h2>
        <p>We collect only the data that is necessary to deliver the features of the Service. This includes:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Account information</strong> — your name and email address (collected when you create or sign in to a workspace).</li>
          <li><strong>Social account profile information</strong> — public profile attributes returned by Meta, Google, Instagram, YouTube, X and Threads APIs after you authorise the integration (for example: page name, page ID, channel name, channel ID, username, profile picture URL).</li>
          <li><strong>Connected-platform access tokens</strong> — OAuth access tokens, refresh tokens and token metadata required to publish content and read analytics on your behalf. Tokens are stored encrypted at rest in our database provider and are never displayed in any user interface.</li>
          <li><strong>Content you create</strong> — the post text, captions, media files, schedules and metadata you submit through the Service.</li>
          <li><strong>Analytics usage data</strong> — aggregate engagement, reach and performance metrics retrieved from your connected platforms and stored to power the in-app analytics dashboard.</li>
          <li><strong>Browser and device information</strong> — IP address, user-agent string, device type, locale and basic session telemetry used for security, debugging and abuse prevention.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">3. Why We Collect This Data</h2>
        <p>We process the information described above strictly for the purposes of operating the Service, namely:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Multi-platform publishing</strong> — to send the posts you compose to the platforms you have connected.</li>
          <li><strong>Scheduling</strong> — to queue content for publication at the date and time you select.</li>
          <li><strong>Analytics dashboard</strong> — to aggregate metrics from your connected accounts into a single view.</li>
          <li><strong>Review management</strong> — to pull reviews from Google Business and Facebook and assist with replies.</li>
          <li><strong>Automation</strong> — to perform scheduled jobs (cron-driven publishing, token refresh, status updates).</li>
          <li><strong>Customer messaging integrations</strong> — when enabled, to read and respond to Messenger and Instagram Direct messages on your behalf.</li>
          <li><strong>Service security</strong> — to detect abuse, prevent fraud, and meet our legal obligations.</li>
        </ul>
        <p className="mt-3">We do not sell, rent, or use your data for advertising or to train machine-learning models for third parties.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">4. How We Protect Your Data</h2>
        <p>We take security seriously and apply industry-standard safeguards:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>All traffic between your browser and the Service is encrypted via TLS 1.2+.</li>
          <li>Data at rest in our Supabase Postgres database is encrypted using AES-256 (Supabase platform default).</li>
          <li>Access tokens are never exposed in client-side code, logs, or APIs returned to the browser.</li>
          <li>Administrative access to the backend is restricted to authorised personnel using strong authentication.</li>
          <li>Disconnecting an integration immediately revokes the stored tokens from our database.</li>
        </ul>
        <p className="mt-3">No system is perfectly secure. If you suspect a breach or unauthorised access, please contact us immediately.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">5. Third-Party Integrations</h2>
        <p>To deliver the Service, we send and receive data with the following sub-processors. Each platform is governed by its own privacy policy, which we encourage you to review:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            { name: 'Meta (Facebook, Instagram, Threads)', purpose: 'OAuth, page management, content publishing, insights, Direct Message webhooks', href: 'https://www.facebook.com/privacy/policy/' },
            { name: 'Google (Business Profile, YouTube, Search Console, Analytics)', purpose: 'OAuth, Local Posts, video upload, search analytics', href: 'https://policies.google.com/privacy' },
            { name: 'X (Twitter)', purpose: 'OAuth 2.0 + PKCE, tweet creation, profile read', href: 'https://x.com/en/privacy' },
            { name: 'Supabase', purpose: 'Authentication, Postgres database, object storage', href: 'https://supabase.com/privacy' },
            { name: 'Vercel', purpose: 'Application hosting, serverless function execution, edge networking', href: 'https://vercel.com/legal/privacy-policy' },
            { name: 'Anthropic / OpenAI', purpose: 'AI generation of captions, hashtags, blog drafts and review replies', href: 'https://www.anthropic.com/legal/privacy' },
          ].map((p) => (
            <div key={p.name} className="border border-white/10 rounded-xl p-4">
              <div className="font-semibold text-ink-50">{p.name}</div>
              <div className="text-xs text-ink-400 mt-1">{p.purpose}</div>
              <a href={p.href} target="_blank" rel="noreferrer" className="text-xs text-brand-orange-soft hover:underline mt-2 inline-block">View their privacy policy →</a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">6. Data Retention</h2>
        <p>
          We retain account data, content, tokens and analytics for as long as your workspace is active. When you
          disconnect a platform, the associated tokens are deleted immediately. When you delete your account, all
          associated records are purged within 30 days, except where retention is required for accounting, fraud
          prevention, or compliance with applicable law. See <a className="text-brand-orange-soft hover:underline" href="/data-deletion">Data Deletion</a> for the user-initiated removal process.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">7. Your Rights</h2>
        <p>Subject to applicable law (including the Digital Personal Data Protection Act 2023 in India and the GDPR), you have the right to:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Access the personal information we hold about you.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your information (see <a className="text-brand-orange-soft hover:underline" href="/data-deletion">/data-deletion</a>).</li>
          <li>Object to processing or request restriction of processing.</li>
          <li>Withdraw consent for any optional processing at any time.</li>
          <li>Lodge a complaint with the data protection authority in your jurisdiction.</li>
        </ul>
        <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:info.sankalpgrp@gmail.com" className="text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a>.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">8. Children&rsquo;s Privacy</h2>
        <p>The Service is intended exclusively for use by members of Sankalp Interior Solution who are at least 18 years of age. We do not knowingly collect data from anyone under 18.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Material changes will be communicated via the email address on file and surfaced in-app. The &ldquo;Effective&rdquo; date above will always reflect the latest revision.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">10. Contact</h2>
        <p>
          For any questions, concerns, or requests relating to this Privacy Policy, please contact:
        </p>
        <div className="mt-4 border border-white/10 rounded-xl p-5 bg-ink-800">
          <div className="font-semibold text-ink-50">Sankalp Interior Solution</div>
          <div className="text-sm text-ink-300 mt-1">Attention: Privacy Officer</div>
          <div className="text-sm mt-2">
            Email: <a href="mailto:info.sankalpgrp@gmail.com" className="text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a>
          </div>
          <div className="text-sm">Website: <a href="https://mos.sankalpinterior.com" className="text-brand-orange-soft hover:underline">mos.sankalpinterior.com</a></div>
        </div>
      </section>
    </LegalLayout>
  );
}
