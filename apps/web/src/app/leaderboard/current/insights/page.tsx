import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Current Era Insights - Nexus Score',
  description:
    'Key findings from the current-era leaderboard. How publishers are improving their metadata practices on recent content.',
};

export default function CurrentEraInsightsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/leaderboard/current"
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Current Era Leaderboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Leaderboard Insights
          </h1>
          <p className="mt-2 text-gray-600">
            Three lenses on the same data — each tells a different story
          </p>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                  Known Issues
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  Gaps in the methodology are tracked openly as community feedback.
                </p>
              </div>
              <a
                href="https://github.com/aadivar/nexus-score/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-950"
              >
                View GitHub Issues
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5H19.5M19.5 4.5V10.5M19.5 4.5L10.5 13.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.5V19.5H4.5V4.5H9.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mb-10 not-prose">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Jump to</p>
            <div className="flex flex-wrap gap-2">
              <a href="#overall-vs-current" className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
                1. Overall vs Current Era
              </a>
              <a href="#by-content-type" className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100">
                2. By Content Type
              </a>
              <a href="#by-dimension" className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100">
                3. By Dimension
              </a>
              <a href="#by-publisher-type" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                4. By Publisher Type
              </a>
            </div>
          </div>
        </nav>

        <article className="prose prose-gray max-w-none">

          {/* ======== SECTION 1: OVERALL VS CURRENT ERA ======== */}
          <div id="overall-vs-current" className="not-prose mb-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
            <h2 className="text-2xl font-bold text-gray-900 m-0">Overall vs Current Era</h2>
          </div>
          <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 not-prose mb-6">
            <p className="text-sm text-blue-800">
              <strong>What this shows:</strong> How the picture changes when you strip away historical backfiles
              and judge publishers only on content from the last 2 years.
            </p>
          </div>

          <p>
            The <Link href="/leaderboard" className="font-medium underline">overall leaderboard</Link> averages
            current and backfile metadata. Publishers with large historical catalogs get dragged down by old
            content they can&apos;t retroactively fix. The{' '}
            <Link href="/leaderboard/current" className="font-medium underline">current era leaderboard</Link> ranks
            purely on recent content, showing who&apos;s doing the best work <em>right now</em>.
          </p>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Metric</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Overall</th>
                  <th className="px-4 py-3 text-center font-medium text-blue-700">Current Era</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="px-4 py-3">Average score</td>
                  <td className="px-4 py-3 text-center">19</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-700">23</td>
                  <td className="px-4 py-3 text-center text-emerald-600">+4</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Grade A publishers</td>
                  <td className="px-4 py-3 text-center">2</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-700">11</td>
                  <td className="px-4 py-3 text-center text-emerald-600">+9</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Grade B publishers</td>
                  <td className="px-4 py-3 text-center">41</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-700">251</td>
                  <td className="px-4 py-3 text-center text-emerald-600">+210</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Grade F publishers</td>
                  <td className="px-4 py-3 text-center">19,547</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-700">17,665</td>
                  <td className="px-4 py-3 text-center text-emerald-600">-1,882</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>2,844 publishers</strong> (12.4%) earn a higher grade on current content than overall.
            The industry <em>is</em> improving — it&apos;s just buried under decades of legacy metadata.
          </p>

          <h3>The Biggest Transformations</h3>
          <p>
            These large publishers look completely different when judged on recent work:
          </p>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Publisher</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Current Works</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Overall</th>
                  <th className="px-4 py-3 text-center font-medium text-blue-700">Current</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Jump</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['American Physical Society', '55K', '58 (C)', '81 (A)', 'C→A'],
                  ['American Society for Microbiology', '15K', '67 (B)', '86 (A)', 'B→A'],
                  ['American Chemical Society', '210K', '48 (D)', '70 (B)', 'D→B'],
                  ['American Meteorological Society', '4K', '41 (D)', '66 (B)', 'D→B'],
                  ['IEEE', '883K', '34 (F)', '41 (D)', 'F→D'],
                  ['SAGE Publications', '234K', '48 (D)', '61 (C)', 'D→C'],
                  ['BMJ', '64K', '33 (F)', '47 (D)', 'F→D'],
                  ['Wolters Kluwer', '237K', '26 (F)', '35 (D)', 'F→D'],
                ].map(([name, works, overall, current, jump]) => (
                  <tr key={name}>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{works}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{overall}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-700">{current}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {jump}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <strong>APS</strong> is the standout — a C-overall publisher producing A-grade metadata right now
            (score 81, #6 among all active publishers). <strong>ASM</strong> jumps from B to A
            (#3 in current era, score 86). Only <strong>135 publishers</strong> (0.6%) actually score
            lower on current content than overall.
          </p>

          <div className="not-prose my-8 border-t border-gray-200" />

          {/* ======== SECTION 2: BY CONTENT TYPE ======== */}
          <div id="by-content-type" className="not-prose mb-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">2</span>
            <h2 className="text-2xl font-bold text-gray-900 m-0">By Content Type</h2>
          </div>
          <div className="rounded-lg border-l-4 border-purple-400 bg-purple-50 p-4 not-prose mb-6">
            <p className="text-sm text-purple-800">
              <strong>What this shows:</strong> Aggregate scores mix content types with fundamentally different metadata
              expectations. The{' '}
              <Link href="/leaderboard/current" className="font-medium underline">content-type filter</Link> on
              both leaderboards lets you rank publishers by specific types — and the rankings shift dramatically.
            </p>
          </div>

          <h3>The Aggregate Lies</h3>
          <p>
            A publisher registering journal articles, peer reviews, components, and corrections gets one
            blended score — but peer reviews don&apos;t have abstracts by design, and components rarely carry
            funding metadata. The aggregate punishes publishers for depositing <em>more</em> content types.
          </p>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Publisher</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Aggregate</th>
                  <th className="px-4 py-3 text-center font-medium text-purple-700">Journal Articles</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">The Diluter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['eLife', '31 (F)', '97 (A)', 'Peer Reviews: 13 (F)'],
                  ['APS', '81 (A)', '81 (A)', 'Proceedings: 7 (F)'],
                  ['MDPI', '68 (B)', '71 (B)', 'Consistent across types'],
                ].map(([name, aggregate, ja, diluter]) => (
                  <tr key={name}>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{aggregate}</td>
                    <td className="px-4 py-3 text-center font-semibold text-purple-700">{ja}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">{diluter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <strong>eLife</strong> is the most dramatic example. Their aggregate current score is 31/F —
            but filter to journal articles and they&apos;re <strong>97/A</strong>, jumping
            from #2,581 to <strong>#2 in the entire leaderboard</strong>. The aggregate was being
            destroyed by peer reviews (13/F) — content that by design doesn&apos;t carry abstracts or
            funding metadata.
          </p>

          <h3>Rankings Shift Dramatically</h3>
          <p>
            Six of the journal-article top 10 weren&apos;t even in the overall top 2,000. The content-type
            filter doesn&apos;t just adjust scores — it tells a completely different story about who&apos;s
            actually doing well.
          </p>

          <h3>Pipeline Per Type, Not Per Discipline</h3>
          <p>
            The finding is consistent across every publisher analyzed: <strong>metadata quality is driven
            by the deposit pipeline per content type</strong>, not by the discipline of the research.
            When APS invests in their journal article pipeline, it shows immediately at 81/A. Their
            proceedings pipeline, untouched, sits at 7/F. Same publisher, same era, two completely
            different investments.
          </p>

          <div className="not-prose my-8 border-t border-gray-200" />

          {/* ======== SECTION 3: BY DIMENSION ======== */}
          <div id="by-dimension" className="not-prose mb-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">3</span>
            <h2 className="text-2xl font-bold text-gray-900 m-0">By Dimension</h2>
          </div>
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 not-prose mb-6">
            <p className="text-sm text-amber-800">
              <strong>What this shows:</strong> The five dimensions of the Nexus Score are not equally adopted.
              Some are nearly solved, others are essentially empty — even on current content. This is where the gaps are.
            </p>
          </div>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Dimension</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">What It Measures</th>
                  <th className="px-4 py-3 text-center font-medium text-amber-700">Avg (Current)</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['Access', 'Licenses, full-text links, abstracts', '47', 'Improving', 'bg-yellow-100 text-yellow-800'],
                  ['People', 'ORCID IDs for authors', '28', 'Uneven', 'bg-orange-100 text-orange-800'],
                  ['Provenance', 'References, update policies, similarity check', '25', 'Uneven', 'bg-orange-100 text-orange-800'],
                  ['Organizations', 'Affiliations, ROR IDs', '7', 'Near Empty', 'bg-red-100 text-red-800'],
                  ['Funding', 'Funder registry IDs, award numbers', '2', 'Near Empty', 'bg-red-100 text-red-800'],
                ].map(([dim, measures, avg, status, color]) => (
                  <tr key={dim}>
                    <td className="px-4 py-3 font-medium">{dim}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{measures}</td>
                    <td className="px-4 py-3 text-center font-bold">{avg}/100</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Access (47/100) — The Closest to Solved</h3>
          <p>
            Licenses are widely deposited. Full-text links are common. Abstracts are the weak spot — some
            publishers are actively restricting abstract access due to AI concerns, while others are
            expanding it. This dimension shows the most variation publisher to publisher.
          </p>

          <h3>People (28/100) — ORCID Adoption Is Uneven</h3>
          <p>
            Some publishers (APS, eLife, MDPI) have near-universal ORCID coverage on current content.
            Others haven&apos;t started. When a publisher turns on ORCID deposits, coverage jumps
            overnight — this is a pipeline switch, not a gradual adoption curve.
          </p>

          <h3>Provenance (25/100) — References Are Strong, Policies Are Not</h3>
          <p>
            Reference deposits are high across the industry. But update policies (CrossMark) and
            similarity checking (Similarity Check / iThenticate) remain low. These are publisher service subscriptions,
            not metadata deposits — harder to change at scale.
          </p>

          <h3>Organizations (7/100) — ROR Is Still Early</h3>
          <p>
            Institutional identifiers are the newest metadata field. ROR adoption is growing but from
            a near-zero base. Affiliations as text strings are more common, but structured ROR IDs
            are what make the data machine-readable. OJS 3.5 now enables smaller publishers to deposit
            ROR — expect this to accelerate.
          </p>

          <h3>Funding (2/100) — The Biggest Gap</h3>
          <p>
            Funder registry IDs and award numbers are essentially absent across the industry. This is
            the single largest gap in scholarly metadata. Absent funding metadata does not mean absent
            funding — many funded papers simply lack the deposit. For humanities publishers where
            research is often unfunded, this dimension is structurally penalizing. Use the content-type
            filter to see funding coverage for journal articles specifically.
          </p>

          <div className="not-prose my-8 border-t border-gray-200" />

          {/* ======== SECTION 4: BY PUBLISHER TYPE ======== */}
          <div id="by-publisher-type" className="not-prose mb-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</span>
            <h2 className="text-2xl font-bold text-gray-900 m-0">By Publisher Type</h2>
          </div>
          <div className="rounded-lg border-l-4 border-emerald-400 bg-emerald-50 p-4 not-prose mb-6">
            <p className="text-sm text-emerald-800">
              <strong>What this shows:</strong> Who is leading on metadata quality — scholarly societies,
              commercial publishers, or small independents? The answer depends on how you measure.
            </p>
          </div>

          <h3>Scholarly Societies Are Quietly Leading</h3>
          <p>
            US-based scholarly societies dominate the current-era large publisher rankings.
            ASM, APS, AAS, PNAS, AGU, and ACS all score B or higher — while the commercial giants
            (Elsevier, Springer, Wiley) remain D&apos;s. These societies, not the publishing conglomerates,
            are setting the standard for metadata quality at scale.
          </p>

          <h3>Commercial Publishers: Improved, But Still D&apos;s</h3>
          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Publisher</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Current Works</th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">Current Score</th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['MDPI', '632K', '68', 'B', 'bg-blue-100 text-blue-800'],
                  ['SAGE', '234K', '61', 'C', 'bg-yellow-100 text-yellow-800'],
                  ['IOP Publishing', '117K', '55', 'C', 'bg-yellow-100 text-yellow-800'],
                  ['Wiley', '895K', '48', 'D', 'bg-orange-100 text-orange-800'],
                  ['Springer Nature', '2.0M', '47', 'D', 'bg-orange-100 text-orange-800'],
                  ['Elsevier', '3.0M', '42', 'D', 'bg-orange-100 text-orange-800'],
                  ['IEEE', '883K', '41', 'D', 'bg-orange-100 text-orange-800'],
                  ['OUP', '451K', '29', 'F', 'bg-red-100 text-red-800'],
                ].map(([name, works, score, grade, color]) => (
                  <tr key={name}>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{works}</td>
                    <td className="px-4 py-3 text-center font-bold">{score}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>{grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            MDPI remains the only commercial-scale publisher to earn a B. <strong>OUP is the worst
            performer among major publishers even on current content</strong> — still an F at 29.
          </p>

          <h3>South Korea Still Dominates the Top 50</h3>
          <p>
            <strong>33 of the top 50</strong> current-era publishers are South Korean — nearly identical
            to the overall leaderboard. The pattern holds across eras and content types.
          </p>

          <h3>Small Publishers: High Scores, Different Challenge</h3>
          <p>
            Many top-scoring publishers have fewer than 10,000 DOIs. Achieving 100% metadata coverage on
            172 articles is a different challenge than on 24 million. Small publishers have a structural
            advantage in rankings — but the ones actively working to improve (like i-manager Publications
            at score 25) demonstrate that awareness of the gap is the first step.
          </p>

          <div className="not-prose my-8 border-t border-gray-200" />

          {/* ======== BOTTOM LINE ======== */}
          <h2>The Bottom Line</h2>
          <p>
            Every lens reveals something different:
          </p>
          <ul>
            <li>
              <strong>Overall vs Current:</strong> The industry is getting better — 2,844 publishers
              earn a higher grade on recent content. The backfile drags the picture down.
            </li>
            <li>
              <strong>By Content Type:</strong> Aggregate scores mislead. eLife is an F in aggregate
              but an A on journal articles. The pipeline per content type, not the discipline, determines quality.
            </li>
            <li>
              <strong>By Dimension:</strong> Access is nearly solved. ORCIDs are unevenly adopted.
              Organizations and Funding are essentially empty across the board — the two biggest
              opportunities for the industry.
            </li>
            <li>
              <strong>By Publisher Type:</strong> Scholarly societies lead. Commercial giants are stuck
              in D territory. Small publishers score high but at low volume.
            </li>
          </ul>
          <p>
            Use the{' '}
            <Link href="/leaderboard/current" className="font-medium underline">content-type filter</Link> on
            the leaderboard to explore these patterns for any publisher.
          </p>
        </article>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-900">
            See where your publisher stands
          </p>
          <div className="flex gap-3">
            <Link
              href="/leaderboard/current"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Current Era Leaderboard
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Overall Leaderboard
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Data sourced from the Crossref API. &quot;Current&quot; = last 2 calendar years per Crossref&apos;s definition.
        </p>
      </div>
    </div>
  );
}
