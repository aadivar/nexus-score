import { MemberSearch } from '@/components/member-search';
import { PilotBanner } from '@/components/pilot-banner';
import Link from 'next/link';

// The 5 scoring dimensions (weights defined in @nexus-score/core scoring/weights.ts)
const dimensionTable = [
  {
    name: 'Provenance',
    points: 25,
    badgeClass: 'bg-blue-100 text-blue-700',
    measures: 'References (15), Update Policies (5), Similarity Check (5)',
    aiNeeds: 'Trust and traceability of the claim',
    plainEnglish:
      "Where did this paper come from, and can we trust the trail? Did the publisher tell us when it was published, what version this is, what license it's under, and what it cites? Basically — is the paper's paperwork in order.",
  },
  {
    name: 'People',
    points: 20,
    badgeClass: 'bg-green-100 text-green-700',
    measures: 'ORCID iD Coverage (20)',
    aiNeeds: 'Unambiguous author attribution',
    plainEnglish:
      'Do we actually know who wrote it? Are the authors real, identified humans with ORCIDs — or just names on a page that could belong to anyone? If two researchers share a name, can we tell them apart?',
  },
  {
    name: 'Organizations',
    points: 15,
    badgeClass: 'bg-purple-100 text-purple-700',
    measures: 'Affiliations (5), ROR IDs (10)',
    aiNeeds: 'Machine-readable institutional links',
    plainEnglish:
      'Do we know where the authors work? Is the university or institution properly identified with a ROR ID, or is it a free-text string like "Dept of Bio, Univ" that no machine can match to anything?',
  },
  {
    name: 'Funding',
    points: 20,
    badgeClass: 'bg-yellow-100 text-yellow-700',
    measures: 'Funder Registry IDs (10), Award Numbers (10)',
    aiNeeds: 'Investment traceability for funders',
    plainEnglish:
      'Who paid for this research, and can we follow the money? Is the funder identified with a registry ID? Is the grant number there? Without this, you can\'t answer basic questions like "what did the NIH\'s $40B actually produce?"',
  },
  {
    name: 'Access',
    points: 20,
    badgeClass: 'bg-red-100 text-red-700',
    measures: 'Licenses (7), Full-text Links (7), Abstracts (6)',
    aiNeeds: 'Whether AI can legally read and ingest the work',
    plainEnglish:
      "Can anyone actually read it? Is the full text open, or paywalled? Is there a license that tells AI tools whether they're allowed to use it? If a paper exists but no one can access it, it may as well not exist for AI discovery.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PilotBanner />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-700 py-20 text-white">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Measure your{' '}
            <span className="relative whitespace-nowrap underline decoration-2 underline-offset-4">
              metadata
            </span>{' '}
            completeness
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Nexus Score evaluates how well publishers deposit their metadata into
            Crossref — and how well those deposits contribute to connecting research
            across 5 dimensions.
          </p>
          <div className="mt-10">
            <MemberSearch
              placeholder="Search for a publisher (e.g., Elsevier, Nature)..."
              className="mx-auto max-w-xl"
            />
          </div>
        </div>
      </section>

      {/* Dimensions Table */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Dimensions (100 points total)
            </h2>
            <p className="mt-4 text-gray-600">
              Five dimensions, eleven metrics, one hundred points. Every point maps to
              a specific, fixable metadata field in your Crossref deposits.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-lg border shadow-sm">
            <table className="w-full min-w-[900px] divide-y divide-gray-200 bg-white text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-900">Dimension</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Points</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">What It Measures</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Why AI Needs It</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">In Plain English</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dimensionTable.map((dim) => (
                  <tr key={dim.name} className="align-top">
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${dim.badgeClass}`}
                      >
                        {dim.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-900">{dim.points}</td>
                    <td className="px-4 py-4 text-gray-700">{dim.measures}</td>
                    <td className="px-4 py-4 text-gray-700">{dim.aiNeeds}</td>
                    <td className="px-4 py-4 text-gray-600">{dim.plainEnglish}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* What Nexus Score Is — and What It Is Not */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            What Nexus Score Is — and What It Is Not
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="font-semibold text-green-800">Nexus Score is</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  A signal that recognises and rewards the reusability status of a
                  scholarly record
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  A signal that recognises and rewards best open science practices
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  A measure of the machine interpretability and AI-readiness of a
                  scholarly record
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="font-semibold text-red-800">Nexus Score is not</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  A measure of research quality or scholarly impact
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  A judgment of journal prestige or publisher reputation
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  A replacement for Crossref&apos;s own participation reports or
                  metadata health checks
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Aligned with the Open Research Information Movement
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Nexus Score supports the open research information movement by making
            metadata coverage visible, measurable, and improvable. Better metadata means
            better connections across the scholarly ecosystem.
          </p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {[
              { name: 'Barcelona Declaration', href: 'https://barcelona-declaration.org/' },
              { name: 'DORA', href: 'https://sfdora.org/' },
              { name: 'FAIR Principles', href: 'https://www.go-fair.org/fair-principles/' },
              { name: 'COARA', href: 'https://coara.eu/' },
              { name: 'cOAlition S', href: 'https://www.coalition-s.org/' },
              { name: 'I4OC', href: 'https://i4oc.org/' },
              { name: 'I4OA', href: 'https://i4oa.org/' },
              { name: 'Metadata 2020', href: 'https://metadata2020.org/' },
              { name: 'POSI', href: 'https://openscholarlyinfrastructure.org/' },
            ].map((org) => (
              <a
                key={org.name}
                href={org.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600"
              >
                {org.name}
              </a>
            ))}
          </div>
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
