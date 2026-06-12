import { MemberSearch } from '@/components/member-search';
import { PilotBanner } from '@/components/pilot-banner';
import Link from 'next/link';

// Example publishers to highlight
const featuredPublishers = [
  { id: 286, name: 'Oxford University Press' },
  { id: 311, name: 'Wiley' },
  { id: 78, name: 'Elsevier' },
  { id: 297, name: 'Springer Nature' },
  { id: 340, name: 'Public Library of Science (PLOS)' },
  { id: 56, name: 'Cambridge University Press' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PilotBanner />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Measure Your <span className="whitespace-nowrap underline decoration-2 underline-offset-4">Research Nexus</span> Contribution
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Research Nexus Score evaluates how well your metadata connects research outputs,
            people, organizations, and funders - the pillars of Crossref&apos;s Research
            Nexus vision.
          </p>
          <div className="mt-10">
            <MemberSearch
              placeholder="Search for a publisher (e.g., Elsevier, Nature)..."
              className="mx-auto max-w-xl"
            />
          </div>
        </div>
      </section>

      {/* What is Research Nexus */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              What is the Research Nexus?
            </h2>
            <p className="mt-4 text-gray-600">
              The{' '}
              <a
                href="https://www.crossref.org/documentation/research-nexus/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Research Nexus
              </a>{' '}
              is Crossref&apos;s vision for &quot;a rich and reusable open network of
              relationships connecting research organisations, people, things, and
              actions.&quot; It goes beyond simple persistent identifiers to create an
              interconnected scholarly record.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Research Integrity',
                description:
                  'Metadata signals trustworthiness through provenance data: funding sources, contributor roles, corrections, and originality verification.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                ),
              },
              {
                title: 'Reproducibility',
                description:
                  'Connections between literature, data, software, protocols, and methods enable others to replicate research outcomes.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                ),
              },
              {
                title: 'Reporting & Assessment',
                description:
                  'Organizations track research investment outcomes, benchmark performance, demonstrate funder compliance, and inform decisions.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                ),
              },
              {
                title: 'Discoverability',
                description:
                  'Richer metadata records including abstracts and references increase visibility across thousands of systems that consume Crossref data.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beyond a Single Metadata Source */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-blue-600 pl-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Beyond a Single Metadata Source
            </h2>
            <div className="mt-5 space-y-4 text-gray-600">
              <p>
                Nexus Score measures the machine interpretability of scholarly records.
              </p>
              <p>
                The current implementation begins with metadata deposited in Crossref
                because Crossref is open, publisher-contributed infrastructure and one of
                the most important public sources of scholarly metadata. But Nexus Score
                is not limited to Crossref, nor is it a replacement for Crossref&apos;s own
                participation reports, metadata health checks, or community
                infrastructure work.
              </p>
              <p>
                The broader purpose of Nexus Score is to evaluate how well a scholarly
                object can be discovered, connected, attributed, verified, and reused
                across the research information ecosystem.
              </p>
              <p>
                The same article, dataset, preprint, grant, protocol, or research object
                may appear across Crossref, OpenAlex, PubMed, institutional repositories,
                publisher platforms, funder databases, disciplinary registries, Scopus,
                Web of Science, and other scholarly knowledge graphs. Each system may
                represent the record differently, with different levels of completeness,
                linkage, provenance, and machine-readiness.
              </p>
            </div>
          </div>

          <div className="my-8 rounded-lg border border-blue-100 bg-blue-50 p-6 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
              Nexus Score asks a larger question
            </p>
            <p className="mt-3 text-xl font-semibold leading-relaxed text-gray-900">
              How interpretable is this scholarly record to humans, systems, and AI
              agents wherever it appears?
            </p>
          </div>

          <div className="space-y-4 text-gray-600">
            <p>
              A high score does not measure research quality, journal prestige,
              publisher reputation, or scholarly impact. It measures whether the record
              contains enough structured, connected, and trustworthy metadata to support
              discovery, attribution, accountability, and AI-mediated research
              workflows.
            </p>
            <p className="font-medium text-gray-900">
              Nexus Score is an AI-readiness and interoperability signal for the
              scholarly record.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Publishers */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Popular Publishers
            </h2>
            <Link
              href="/leaderboard"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Full Leaderboard &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPublishers.map((pub) => (
              <Link
                key={pub.id}
                href={`/member/${pub.id}`}
                className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="font-medium text-gray-900">{pub.name}</p>
                <p className="mt-1 text-sm text-gray-500">View Nexus Score &rarr;</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How Scoring Works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              How We Calculate Your Score
            </h2>
            <p className="mt-4 text-gray-600">
              Nexus Score is calculated from Crossref&apos;s pre-computed coverage
              statistics. We measure five dimensions that reflect how well your metadata
              contributes to the Research Nexus.
            </p>
          </div>

          <div className="mt-12 grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                title: 'Provenance',
                points: 25,
                color: 'blue',
                metrics: ['References coverage', 'Similarity checking', 'Update policies'],
                description:
                  'Establishes trust through citation links and content verification.',
              },
              {
                title: 'People',
                points: 20,
                color: 'green',
                metrics: ['ORCID iDs', 'Contributor roles'],
                description:
                  'Connects researchers to their work through persistent identifiers.',
              },
              {
                title: 'Organizations',
                points: 15,
                color: 'purple',
                metrics: ['Affiliations', 'ROR IDs'],
                description:
                  'Links research outputs to institutions and organizations.',
              },
              {
                title: 'Funding',
                points: 20,
                color: 'yellow',
                metrics: ['Funder Registry IDs', 'Award/grant numbers'],
                description:
                  'Tracks research funding sources and enables compliance reporting.',
              },
              {
                title: 'Access',
                points: 20,
                color: 'red',
                metrics: ['Abstracts', 'Licenses', 'Full-text links'],
                description:
                  'Improves discoverability and clarifies usage rights.',
              },
            ].map((dim) => (
              <div
                key={dim.title}
                className="rounded-lg border bg-gray-50 p-5 text-center"
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                    dim.color === 'blue'
                      ? 'bg-blue-100'
                      : dim.color === 'green'
                        ? 'bg-green-100'
                        : dim.color === 'purple'
                          ? 'bg-purple-100'
                          : dim.color === 'yellow'
                            ? 'bg-yellow-100'
                            : 'bg-red-100'
                  }`}
                >
                  <span
                    className={`text-xl font-bold ${
                      dim.color === 'blue'
                        ? 'text-blue-600'
                        : dim.color === 'green'
                          ? 'text-green-600'
                          : dim.color === 'purple'
                            ? 'text-purple-600'
                            : dim.color === 'yellow'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                    }`}
                  >
                    {dim.points}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{dim.title}</h3>
                <p className="mt-2 text-xs text-gray-500">{dim.description}</p>
                <ul className="mt-3 space-y-1">
                  {dim.metrics.map((metric) => (
                    <li key={metric} className="text-xs text-gray-600">
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-lg border bg-gray-100 p-6">
            <h3 className="font-semibold text-gray-900">How Scores Are Calculated</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p>
                <strong>1. Coverage Data:</strong> We use Crossref&apos;s pre-computed
                coverage percentages for each metadata field (current and backfile).
              </p>
              <p>
                <strong>2. Dimension Score:</strong> Each dimension&apos;s percentage is
                the average of its current and backfile coverage values.
              </p>
              <p>
                <strong>3. Weighted Total:</strong> Final score = (Provenance × 25% +
                People × 20% + Organizations × 15% + Funding × 20% + Access × 20%)
              </p>
              <p>
                <strong>4. Grading:</strong> A (80-100), B (60-79), C (40-59), D (20-39),
                F (0-19)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Aligned with the{' '}
            <a
              href="https://barcelona-declaration.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Barcelona Declaration
            </a>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Nexus Score supports the open research information movement by making
            metadata coverage visible, measurable, and improvable. Better metadata means
            better connections across the scholarly ecosystem.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/about"
              className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
            >
              Learn About Our Methodology
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Data Source */}
      <section className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            Data sourced from the{' '}
            <a
              href="https://api.crossref.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Crossref REST API
            </a>
            . Nexus Score analyzes metadata coverage for{' '}
            <strong>27,000+ publishers</strong> registered with Crossref.
          </p>
        </div>
      </section>
    </div>
  );
}
