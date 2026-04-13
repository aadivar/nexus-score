'use client';

import type { PublisherGap } from '../lib/publisher-map';
import { useState } from 'react';

function coverageColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-800';
  if (pct >= 50) return 'bg-yellow-100 text-yellow-800';
  if (pct >= 20) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function gapColor(pct: number): string {
  if (pct >= 80) return 'text-red-700 font-semibold';
  if (pct >= 50) return 'text-amber-700';
  return 'text-gray-600';
}

type SortField = 'articles' | 'affiliations' | 'rorIds' | 'instRor' | 'funders' | 'abstracts' | 'orcids';

export function PublisherGapTable({ publishers }: { publishers: PublisherGap[] }) {
  const [sortField, setSortField] = useState<SortField>('articles');
  const [sortDesc, setSortDesc] = useState(true);

  const valueFor = (p: PublisherGap, f: SortField): number => {
    if (f === 'articles') return p.articles;
    if (f === 'instRor') return p.measured && p.articles > 0 ? (p.institutionalRor / p.articles) * 100 : -1;
    return p.measured ? p.coverage[f] : -1;
  };

  const sorted = [...publishers].sort((a, b) => {
    const av = valueFor(a, sortField);
    const bv = valueFor(b, sortField);
    return sortDesc ? bv - av : av - bv;
  });

  function handleSort(field: SortField) {
    if (sortField === field) setSortDesc(!sortDesc);
    else { setSortField(field); setSortDesc(true); }
  }

  const arrow = (field: SortField) =>
    sortField === field ? (sortDesc ? ' ↓' : ' ↑') : '';

  const th = (field: SortField, label: string, help?: string) => (
    <th
      className="px-3 py-3 text-right font-medium text-gray-700 cursor-pointer hover:text-gray-900"
      onClick={() => handleSort(field)}
      title={help}
    >
      {label}{arrow(field)}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-700">Publisher</th>
            {th('articles', 'Articles')}
            {th('affiliations', 'Affiliation', 'Any author affiliation present')}
            {th('rorIds', 'Any ROR', 'Any ROR ID in any affiliation')}
            {th('instRor', 'Inst. ROR', 'THIS institution\'s ROR on the paper')}
            {th('funders', 'Funder')}
            {th('abstracts', 'Abstract')}
            {th('orcids', 'ORCID')}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sorted.map((p) => {
            if (!p.measured) {
              return (
                <tr key={p.crossrefId} className="bg-gray-50/50">
                  <td className="px-3 py-2.5 font-medium text-gray-500">
                    <a href={`/member/${p.crossrefId}`} className="hover:text-blue-600 hover:underline">
                      {p.name}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-500">{p.articles.toLocaleString()}</td>
                  <td colSpan={6} className="px-3 py-2.5 text-right text-xs text-gray-400 italic">
                    sample too small to measure
                  </td>
                </tr>
              );
            }
            const instRorPct = (p.institutionalRor / p.articles) * 100;
            return (
              <tr key={p.crossrefId} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  <a href={`/member/${p.crossrefId}`} className="hover:text-blue-600 hover:underline">
                    {p.name}
                  </a>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">{p.articles.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${coverageColor(p.coverage.affiliations)}`}>
                    {p.coverage.affiliations.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${coverageColor(p.coverage.rorIds)}`}>
                    {p.coverage.rorIds.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${coverageColor(instRorPct)}`}>
                    {instRorPct.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${coverageColor(p.coverage.funders)}`}>
                    {p.coverage.funders.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${coverageColor(p.coverage.abstracts)}`}>
                    {p.coverage.abstracts.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${coverageColor(p.coverage.orcids)}`}>
                    {p.coverage.orcids.toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function GapSummaryTable({ publishers }: { publishers: PublisherGap[] }) {
  const measured = publishers.filter((p) => p.measured);
  const sorted = [...measured].sort((a, b) => b.gap.noInstitutionalRor - a.gap.noInstitutionalRor);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-700">Publisher</th>
            <th className="px-3 py-3 text-right font-medium text-gray-700">Articles</th>
            <th className="px-3 py-3 text-right font-medium text-gray-700" title="Articles where this institution's ROR wasn't deposited">No Inst. ROR</th>
            <th className="px-3 py-3 text-right font-medium text-gray-700">No Affiliation</th>
            <th className="px-3 py-3 text-right font-medium text-gray-700">No Funder</th>
            <th className="px-3 py-3 text-right font-medium text-gray-700">No Abstract</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sorted.map((p) => {
            const instRorPct = (p.gap.noInstitutionalRor / p.articles) * 100;
            const afPct = (p.gap.noAffiliation / p.articles) * 100;
            const fuPct = (p.gap.noFunder / p.articles) * 100;
            const abPct = (p.gap.noAbstract / p.articles) * 100;
            return (
              <tr key={p.crossrefId} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-900">{p.name}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{p.articles.toLocaleString()}</td>
                <td className={`px-3 py-2.5 text-right ${gapColor(instRorPct)}`}>
                  {p.gap.noInstitutionalRor.toLocaleString()} ({instRorPct.toFixed(0)}%)
                </td>
                <td className={`px-3 py-2.5 text-right ${gapColor(afPct)}`}>
                  {p.gap.noAffiliation.toLocaleString()} ({afPct.toFixed(0)}%)
                </td>
                <td className={`px-3 py-2.5 text-right ${gapColor(fuPct)}`}>
                  {p.gap.noFunder.toLocaleString()} ({fuPct.toFixed(0)}%)
                </td>
                <td className={`px-3 py-2.5 text-right ${gapColor(abPct)}`}>
                  {p.gap.noAbstract.toLocaleString()} ({abPct.toFixed(0)}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
