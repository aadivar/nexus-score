'use client';

import { useState } from 'react';
import type { InstitutionReport } from '../lib/publisher-map';

interface StakeholderFriction {
  key: 'library' | 'researchOffice' | 'cris' | 'researchers';
  stakeholder: string;
  role: string;
  metadataGap: string;
  articlesAffected: number;
  minutesPerArticle: number | null;
  consequence: string;
}

function buildFrictions(report: InstitutionReport): StakeholderFriction[] {
  const { totals } = report;
  return [
    {
      key: 'library',
      stakeholder: 'Library',
      role: 'Identifying the institution\'s output',
      metadataGap: 'Institution\'s ROR not deposited on the paper',
      articlesAffected: totals.noInstitutionalRor,
      minutesPerArticle: 5,
      consequence: 'Library staff can\'t auto-discover these articles as institutional output from Crossref. Identification requires manual publisher-site searching or expensive third-party matching.',
    },
    {
      key: 'researchOffice',
      stakeholder: 'Research Office',
      role: 'Funder mandate compliance',
      metadataGap: 'No funder metadata in Crossref deposit',
      articlesAffected: totals.noFunder,
      minutesPerArticle: 15,
      consequence: 'When UKRI, Wellcome, NIH ask "did your researchers comply with OA and funder mandates?" — the answer requires cross-referencing grant databases manually, because the funder field wasn\'t deposited.',
    },
    {
      key: 'cris',
      stakeholder: 'CRIS / Repository',
      role: 'Automated institutional ingest',
      metadataGap: 'No ROR linking affiliations to institutions',
      articlesAffected: totals.noInstitutionalRor,
      minutesPerArticle: null,
      consequence: 'CRIS systems depend on ROR to auto-ingest the institution\'s publications. Without it, the workflow falls back to self-deposit by researchers or paid matching services — both incomplete.',
    },
    {
      key: 'researchers',
      stakeholder: 'Researchers',
      role: 'Discoverability by AI tools',
      metadataGap: 'No abstract deposited to Crossref',
      articlesAffected: totals.noAbstract,
      minutesPerArticle: null,
      consequence: 'Semantic Scholar, OpenAlex, Elicit, Consensus — the tools researchers increasingly use for discovery — depend on Crossref abstracts. Missing abstracts mean the paper is harder to find, harder to cite.',
    },
  ];
}

const STAKEHOLDER_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Library: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  'Research Office': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
  'CRIS / Repository': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  Researchers: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
};

interface Rates {
  currency: string;
  library: number | null;
  researchOffice: number | null;
}

function formatCost(amount: number, currency: string): string {
  if (amount >= 1_000_000) return `${currency}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${currency}${(amount / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(amount).toLocaleString()}`;
}

