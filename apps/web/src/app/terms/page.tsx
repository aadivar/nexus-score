import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Nexus-Index',
  description: 'Terms of Service for Nexus-Index.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: July 2026</p>

        <div className="mt-8 space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing and using Nexus-Index (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
            <p className="mt-3">
              Nexus-Index is a free, open-source diagnostic benchmark of metadata coverage for Crossref members. The Service provides:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Diagnostic metadata health index values based on Crossref API data</li>
              <li>Benchmark comparisons across members and content types</li>
              <li>Recommendations for metadata improvement</li>
              <li>Educational resources about the Research Nexus</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Data Source</h2>
            <p className="mt-3">
              All index data is derived from the publicly available Crossref REST API. Nexus-Index is not affiliated with, endorsed by, or officially connected to Crossref. Index values and benchmark positions are calculated independently using Crossref&apos;s public metadata coverage statistics and do not assess publisher, journal, or research quality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. No Warranty</h2>
            <p className="mt-3">
              The Service is provided &quot;as is&quot; without warranty of any kind, express or implied. We do not guarantee:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>The accuracy, completeness, or timeliness of index values</li>
              <li>Uninterrupted or error-free operation</li>
              <li>That the Service will meet your specific requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Limitation of Liability</h2>
            <p className="mt-3">
              In no event shall Nexus-Index, its creator, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Acceptable Use</h2>
            <p className="mt-3">
              You agree not to:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to interfere with the proper operation of the Service</li>
              <li>Scrape or harvest data in a manner that impacts Service availability</li>
              <li>Misrepresent index values or benchmark comparisons in misleading ways</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Licensing</h2>
            <p className="mt-3">
              Nexus-Index is open source. Source code is licensed under <strong>AGPL-3.0</strong>. Derivative data—including computed index values, dimension values, benchmark positions, and derived metrics—is licensed under <strong>CC BY-NC 4.0</strong>, free for non-commercial use with attribution. Commercial use, including incorporation into paid products and commercial AI training or product integration, requires a separate written license. See our{' '}
              <a
                href="https://github.com/aadivar/nexus-score"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub repository
              </a>{' '}
              (LICENSE, LICENSE-DATA, COMMERCIAL-USE.md) for full terms.
            </p>
            <p className="mt-3">
              NonCommercial status depends on the purpose of a use, not the user&apos;s identity or tax status. Use by a nonprofit, university, charity, government body, or individual is not automatically NonCommercial. Paid client work, revenue-generating services, commercial partnerships, and other uses directed toward commercial advantage may require a separate written license.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. API and Automated Access</h2>
            <p className="mt-3">
              Access to public endpoints does not change the license applicable to their contents. Automated access must respect published rate limits, access controls, robots directives, and machine-readable rights reservations. You may not evade technical restrictions, disrupt availability, or imply that API access grants commercial rights in Nexus-Index data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Changes to Terms</h2>
            <p className="mt-3">
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Contact</h2>
            <p className="mt-3">For questions about these Terms, please use the form below.</p>
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
