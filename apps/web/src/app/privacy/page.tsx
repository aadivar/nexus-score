import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Nexus Score',
  description: 'Privacy Policy for Nexus Score.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: March 2026</p>

        <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Minimal Data Collection</h2>
              <p className="text-blue-700">We use Vercel Analytics to understand how the site is used. No personal data is collected or stored by us.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">The Short Version</h2>
            <p className="mt-3">
              Research Nexus Score:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li><strong>Uses Vercel Analytics</strong> - Privacy-friendly, first-party analytics to understand site usage</li>
              <li><strong>Does not collect personal information</strong> directly</li>
              <li><strong>Does not sell or share data</strong></li>
              <li><strong>Does not require an account</strong> to use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
            <p className="mt-3">
              We use{' '}
              <a
                href="https://vercel.com/docs/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vercel Analytics
              </a>
              {' '}to understand how visitors use Research Nexus Score. This helps us improve the site. Vercel Analytics is privacy-friendly and first-party — it does not use cookies or track visitors across sites. It may collect:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Pages visited and time spent</li>
              <li>Approximate location (country/city level)</li>
              <li>Device type and browser</li>
              <li>Referral sources</li>
            </ul>
            <p className="mt-3">
              This data is aggregated and anonymized. No personally identifiable information is collected. Learn more in{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vercel&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">What Data We Process</h2>
            <p className="mt-3">
              The only data we process directly is publicly available metadata from the Crossref API. This includes:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Publisher names and IDs (from Crossref)</li>
              <li>Metadata coverage statistics (from Crossref)</li>
              <li>Work counts (from Crossref)</li>
            </ul>
            <p className="mt-3">
              This is all public data that anyone can access through the Crossref REST API.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Server Logs</h2>
            <p className="mt-3">
              Our hosting provider (Vercel) may collect basic server logs including IP addresses for security and operational purposes. These logs are managed by Vercel according to their privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Third-Party Services</h2>
            <p className="mt-3">
              Research Nexus Score uses the following third-party services:
            </p>
            <ul className="mt-3 space-y-3">
              <li>
                <strong>Vercel Analytics</strong> - For privacy-friendly usage analytics.{' '}
                <a
                  href="https://vercel.com/docs/analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Vercel Analytics Docs
                </a>
              </li>
              <li>
                <strong>Crossref REST API</strong> - To fetch publisher metadata.{' '}
                <a
                  href="https://www.crossref.org/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Crossref&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Vercel</strong> - For hosting.{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Vercel&apos;s Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Open Source</h2>
            <p className="mt-3">
              Research Nexus Score is fully open source. You can inspect our code on{' '}
              <a
                href="https://github.com/aadivar/nexus-score"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Changes to This Policy</h2>
            <p className="mt-3">
              If we change our privacy practices, we will update this page with a new &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
            <p className="mt-3">Questions about privacy? Use the form below.</p>
            <div
              className="mt-3"
              data-fillout-id="8qawy5VMrmus"
              data-fillout-embed-type="slider"
              data-fillout-button-text="Contact Us"
              data-fillout-slider-direction="right"
              data-fillout-inherit-parameters=""
              data-fillout-popup-size="medium"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
