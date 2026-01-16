import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Research Nexus Score',
  description: 'Privacy Policy for Research Nexus Score. We do not track you.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: January 2026</p>

        <div className="mt-8 rounded-lg border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-green-900">We Don&apos;t Track You</h2>
              <p className="text-green-700">Research Nexus Score does not collect, store, or track any personal data.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">The Short Version</h2>
            <p className="mt-3">
              We believe in privacy. Research Nexus Score:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li><strong>Does not use cookies</strong> for tracking</li>
              <li><strong>Does not use analytics</strong> (no Google Analytics, no Plausible, nothing)</li>
              <li><strong>Does not collect personal information</strong></li>
              <li><strong>Does not sell or share data</strong> (because we don&apos;t have any)</li>
              <li><strong>Does not require an account</strong> to use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">What Data We Process</h2>
            <p className="mt-3">
              The only data we process is publicly available metadata from the Crossref API. This includes:
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
              Like most web services, our hosting provider (Vercel) may collect basic server logs including IP addresses for security and operational purposes. These logs are managed by Vercel according to their privacy policy and are not accessed or used by us for tracking purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Third-Party Services</h2>
            <p className="mt-3">
              Research Nexus Score uses the following third-party services:
            </p>
            <ul className="mt-3 space-y-3">
              <li>
                <strong>Crossref REST API</strong> - To fetch publisher metadata. Crossref&apos;s privacy policy applies to their service.
              </li>
              <li>
                <strong>Vercel</strong> - For hosting. Vercel&apos;s privacy policy applies to their infrastructure services.
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
              </a>{' '}
              to verify that we don&apos;t include any tracking code.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Changes to This Policy</h2>
            <p className="mt-3">
              If we ever change our privacy practices (we don&apos;t plan to), we will update this page. Our commitment to not tracking users will remain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
            <p className="mt-3">
              Questions about privacy? Contact{' '}
              <a
                href="mailto:varma2friend@gmail.com"
                className="text-blue-600 hover:underline"
              >
                varma2friend@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
