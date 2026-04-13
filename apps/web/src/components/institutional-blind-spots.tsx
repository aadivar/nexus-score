'use client';

import type { InstitutionReport } from '../lib/publisher-map';

interface BlindSpot {
  question: string;
  answer: string;
  dataNeeded: string;
  currentState: string;
  articlesBlind: number;
  percentBlind: number;
  decision: string;
}

function buildBlindSpots(report: InstitutionReport): BlindSpot[] {
  const { totals, measuredArticles, institution, publishers } = report;
  const denom = measuredArticles || 1;
  const pctNoAffil = (totals.noAffiliation / denom) * 100;
  const pctNoFunder = (totals.noFunder / denom) * 100;
  const pctNoInstRor = (totals.noInstitutionalRor / denom) * 100;
  const pctNoAbstract = (totals.noAbstract / denom) * 100;

  const measured = publishers.filter((p) => p.measured);
  const worstAffil = [...measured].sort((a, b) => a.coverage.affiliations - b.coverage.affiliations)[0];
  const bestAffil = [...measured].sort((a, b) => b.coverage.affiliations - a.coverage.affiliations)[0];
  const biggestPublisher = measured[0]; // already sorted by article count

  return [
    {
      question: `How many articles did ${institution.name} publish last year?`,
      answer: `You don't know — not from the deposits.`,
      dataNeeded: 'Affiliation metadata linking articles to your institution',
      currentState: `${pctNoAffil.toFixed(0)}% of your tracked articles have no institutional affiliation deposited by publishers to Crossref. You can find ${(100 - pctNoAffil).toFixed(0)}% of your output. The rest requires manual searching.`,
      articlesBlind: totals.noAffiliation,
      percentBlind: pctNoAffil,
      decision: 'Require affiliation deposits in every publishing agreement. No affiliation, no payment.',
    },
    {
      question: `Which publishers deliver the most value?`,
      answer: `You can't compare — the data isn't comparable.`,
      dataNeeded: 'Consistent metadata across all publishers',
      currentState: `${bestAffil?.name} deposits ${bestAffil?.coverage.affiliations.toFixed(0)}% affiliations. ${worstAffil?.name} deposits ${worstAffil?.coverage.affiliations.toFixed(0)}%. You're comparing complete data against empty data. Any cross-publisher analysis is misleading.`,
      articlesBlind: totals.noAffiliation,
      percentBlind: pctNoAffil,
      decision: 'Before renewing any agreement, check what the publisher actually deposits. Use this as a baseline for the next contract.',
    },
    {
      question: `Are your funders' mandates being met?`,
      answer: `You can verify ${(100 - pctNoFunder).toFixed(0)}% at best.`,
      dataNeeded: 'Funder metadata with grant numbers on every funded article',
      currentState: `${totals.noFunder.toLocaleString()} articles have no funder metadata deposited by publishers to Crossref. When UKRI or Wellcome asks "did your researchers comply?", you can't answer from metadata alone. You need manual cross-referencing against grant databases.`,
      articlesBlind: totals.noFunder,
      percentBlind: pctNoFunder,
      decision: 'Work with your grants office to require funder DOI deposits as a condition of grant reporting.',
    },
    {
      question: `Can your CRIS system automatically ingest your publications?`,
      answer: `For ${pctNoInstRor.toFixed(0)}% of articles — no.`,
      dataNeeded: `This institution's ROR (${institution.ror}) deposited in the affiliation metadata`,
      currentState: `${totals.noInstitutionalRor.toLocaleString()} articles had no ROR for ${institution.name} on any author. CRIS auto-ingest relies on this exact identifier. Fallback: manual self-deposit or paid matching services — both lossy.`,
      articlesBlind: totals.noInstitutionalRor,
      percentBlind: pctNoInstRor,
      decision: 'Require publishers to include your ROR on every affiliation. The Crossref schema supports it; adoption is the bottleneck.',
    },
    {
      question: `Is your research discoverable by AI?`,
      answer: `${totals.noAbstract.toLocaleString()} articles are harder to find.`,
      dataNeeded: 'Abstracts deposited to Crossref for indexing by discovery tools',
      currentState: `Semantic Scholar, OpenAlex, Elicit, Consensus — the next generation of research tools — depend on abstracts that publishers deposit to Crossref. ${pctNoAbstract.toFixed(0)}% of your articles have none. ${biggestPublisher?.name} (your largest publisher with ${biggestPublisher?.articles.toLocaleString()} articles) deposits abstracts for ${biggestPublisher?.coverage.abstracts.toFixed(0)}% of them.`,
      articlesBlind: totals.noAbstract,
      percentBlind: pctNoAbstract,
      decision: 'Prioritize publishers who deposit abstracts. Abstract coverage directly affects your researchers\' visibility.',
    },
    {
      question: `What is your actual open access output?`,
      answer: `License metadata tells part of the story — but not all of it.`,
      dataNeeded: 'Complete license metadata on every article',
      currentState: `Without consistent license metadata, you can't programmatically count how many articles are truly open access. You can't report OA percentages to your board, to government, or to rankings agencies with confidence.`,
      articlesBlind: 0,
      percentBlind: 0,
      decision: 'Every OA article must have CC license metadata in Crossref. If you\'re paying for open access, the metadata must prove it.',
    },
  ];
}

export function InstitutionalBlindSpots({ report }: { report: InstitutionReport }) {
  const spots = buildBlindSpots(report);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          What {report.institution.name} can&apos;t see
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Six questions every institution should be able to answer from metadata alone. Today, most can&apos;t — because publishers don&apos;t deposit complete metadata, even though the Crossref schema supports every field below.
        </p>
      </div>

      {spots.map((spot, i) => (
        <div key={i} className="rounded-lg border bg-white shadow-sm overflow-hidden">
          {/* Question header */}
          <div className="border-b bg-gray-900 px-5 py-4">
            <p className="text-white font-medium">{spot.question}</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Answer */}
            <div>
              <p className="text-lg font-semibold text-red-700">{spot.answer}</p>
            </div>

            {/* Current state */}
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{spot.currentState}</p>
            </div>

            {/* Visual bar */}
            {spot.articlesBlind > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Visible ({(100 - spot.percentBlind).toFixed(0)}%)</span>
                  <span>Blind ({spot.percentBlind.toFixed(0)}%)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${100 - spot.percentBlind}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {spot.articlesBlind.toLocaleString()} articles with this gap in publisher deposits
                </p>
              </div>
            )}

            {/* The decision */}
            <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">The decision</p>
              <p className="text-sm text-blue-900">{spot.decision}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
