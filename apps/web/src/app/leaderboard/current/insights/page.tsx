import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Current Era Insights - Research Nexus Score',
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
            Current Era Insights
          </h1>
          <p className="mt-2 text-gray-600">
            What changes when you judge publishers on recent content only
          </p>
        </div>

        {/* Content */}
        <article className="prose prose-gray max-w-none">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 not-prose mb-8">
            <p className="text-sm text-emerald-800">
              The <Link href="/leaderboard" className="font-medium underline">overall leaderboard</Link> averages
              current and backfile metadata. Publishers with large historical catalogs get dragged down by old
              content they can&apos;t retroactively fix. The{' '}
              <Link href="/leaderboard/current" className="font-medium underline">current era leaderboard</Link> ranks
              purely on current-era content (last 2 years per Crossref), showing who&apos;s doing the best work <em>right now</em>.
            </p>
          </div>

          <h2>The Industry Is Better Than It Looks</h2>
          <p>
            When you strip away historical backfiles, the picture improves meaningfully:
          </p>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Metric</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Overall</th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">Current Era</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="px-4 py-3">Average score</td>
                  <td className="px-4 py-3 text-center">19</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">23</td>
                  <td className="px-4 py-3 text-center text-emerald-600">+4</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Grade A publishers</td>
                  <td className="px-4 py-3 text-center">2</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">11</td>
                  <td className="px-4 py-3 text-center text-emerald-600">+9</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Grade B publishers</td>
                  <td className="px-4 py-3 text-center">41</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">251</td>
                  <td className="px-4 py-3 text-center text-emerald-600">+210</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Grade F publishers</td>
                  <td className="px-4 py-3 text-center">19,547</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">17,665</td>
                  <td className="px-4 py-3 text-center text-emerald-600">-1,882</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>2,844 publishers</strong> (12.4%) earn a higher grade on current content than overall.
            The industry <em>is</em> improving — it&apos;s just buried under decades of legacy metadata.
          </p>

          <h2>The Biggest Transformations</h2>
          <p>
            These large publishers look completely different when judged on recent work:
          </p>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Publisher</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Works</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Overall</th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">Current</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Jump</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['American Physical Society', '802K', '58 (C)', '81 (A)', 'C→A'],
                  ['American Society for Microbiology', '312K', '67 (B)', '86 (A)', 'B→A'],
                  ['American Chemical Society', '2.2M', '48 (D)', '70 (B)', 'D→B'],
                  ['American Meteorological Society', '129K', '41 (D)', '66 (B)', 'D→B'],
                  ['IEEE', '5.9M', '34 (F)', '41 (D)', 'F→D'],
                  ['SAGE Publications', '3.7M', '48 (D)', '61 (C)', 'D→C'],
                  ['BMJ', '1.0M', '33 (F)', '47 (D)', 'F→D'],
                  ['Wolters Kluwer', '2.9M', '26 (F)', '35 (D)', 'F→D'],
                ].map(([name, works, overall, current, jump]) => (
                  <tr key={name}>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{works}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{overall}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-700">{current}</td>
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
            (#3 in current era, score 86).
          </p>

          <h2>American Scholarly Societies Are Quietly Leading</h2>
          <p>
            A striking pattern: US-based scholarly societies dominate the current-era large publisher rankings.
            ASM, APS, AAS, PNAS, AGU, and ACS all score B or higher — while the commercial giants
            (Elsevier, Springer, Wiley) remain D&apos;s. These societies, not the publishing conglomerates,
            are setting the standard for metadata quality at scale.
          </p>

          <h2>Commercial Publishers: Improved, But Still D&apos;s</h2>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Publisher</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Works</th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">Current Score</th>
                  <th className="px-4 py-3 text-center font-medium text-emerald-700">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['MDPI', '2.0M', '68', 'B', 'bg-blue-100 text-blue-800'],
                  ['SAGE', '3.7M', '61', 'C', 'bg-yellow-100 text-yellow-800'],
                  ['IOP Publishing', '1.3M', '55', 'C', 'bg-yellow-100 text-yellow-800'],
                  ['Wiley', '11.9M', '48', 'D', 'bg-orange-100 text-orange-800'],
                  ['Springer Nature', '18.3M', '47', 'D', 'bg-orange-100 text-orange-800'],
                  ['Elsevier', '24.6M', '42', 'D', 'bg-orange-100 text-orange-800'],
                  ['IEEE', '5.9M', '41', 'D', 'bg-orange-100 text-orange-800'],
                  ['OUP', '7.5M', '29', 'F', 'bg-red-100 text-red-800'],
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

          <h2>Only 135 Publishers Got Worse</h2>
          <p>
            Just <strong>135 publishers</strong> (0.6%) score lower on current content than overall.
            The most notable: <strong>eLife</strong> dropped from D (39) to F (31) — surprising for
            an open-access pioneer. Most downgrades are small regional publishers.
          </p>

          <h2>South Korea Still Dominates</h2>
          <p>
            <strong>33 of the top 50</strong> current-era publishers are South Korean — nearly identical
            to the overall leaderboard. The pattern holds regardless of how you measure.
          </p>

          <h2>Organizations and Funding Are Still the Gap</h2>
          <p>
            Even on current content, the weakest dimensions remain essentially empty:
          </p>

          <div className="not-prose my-6 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Dimension</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Average (current era)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {[
                  ['Access', '47'],
                  ['People (ORCIDs)', '28'],
                  ['Provenance', '25'],
                  ['Organizations (ROR)', '7'],
                  ['Funding', '2'],
                ].map(([dim, avg]) => (
                  <tr key={dim}>
                    <td className="px-4 py-3">{dim}</td>
                    <td className="px-4 py-3 text-center font-semibold">{avg}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            The industry has made progress on provenance and ORCIDs, but institutional identifiers
            and funding metadata remain nearly empty across the board.
          </p>

          <h2>The Bottom Line</h2>
          <p>
            The current-era view reveals a more optimistic story. The industry <em>is</em> getting
            better — 2,844 publishers earn a higher grade on recent content. American scholarly societies
            are producing A and B-grade metadata at scale. But the commercial giants (Elsevier, Springer,
            Wiley) are stuck in D territory even on their newest content, and two entire dimensions
            (organizations, funding) remain essentially absent across the board.
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
