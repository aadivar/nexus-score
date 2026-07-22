import { Metadata } from 'next';
import { DIMENSION_WEIGHTS, METRICS_BY_DIMENSION } from '@nexus-score/core';

export const metadata: Metadata = {
  title: 'Methodology - Nexus Score',
  description: 'Learn how Nexus Score calculates metadata coverage scores based on Crossref data.',
};

export default function AboutPage() {
  const dimensionInfo = [
    {
      name: 'Provenance',
      key: 'provenance' as const,
      description:
        'Measures how well the metadata establishes connections to prior work and supports research integrity. Strong provenance helps build the citation graph and enables discovery.',
    },
    {
      name: 'People',
      key: 'people' as const,
      description:
        'Evaluates author identification through ORCID iDs. Persistent researcher identifiers enable accurate attribution, automatic publication claims, and career tracking.',
    },
    {
      name: 'Organizations',
      key: 'organizations' as const,
      description:
        'Assesses institutional affiliations and ROR IDs. Clear organizational links support funder compliance, institutional reporting, and collaboration analysis.',
    },
    {
      name: 'Funding',
      key: 'funding' as const,
      description:
        'Tracks grant information using the Funder Registry. Funding metadata enables ROI analysis for funders and supports compliance monitoring.',
    },
    {
      name: 'Access',
      key: 'access' as const,
      description:
        'Measures content discoverability and availability. License information, full-text links, and abstracts improve access and enable text mining.',
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Methodology</h1>
        <p className="mt-4 text-lg text-gray-600">
          Research Nexus Score measures how well metadata contributes to Crossref&apos;s Research
          Nexus vision - connecting research outputs, people, organizations, and funders
          into a comprehensive scholarly graph.
        </p>

        {/* Total Score */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">Scoring Overview</h2>
          <p className="mt-4 text-gray-600">
            The total score is calculated out of <strong>100 points</strong>, divided
            across five dimensions. Each dimension targets a specific aspect of the
            Research Nexus vision.
          </p>
        </section>

        {/* Dimensions */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">Dimensions</h2>
          <div className="mt-6 space-y-8">
            {dimensionInfo.map((dim) => (
              <div key={dim.key} className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">{dim.name}</h3>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {DIMENSION_WEIGHTS[dim.key]} points max
                  </span>
                </div>
                <p className="mt-3 text-gray-600">{dim.description}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Metrics:</h4>
                  <ul className="mt-2 space-y-1">
                    {METRICS_BY_DIMENSION[dim.key].map((metric) => (
                      <li key={metric.key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{metric.name}</span>
                        <span className="text-gray-900">{metric.weight} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reading the Score */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">Reading the Score</h2>
          <p className="mt-4 text-gray-600">
            The score is a diagnostic, not a grade. It answers one question: how
            much of this publisher&apos;s metadata is complete enough for research to
            be found, connected, and reused? These bands describe what a score
            typically means in practice — every point below 100 maps to a
            specific, fixable metadata field.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Score Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    What It Typically Means
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 font-bold text-green-600">80–100</td>
                  <td className="px-6 py-4 text-gray-600">
                    Comprehensive coverage — the record is well connected and machine-readable
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 font-bold text-blue-600">65–79</td>
                  <td className="px-6 py-4 text-gray-600">
                    Good coverage with a small number of high-impact gaps left to close
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 font-bold text-yellow-600">50–64</td>
                  <td className="px-6 py-4 text-gray-600">
                    Adequate coverage but with significant gaps across dimensions
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 font-bold text-orange-600">35–49</td>
                  <td className="px-6 py-4 text-gray-600">
                    Substantial gaps across multiple dimensions — often a pipeline problem, not a practice problem
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 font-bold text-red-600">0–34</td>
                  <td className="px-6 py-4 text-gray-600">
                    Most metadata is missing from deposits — the biggest opportunities live here
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Source */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">Data Source</h2>
          <p className="mt-4 text-gray-600">
            Research Nexus Score uses pre-computed coverage statistics from the{' '}
            <a
              href="https://api.crossref.org/swagger-ui/index.html#/Members"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Crossref /members API endpoint
            </a>
            . These statistics are calculated daily by Crossref and represent the
            percentage of works that contain each metadata element.
          </p>
          <p className="mt-4 text-gray-600">
            The &quot;current&quot; metrics reflect works published in the last 2 calendar
            years, while &quot;backfile&quot; covers older works. The trend indicator
            compares these two periods to show improvement or decline.
          </p>
        </section>

        {/* Open Source */}
        <section className="mt-12 rounded-lg bg-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900">Open Source</h2>
          <p className="mt-2 text-gray-600">
            Nexus Score is open source. View the code, report issues, or contribute on{' '}
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
      </div>
    </div>
  );
}
