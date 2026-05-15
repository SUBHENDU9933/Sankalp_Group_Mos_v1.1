import LegalLayout from './LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The rules of the road for using Sankalp Marketing Hub. By accessing the Service you agree to the terms below."
      effectiveDate="February 15, 2026"
      metaDescription="Terms of Service for Sankalp Marketing Hub — covers ownership, acceptable use, account responsibility, API disclaimers, anti-abuse policy, platform compliance, and liability limits."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">1. Ownership and Scope</h2>
        <p>
          Sankalp Marketing Hub (the &ldquo;Service&rdquo;) is owned and operated by <strong>Sankalp Interior Solution</strong>
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;). The Service is a private internal marketing operations platform built for our
          business and our authorised collaborators. All trademarks, logos, brand assets, source code, and the underlying
          design system are the exclusive property of Sankalp Interior Solution.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">2. Eligibility &amp; Acceptable Use</h2>
        <p>You may use the Service only if you:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Are an authorised member, employee, contractor or agent of Sankalp Interior Solution.</li>
          <li>Are at least 18 years of age.</li>
          <li>Comply with this agreement and all applicable laws.</li>
        </ul>
        <p className="mt-3">You agree NOT to:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Reverse engineer, decompile, scrape, or attempt to extract source code or credentials from the Service.</li>
          <li>Use the Service to send unsolicited messages, harvest data without consent, or carry out any activity that breaches third-party platform rules.</li>
          <li>Upload malicious content, malware, or content that infringes intellectual-property rights or violates law.</li>
          <li>Resell, sublicense, or expose the Service or its outputs to third parties without our written consent.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">3. Account Responsibility</h2>
        <p>
          You are responsible for keeping your sign-in credentials confidential and for every activity that occurs under
          your account, including content published, integrations connected, and configurations changed. Notify us
          immediately at <a href="mailto:info.sankalpgrp@gmail.com" className="text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a> if
          you suspect any unauthorised use.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">4. Third-Party Integrations &amp; API Disclaimer</h2>
        <p>
          The Service depends on third-party APIs and platforms — including but not limited to Meta (Facebook,
          Instagram, Threads), Google (Business Profile, YouTube, Search Console, Analytics), X (Twitter), Supabase,
          Vercel, Anthropic and OpenAI. You understand and agree that:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>We do not control these third parties and are not responsible for their availability, accuracy, rate-limits, policy changes, or downtime.</li>
          <li>Your use of any connected platform is subject to that platform&rsquo;s own terms, developer policies, and content guidelines.</li>
          <li>A platform may revoke, throttle, or modify access at any time, which may affect features of the Service without notice.</li>
          <li>Any AI-generated text or imagery surfaced through the Service is provided &ldquo;as is&rdquo; and must be reviewed by you before publication.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">5. No Abuse, No Spam</h2>
        <p>
          You agree to use the Service only for legitimate marketing activities of Sankalp Interior Solution. Using the
          Service to send spam, run engagement-farming schemes, mass-follow / mass-unfollow, scrape competitor data
          without authorisation, or otherwise violate the Acceptable Use policies of connected platforms is strictly
          prohibited. Violations may result in immediate suspension or termination, and may be reported to the
          affected platforms.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">6. Platform Policy Compliance</h2>
        <p>You are responsible for ensuring every post, comment, message, ad, video, or other content published through the Service complies with the policies of the destination platform, including:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><a href="https://transparency.meta.com/policies/community-standards/" target="_blank" rel="noreferrer" className="text-brand-orange-soft hover:underline">Meta Community Standards</a> and Platform Terms.</li>
          <li><a href="https://www.youtube.com/intl/en/howyoutubeworks/policies/community-guidelines/" target="_blank" rel="noreferrer" className="text-brand-orange-soft hover:underline">YouTube Community Guidelines</a> and API Services TOS.</li>
          <li><a href="https://support.google.com/business/answer/3038177" target="_blank" rel="noreferrer" className="text-brand-orange-soft hover:underline">Google Business Profile Content Policies</a>.</li>
          <li><a href="https://help.x.com/en/rules-and-policies/x-rules" target="_blank" rel="noreferrer" className="text-brand-orange-soft hover:underline">X Rules</a>.</li>
        </ul>
        <p className="mt-3">We disclaim liability for content removals, account restrictions, or penalties imposed by any third-party platform.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">7. Service Availability &amp; Interruptions</h2>
        <p>
          The Service is provided on an &ldquo;as available&rdquo; basis. We may modify, suspend, or discontinue any feature
          at any time, with or without notice. Scheduled maintenance, third-party outages, infrastructure incidents,
          or force-majeure events may cause temporary downtime. We will use commercially reasonable efforts to restore
          service promptly, but we make no uptime guarantee.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">8. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, without prior notice, if we reasonably
          believe that you have breached these Terms, that your account is being used for unlawful or abusive purposes,
          or that continued access poses a security risk. Upon termination, your right to use the Service ends
          immediately, and we may delete your data in accordance with the <a className="text-brand-orange-soft hover:underline" href="/privacy">Privacy Policy</a> and <a className="text-brand-orange-soft hover:underline" href="/data-deletion">Data Deletion</a> procedures.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">9. Intellectual Property</h2>
        <p>
          All content you upload, generate, or publish through the Service remains yours. You grant us a limited,
          non-exclusive licence to host, transmit, transform (e.g. resize images, transcode video) and deliver that
          content to the third-party platforms you have connected. We retain all rights to the Service itself, including
          its design, code, AI prompts, and underlying data models.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">10. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
          IMPLIED, STATUTORY OR OTHERWISE. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND COURSE OF DEALING.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">11. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SANKALP INTERIOR SOLUTION, ITS
          AFFILIATES, OR ITS DIRECTORS, OFFICERS, EMPLOYEES OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR
          OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF (OR INABILITY TO USE) THE SERVICE. OUR
          AGGREGATE LIABILITY UNDER THESE TERMS SHALL NOT EXCEED INR 1,000.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">12. Governing Law</h2>
        <p>These Terms are governed by the laws of India. Any dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in West Bengal, India.</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink-50 mb-3">13. Contact</h2>
        <div className="mt-3 border border-white/10 rounded-xl p-5 bg-ink-800">
          <div className="font-semibold text-ink-50">Sankalp Interior Solution</div>
          <div className="text-sm mt-2">
            Email: <a href="mailto:info.sankalpgrp@gmail.com" className="text-brand-orange-soft hover:underline">info.sankalpgrp@gmail.com</a>
          </div>
          <div className="text-sm">Website: <a href="https://mos.sankalpinterior.com" className="text-brand-orange-soft hover:underline">mos.sankalpinterior.com</a></div>
        </div>
      </section>
    </LegalLayout>
  );
}