function RateCalculator({
  rates,
  setRates,
  libraryHours,
  researchOfficeHours,
  annualArticleCount,
  windowArticles,
  institutionName,
}: {
  rates: Rates;
  setRates: (r: Rates) => void;
  libraryHours: number; // already annualised
  researchOfficeHours: number; // already annualised
  annualArticleCount: number;
  windowArticles: number;
  institutionName: string;
}) {
  const [open, setOpen] = useState(false);

  const libCost = rates.library && rates.library > 0 ? libraryHours * rates.library : 0;
  const roCost = rates.researchOffice && rates.researchOffice > 0 ? researchOfficeHours * rates.researchOffice : 0;
  const totalCost = libCost + roCost;
  const hasRates = (rates.library && rates.library > 0) || (rates.researchOffice && rates.researchOffice > 0);

  const usingRealAnnual = annualArticleCount > 0 && windowArticles > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-gray-800"
        >
          {hasRates ? `Total: ${formatCost(totalCost, rates.currency)}` : 'Add cost estimates'}
        </button>
      )}
      {open && (
        <div className="w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900 text-sm">Cost estimates</p>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Plug in your institution&apos;s hourly rates to see the <strong>annual</strong> cost of manual work. Rates stay in your browser — nothing is sent anywhere.
          </p>

          {usingRealAnnual && (
            <div className="mb-3 rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-900">
              {institutionName} published{' '}
              <strong>{annualArticleCount.toLocaleString()}</strong> journal articles in the last year
              (vs {windowArticles.toLocaleString()} in the 90-day sample). Hours are scaled up from the
              observed 90-day gap rate to annual.
            </div>
          )}

          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={rates.currency}
            onChange={(e) => setRates({ ...rates, currency: e.target.value })}
            className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white"
          >
            <option value="$">USD ($)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
            <option value="₹">INR (₹)</option>
            <option value="A$">AUD (A$)</option>
            <option value="C$">CAD (C$)</option>
            <option value="CHF ">CHF</option>
            <option value="¥">JPY (¥)</option>
            <option value="CN¥">CNY (CN¥)</option>
            <option value="S$">SGD (S$)</option>
            <option value="HK$">HKD (HK$)</option>
            <option value="NZ$">NZD (NZ$)</option>
            <option value="R$">BRL (R$)</option>
            <option value="R">ZAR (R)</option>
            <option value="kr ">SEK (kr)</option>
          </select>

          <label className="block text-xs font-medium text-gray-700 mb-1">Library staff / hr</label>
          <input
            type="number"
            min="0"
            value={rates.library ?? ''}
            onChange={(e) => setRates({ ...rates, library: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 35"
            className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />

          <label className="block text-xs font-medium text-gray-700 mb-1">Research officer / hr</label>
          <input
            type="number"
            min="0"
            value={rates.researchOffice ?? ''}
            onChange={(e) => setRates({ ...rates, researchOffice: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 45"
            className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />

          {hasRates && (
            <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">Annual cost estimate</p>
              <div className="space-y-1 text-xs text-gray-700">
                {rates.library && rates.library > 0 && (
                  <div className="flex justify-between">
                    <span>Library ({libraryHours.toLocaleString()} hrs/yr × {rates.currency}{rates.library})</span>
                    <span className="font-medium">{formatCost(libCost, rates.currency)}</span>
                  </div>
                )}
                {rates.researchOffice && rates.researchOffice > 0 && (
                  <div className="flex justify-between">
                    <span>Research Office ({researchOfficeHours.toLocaleString()} hrs/yr × {rates.currency}{rates.researchOffice})</span>
                    <span className="font-medium">{formatCost(roCost, rates.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 mt-1 text-sm font-semibold text-gray-900">
                  <span>Total / year</span>
                  <span>{formatCost(totalCost, rates.currency)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setRates({ currency: '$', library: null, researchOffice: null })}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Clear rates
          </button>
        </div>
      )}
    </div>
  );
}

export function StakeholderImpact({ report }: { report: InstitutionReport }) {
  const [rates, setRates] = useState<Rates>({ currency: '$', library: null, researchOffice: null });
  const frictions = buildFrictions(report);

  function rateForKey(key: StakeholderFriction['key']): number | null {
    if (key === 'library') return rates.library;
    if (key === 'researchOffice') return rates.researchOffice;
    return null;
  }

  const libraryFriction = frictions.find((f) => f.key === 'library');
  const researchOfficeFriction = frictions.find((f) => f.key === 'researchOffice');
  const libraryHours = libraryFriction?.minutesPerArticle
    ? Math.round((libraryFriction.articlesAffected * libraryFriction.minutesPerArticle) / 60)
    : 0;
  const researchOfficeHours = researchOfficeFriction?.minutesPerArticle
    ? Math.round((researchOfficeFriction.articlesAffected * researchOfficeFriction.minutesPerArticle) / 60)
    : 0;

  // Extrapolate observed 90-day metrics to an annual scale using the
  // institution's actual 1-year OpenAlex count. Ratio is computed from real
  // data, not a flat 4x, so it reflects the institution's true output.
  const annualMultiplier =
    report.annualArticleCount > 0 && report.totalArticles > 0
      ? report.annualArticleCount / report.totalArticles
      : 365 / (report.windowDays || 90);

  const libraryHoursAnnual = Math.round(libraryHours * annualMultiplier);
  const researchOfficeHoursAnnual = Math.round(researchOfficeHours * annualMultiplier);

  const libCost = rates.library && rates.library > 0 ? libraryHoursAnnual * rates.library : 0;
  const roCost = rates.researchOffice && rates.researchOffice > 0 ? researchOfficeHoursAnnual * rates.researchOffice : 0;
  const totalCost = libCost + roCost;
  const hasRates = libCost > 0 || roCost > 0;

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Where incomplete deposits create friction
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Each stakeholder hits the same missing publisher-deposited metadata in a different workflow. Article counts are <strong>observed</strong> for {report.institution.name} across measured publishers — not projections.
              </p>
            </div>
            {hasRates && (
              <div className="shrink-0 rounded-lg border border-gray-900 bg-gray-900 px-4 py-3 text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-300">Annual cost estimate</p>
                <p className="text-2xl font-bold text-white">{formatCost(totalCost, rates.currency)}</p>
                <p className="text-xs text-gray-400 mt-0.5">extrapolated from 90-day sample at your rates</p>
              </div>
            )}
          </div>
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <span aria-hidden="true" className="mr-1">⚠️</span>
            <strong>Time estimates</strong> (5 min, 15 min) are illustrative — rough midpoints from documented library and research-office workflows. They convey <em>scale</em> of manual work, not precise cost. The article counts themselves are exact. Use the &quot;Add cost estimates&quot; panel (bottom right) to plug in your own hourly rates.
          </div>
        </div>

        {frictions.map((f) => {
          const style = STAKEHOLDER_STYLES[f.stakeholder] ?? STAKEHOLDER_STYLES.Library;
          const hours = f.minutesPerArticle !== null
            ? Math.round((f.articlesAffected * f.minutesPerArticle) / 60)
            : null;
          const rate = rateForKey(f.key);
          const cost = hours !== null && rate !== null && rate > 0 ? hours * rate : null;

          return (
            <div key={f.stakeholder} className={`rounded-lg border ${style.border} ${style.bg} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className={`font-semibold ${style.text}`}>{f.stakeholder}</h4>
                  <p className="text-sm text-gray-600">{f.role}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${style.text}`}>
                    {f.articlesAffected.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">articles affected</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-white/70 px-2 py-1 font-medium text-gray-700">
                  Gap: {f.metadataGap}
                </span>
                {hours !== null && f.minutesPerArticle !== null && (
                  <span className="text-gray-500">
                    ≈ {f.minutesPerArticle} min × {f.articlesAffected.toLocaleString()} ={' '}
                    <strong>{hours.toLocaleString()} hrs</strong>
                    {cost !== null && (
                      <>
                        {' '}× {rates.currency}{rate}/hr ={' '}
                        <strong className={style.text}>{formatCost(cost, rates.currency)}</strong>
                      </>
                    )}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{f.consequence}</p>
            </div>
          );
        })}
      </div>

      <RateCalculator
        rates={rates}
        setRates={setRates}
        libraryHours={libraryHoursAnnual}
        researchOfficeHours={researchOfficeHoursAnnual}
        annualArticleCount={report.annualArticleCount}
        windowArticles={report.totalArticles}
        institutionName={report.institution.name}
      />
    </>
  );
}
