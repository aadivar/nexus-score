'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { InstitutionReport } from '../../../lib/publisher-map';
import { PublisherGapTable, GapSummaryTable } from '../../../components/publisher-gap-table';
import { StakeholderImpact } from '../../../components/stakeholder-impact';
import { InstitutionalBlindSpots } from '../../../components/institutional-blind-spots';

interface SearchResult {
  name: string;
  ror: string;
  country: string;
}

function InstitutionAnalysisPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRor = searchParams.get('ror');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [report, setReport] = useState<InstitutionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const analyzedRorRef = useRef<string | null>(null);

  // Run analysis when ?ror=... is in the URL. This gives each analyzed
  // institution a unique, shareable URL and makes pageviews show up
  // per-institution in Vercel Analytics.
  useEffect(() => {
    if (!urlRor || urlRor === analyzedRorRef.current) return;
    analyzedRorRef.current = urlRor;
    (async () => {
      setLoading(true);
      setError('');
      setSearchResults([]);
      try {
        const res = await fetch(`/api/analyze-institution?ror=${urlRor}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Analysis failed (HTTP ${res.status})`);
        }
        const data: InstitutionReport = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed.');
      }
      setLoading(false);
    })();
  }, [urlRor]);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setReport(null);
    setError('');
    try {
      const res = await fetch(`/api/analyze-institution?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setError('Search failed');
    }
    setSearching(false);
  }

  function handleAnalyze(ror: string) {
    // Push to URL — the useEffect above will kick off the analysis. This
    // makes each institution a distinct page view and supports sharing.
    const params = new URLSearchParams({ ror });
    router.push(`/analysis/institution?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Institutional Research Visibility
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
              Scope: Journal articles only
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
              Window: Last 90 days
            </span>
          </div>
          <p className="mt-3 text-gray-600">
            How publishers deposit metadata for your institution&apos;s journal articles — observed directly from Crossref work records. Scope and window are chosen to respect the free rate limits offered by{' '}
            <a
              href="https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Crossref
            </a>{' '}
            and{' '}
            <a
              href="https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenAlex
            </a>
            .
          </p>
        </div>

        <details className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-900">
          <summary className="cursor-pointer px-4 py-3 font-medium">How this analysis works</summary>
          <div className="space-y-4 border-t border-blue-200 px-4 py-4">
            <p>
              This page measures <strong>what publishers deposit to Crossref</strong> for your institution&apos;s journal articles. Crossref stores what it receives from publishers — the deposit practices are the variable. The analysis uses three data sources together:
            </p>

            <div className="rounded-md border border-blue-200 bg-white p-3">
              <p className="font-semibold text-blue-900">1. OpenAlex — for article discovery</p>
              <p className="mt-1 text-blue-800">
                The tool queries OpenAlex for journal articles where any author is affiliated with this institution&apos;s ROR in the last 90 days. OpenAlex aggregates affiliation signals from multiple sources (Crossref, PubMed, MAG, author pages), so it reliably identifies &quot;these are the papers that came out of your institution&quot; even when one source is incomplete.
              </p>
            </div>

            <div className="rounded-md border border-blue-200 bg-white p-3">
              <p className="font-semibold text-blue-900">2. Crossref — for observed publisher deposits</p>
              <p className="mt-1 text-blue-800">
                For every DOI OpenAlex returns at each mapped publisher, the tool fetches the actual Crossref work record and inspects it directly. Each record is counted by what it contains — affiliations, ROR IDs, funders, abstracts, licenses, ORCIDs — exactly as the publisher deposited them.
              </p>
            </div>

            <div className="rounded-md border border-blue-200 bg-white p-3">
              <p className="font-semibold text-blue-900">3. ROR — the interlingua</p>
              <p className="mt-1 text-blue-800">
                ROR IDs are the machine-readable bridge. OpenAlex asserts &quot;this paper is from institution X&quot;; the publisher&apos;s Crossref deposit may or may not include X&apos;s ROR on any author. The <strong>Inst. ROR</strong> column tests whether the publisher included <em>this institution&apos;s specific ROR</em> in the deposit — the gold-standard signal for automated institutional linking.
              </p>
            </div>

            <div className="rounded-md bg-white p-3">
              <p className="font-semibold text-gray-900">How the numbers are built</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-gray-700">
                <li>Gap counts are <strong>observed from each Crossref work record</strong>, not projected from publisher-wide averages.</li>
                <li>If OpenAlex identifies a paper as institutional output but the Crossref deposit has no institutional ROR, that&apos;s counted as a gap — the affiliation exists, the publisher just didn&apos;t deposit it.</li>
                <li>Only journal articles are inspected — no proceedings, book chapters, or peer reviews — to avoid the content-type dilution that inflates aggregate-style scores.</li>
                <li>Publishers with fewer than 10 articles from this institution are shown but not measured (sample too small).</li>
                <li>Articles that can&apos;t be traced to a mapped Crossref deposit are reported separately in &quot;Why N articles weren&apos;t analyzed&quot; with a per-reason breakdown.</li>
                <li>A single extra OpenAlex count call fetches the institution&apos;s full-year journal-article output; the cost calculator uses that number to extrapolate the observed 90-day gap to an annual rate at your chosen hourly rates.</li>
              </ul>
            </div>
          </div>
        </details>

        <details className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <summary className="cursor-pointer px-4 py-3 font-semibold flex items-center gap-2">
            <span aria-hidden="true">⚠️</span>
            What to keep in mind while reading the report
          </summary>
          <ul className="space-y-2 border-t border-amber-200 px-4 py-4 text-amber-900">
            <li>
              <strong>Not every article can be analyzed — and every reason is a deposit gap.</strong> Some articles were never registered with Crossref (published only in an institutional repo, preprint server, or data platform); some come from publishers not yet mapped to a Crossref member ID; some have a deposit so incomplete that the publisher itself can&apos;t be identified downstream. The &quot;Why N articles weren&apos;t analyzed&quot; section below breaks these down.
            </li>
            <li>
              <strong>Author attribution is permissive.</strong> A paper is treated as &quot;from this institution&quot; if any author is affiliated with it. A co-authored paper with 20 authors across 5 institutions counts once for each — the deposit may or may not actually include this institution&apos;s ROR even when the institutional link is real.
            </li>
            <li>
              <strong>String affiliation without ROR is not &quot;missing&quot;.</strong> A publisher that deposits &quot;University of Oxford, Department of X&quot; as text but no ROR ID will show as <em>has affiliation</em> but <em>no ROR</em>. The attribution exists in human-readable form; machine processing is what&apos;s blocked.
            </li>
            <li>
              <strong>ROR has no funder-vs-institution type flag.</strong> A single organization (Wellcome, Max Planck, NIH, etc.) holds one ROR ID that can play either role — the meaning depends on <em>where</em> the ROR appears in the deposit: in <code className="rounded bg-white/70 px-1">author.affiliation.id</code> it&apos;s an institutional signal; in <code className="rounded bg-white/70 px-1">funder.id</code> it&apos;s a funder signal. This tool currently inspects ROR only in the affiliation field. As publishers transition from the legacy Open Funder Registry to funder ROR IDs, a separate funder-ROR metric may be added.
            </li>
            <li>
              <strong>Point-in-time snapshot.</strong> Publishers can and do revise deposits. Numbers here reflect the state of Crossref at the moment of analysis — don&apos;t treat them as immutable.
            </li>
            <li>
              <strong>Small samples are omitted.</strong> Publishers with fewer than 10 articles from this institution are shown but not measured — too few records to draw meaningful percentages from. Counts below that threshold are for reference only.
            </li>
            <li>
              <strong>Annual cost estimates are extrapolated.</strong> The hours shown per stakeholder come from the observed 90-day gap, scaled up to a year using the institution&apos;s real full-year article count. Hourly rates you enter in the cost calculator stay local to your browser.
            </li>
          </ul>
        </details>

        <details className="mb-6 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800">
          <summary className="cursor-pointer px-4 py-3 font-medium">What each gap column means</summary>
          <div className="space-y-4 border-t border-slate-200 px-4 py-4">
            <ul className="space-y-2 text-slate-700">
              <li>
                <strong>No Affiliation</strong> — the Crossref deposit carries no author affiliation at all. Not just &quot;missing ROR&quot; — the affiliation text field itself is empty. Institutional linking from the deposit is impossible without manual publisher-site scraping.
              </li>
              <li>
                <strong>No Any ROR</strong> — the deposit has affiliation text but no ROR identifier on any author. Matching still requires string parsing of &quot;Department of X, University of Y&quot; — brittle and fails for renamed departments, translated names, and multi-institution affiliations.
              </li>
              <li>
                <strong>No Inst. ROR</strong> — the deposit does not include <em>this specific institution&apos;s</em> ROR on any author. This is the strictest test. A paper may have ROR IDs for other co-author institutions but not this one&apos;s. CRIS auto-ingest requires this exact match.
              </li>
              <li>
                <strong>No Funder</strong> — the deposit has no funder metadata. The paper may have been funded; the funder-grant information simply wasn&apos;t transmitted. Mandate-compliance reporting (UKRI, NIH, Wellcome) falls back to manual grant-database cross-referencing.
              </li>
              <li>
                <strong>No Abstract</strong> — the deposit has no abstract. Discovery tools (Semantic Scholar, OpenAlex, Elicit, Consensus) index from Crossref abstracts. Missing = less discoverable, fewer citations, weaker research impact signal.
              </li>
              <li>
                <strong>No ORCID / License</strong> — similar story for author identity persistence (ORCID) and open-access verification (license). Both are schema-supported; both are deposit-practice dependent.
              </li>
            </ul>
          </div>
        </details>

        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by institution name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. University of Oxford, MIT, IISc..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 divide-y rounded-lg border">
              {searchResults.map((r) => (
                <button
                  key={r.ror}
                  onClick={() => handleAnalyze(r.ror)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className="ml-2 text-sm text-gray-500">{r.country}</span>
                  </div>
                  <span className="text-xs text-gray-400">ROR: {r.ror}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-gray-600">Fetching DOIs from OpenAlex and inspecting Crossref records...</p>
            <p className="mt-1 text-sm text-gray-400">
              This usually takes 20–60 seconds. Larger institutions take longer — every article is paginated through.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-8">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">{report.institution.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {report.dateRange}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                <strong>{report.totalArticles.toLocaleString()}</strong> journal articles total &middot;{' '}
                <strong>{report.trackedArticles.toLocaleString()}</strong> at publishers mapped to Crossref &middot;{' '}
                <strong>{report.measuredArticles.toLocaleString()}</strong> measured
                {report.unmappedPublishers.length > 0 && (
                  <> &middot; {report.unmappedPublishers.reduce((s, u) => s + u.articles, 0).toLocaleString()} at unmapped publishers</>
                )}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  value={`${(100 - report.totals.institutionalRorPercent).toFixed(0)}%`}
                  label="Missing this institution's ROR"
                  sublabel={`${report.totals.noInstitutionalRor.toLocaleString()} articles`}
                  color="red"
                />
                <StatCard
                  value={`${(100 - report.totals.affiliationPercent).toFixed(0)}%`}
                  label="No affiliation at all"
                  sublabel={`${report.totals.noAffiliation.toLocaleString()} articles`}
                  color="red"
                />
                <StatCard
                  value={`${(100 - report.totals.funderPercent).toFixed(0)}%`}
                  label="No funder metadata"
                  sublabel={`${report.totals.noFunder.toLocaleString()} articles`}
                  color="amber"
                />
                <StatCard
                  value={`${(100 - report.totals.abstractPercent).toFixed(0)}%`}
                  label="No abstract"
                  sublabel={`${report.totals.noAbstract.toLocaleString()} articles`}
                  color="amber"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  What each publisher deposited
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Percentages are observed from each publisher&apos;s actual Crossref deposits for this institution&apos;s articles. Click column headers to sort. <strong>Inst. ROR</strong> = this institution&apos;s specific ROR deposited on the paper.
                </p>
              </div>
              <PublisherGapTable publishers={report.publishers} />
            </div>

            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">What you can&apos;t see</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Articles missing key metadata, sorted by largest institutional-ROR gap. Only measured publishers shown.
                </p>
              </div>
              <GapSummaryTable publishers={report.publishers} />
              <div className="border-t bg-gray-50 px-6 py-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{(100 - report.totals.institutionalRorPercent).toFixed(1)}%</span> of measured articles were deposited by publishers without a ROR linking them to {report.institution.name}. The affiliation signal exists — OpenAlex confirms it — but it didn&apos;t make it into the deposit.
                </p>
              </div>
            </div>

            {report.unmappedPublishers.length > 0 && (() => {
              const totalUnmapped = report.unmappedPublishers.reduce((s, u) => s + u.articles, 0);
              const noMetadata = report.unmappedPublishers.filter((u) => u.category === 'no-metadata').reduce((s, u) => s + u.articles, 0);
              const institutional = report.unmappedPublishers.filter((u) => u.category === 'institutional').reduce((s, u) => s + u.articles, 0);
              const unmappedPub = report.unmappedPublishers.filter((u) => u.category === 'unmapped-publisher').reduce((s, u) => s + u.articles, 0);
              const rows = [
                {
                  count: institutional,
                  title: 'No Crossref DOI registered at all',
                  desc: 'The article exists only in an institutional repository, preprint server, or data platform — the publisher never registered a DOI through Crossref. Without a deposit, there\'s nothing to inspect. Smaller publishers, regional outlets, and non-traditional venues often skip Crossref registration entirely.',
                },
                {
                  count: unmappedPub,
                  title: 'Publisher deposits exist but aren\'t mapped yet',
                  desc: 'The publisher does deposit to Crossref, but the mapping table doesn\'t yet link their OpenAlex identity to their Crossref member ID. Fixable — new publishers get added as they surface. Check back in a future run.',
                },
                {
                  count: noMetadata,
                  title: 'Deposit too incomplete to identify the publisher',
                  desc: 'OpenAlex attributes the article to this institution but can\'t determine who published it. This typically means the Crossref deposit was missing or skeletal enough that the publisher field couldn\'t be reconstructed — another form of deposit gap, one step removed.',
                },
              ].filter((r) => r.count > 0);
              return (
                <div className="rounded-lg border bg-white shadow-sm">
                  <div className="border-b px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Why {totalUnmapped.toLocaleString()} articles weren&apos;t analyzed — all publisher deposit gaps
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Of the {report.totalArticles.toLocaleString()} articles OpenAlex attributed to {report.institution.name}, {totalUnmapped.toLocaleString()} couldn&apos;t be measured against Crossref deposits. Every reason below traces back to the same root — <strong>the publisher didn&apos;t deposit complete metadata to Crossref</strong> (or didn&apos;t deposit at all).
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <div key={r.title} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">{r.title}</p>
                            <p className="mt-1 text-sm text-gray-600">{r.desc}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-2xl font-bold text-gray-900">{r.count.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">articles</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t bg-gray-50 px-6 py-3 text-xs text-gray-600">
                    Every bucket above is a form of deposit gap. Not registering a DOI, depositing incomplete metadata, or skipping Crossref entirely — each leaves institutions with less signal to track their own research.
                  </div>
                </div>
              );
            })()}

            <InstitutionalBlindSpots report={report} />

            <StakeholderImpact report={report} />

          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  sublabel,
  color,
}: {
  value: string;
  label: string;
  sublabel: string;
  color: 'red' | 'amber';
}) {
  const bg = color === 'red' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const text = color === 'red' ? 'text-red-700' : 'text-amber-700';
  const sub = color === 'red' ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className={`text-sm font-medium ${sub}`}>{label}</p>
      <p className="mt-1 text-xs text-gray-500">{sublabel}</p>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in Next.js App Router.
export default function InstitutionAnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <InstitutionAnalysisPageInner />
    </Suspense>
  );
}
