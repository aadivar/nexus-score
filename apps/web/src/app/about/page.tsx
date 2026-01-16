import { Metadata } from 'next';
import { DIMENSION_WEIGHTS, METRICS_BY_DIMENSION, GRADE_THRESHOLDS } from '@nexus-score/core';

export const metadata: Metadata = {
  title: 'Methodology - Research Nexus Score',
  description: 'Learn how Research Nexus Score calculates metadata coverage scores based on Crossref data.',
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

        {/* Grades */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">Grading Scale</h2>
          <div className="mt-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Score Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-2xl font-bold text-green-600">
                    A
                  </td>
                  <td className="px-6 py-4 text-gray-900">{GRADE_THRESHOLDS.A}-100</td>
                  <td className="px-6 py-4 text-gray-600">
                    Excellent metadata coverage with comprehensive coverage
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-2xl font-bold text-blue-600">
                    B
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {GRADE_THRESHOLDS.B}-{GRADE_THRESHOLDS.A - 1}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    Good coverage with room for improvement in some areas
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-2xl font-bold text-yellow-600">
                    C
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {GRADE_THRESHOLDS.C}-{GRADE_THRESHOLDS.B - 1}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    Adequate coverage but with significant gaps
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-2xl font-bold text-orange-600">
                    D
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {GRADE_THRESHOLDS.D}-{GRADE_THRESHOLDS.C - 1}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    Needs substantial work across multiple dimensions
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-2xl font-bold text-red-600">
                    F
                  </td>
                  <td className="px-6 py-4 text-gray-900">0-{GRADE_THRESHOLDS.D - 1}</td>
                  <td className="px-6 py-4 text-gray-600">
                    Poor metadata coverage requiring immediate attention
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

        {/* Barcelona Declaration */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Barcelona Declaration Alignment
          </h2>
          <p className="mt-4 text-gray-600">
            The{' '}
            <a
              href="https://barcelona-declaration.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Barcelona Declaration on Open Research Information
            </a>{' '}
            (2024) calls for making research information openly available. Research Nexus Score
            supports this vision by:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-gray-600">
            <li>Making metadata coverage visible and comparable</li>
            <li>Encouraging adoption of persistent identifiers (ORCID, ROR)</li>
            <li>Promoting transparency in funding acknowledgements</li>
            <li>Supporting FAIR principles for metadata</li>
          </ul>
        </section>

        {/* Open Source */}
        <section className="mt-12 rounded-lg bg-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900">Open Source</h2>
          <p className="mt-2 text-gray-600">
            Research Nexus Score is open source. View the code, report issues, or contribute on{' '}
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
