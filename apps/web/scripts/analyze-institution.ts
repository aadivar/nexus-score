#!/usr/bin/env npx tsx
/**
 * Institutional Research Visibility Report (CLI)
 *
 * Usage:
 *   pnpm --filter web analyze:institution -- --ror 052gg0110
 *   pnpm --filter web analyze:institution -- --search "University of Oxford"
 *   pnpm --filter web analyze:institution -- --ror 052gg0110 --days 90
 */

import { analyzeInstitution, searchInstitutions } from '../src/lib/analyze-institution.js';
import type { InstitutionReport } from '../src/lib/publisher-map.js';

function parseArgs(): { ror?: string; search?: string; days: number } {
  const args = process.argv.slice(2);
  let ror: string | undefined;
  let search: string | undefined;
  let days = 90;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ror' && args[i + 1]) { ror = args[++i]; }
    else if (args[i] === '--search' && args[i + 1]) { search = args[++i]; }
    else if (args[i] === '--days' && args[i + 1]) { days = parseInt(args[++i], 10); }
  }
  return { ror, search, days };
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function padNum(s: string, n: number): string {
  return s.length >= n ? s : ' '.repeat(n - s.length) + s;
}

function formatReport(report: InstitutionReport): string {
  const lines: string[] = [];
  const w = 88;
  const sep = '='.repeat(w);
  const thin = '-'.repeat(w);

  lines.push('');
  lines.push(sep);
  lines.push(`  ${report.institution.name} (${report.institution.country}) — Research Visibility`);
  lines.push(`  ${report.dateRange}`);
  lines.push(
    `  ${report.totalArticles.toLocaleString()} OpenAlex article-type works | ${report.analyzedArticles.toLocaleString()} in Crossref as journal-article | ${report.measuredArticles.toLocaleString()} measured`
  );
  lines.push(sep);
  lines.push('');

  lines.push('  WHAT PUBLISHERS DEPOSIT TO CROSSREF (observed from work records)');
  lines.push(thin);
  lines.push(
    `  ${pad('Publisher', 26)} ${padNum('Articles', 8)} ${padNum('Affil', 7)} ${padNum('AnyROR', 8)} ${padNum('OxROR', 8)} ${padNum('Funder', 7)} ${padNum('Abstr', 7)} ${padNum('ORCID', 7)}`
  );
  lines.push(thin);

  for (const p of report.publishers) {
    if (!p.measured) {
      lines.push(
        `  ${pad(p.name, 26)} ${padNum(p.articles.toLocaleString(), 8)}    sample < ${report.notes.minSampleSize}, not measured`
      );
      continue;
    }
    const instRorPct = (p.institutionalRor / p.articles) * 100;
    lines.push(
      `  ${pad(p.name, 26)} ${padNum(p.articles.toLocaleString(), 8)} ${padNum(p.coverage.affiliations.toFixed(0) + '%', 7)} ${padNum(p.coverage.rorIds.toFixed(0) + '%', 8)} ${padNum(instRorPct.toFixed(0) + '%', 8)} ${padNum(p.coverage.funders.toFixed(0) + '%', 7)} ${padNum(p.coverage.abstracts.toFixed(0) + '%', 7)} ${padNum(p.coverage.orcids.toFixed(0) + '%', 7)}`
    );
  }

  lines.push(thin);
  lines.push(
    `  ${pad('TOTAL (measured)', 26)} ${padNum(report.measuredArticles.toLocaleString(), 8)} ${padNum(report.totals.affiliationPercent.toFixed(0) + '%', 7)} ${padNum(report.totals.rorPercent.toFixed(0) + '%', 8)} ${padNum(report.totals.institutionalRorPercent.toFixed(0) + '%', 8)} ${padNum(report.totals.funderPercent.toFixed(0) + '%', 7)} ${padNum(report.totals.abstractPercent.toFixed(0) + '%', 7)}`
  );
  lines.push(sep);

  {
    const s = report.crossrefScope;
    const belowFloor = report.analyzedArticles - report.measuredArticles;
    lines.push('');
    lines.push('  NOT MEASURED (evidence-based, read from Crossref records)');
    lines.push(thin);
    lines.push(`  ${pad('Not in Crossref (DataCite/repo/preprint)', 60)} ${padNum(s.notInCrossref.toLocaleString(), 8)}`);
    lines.push(`  ${pad('In Crossref, other content type', 60)} ${padNum(s.otherContentType.toLocaleString(), 8)}`);
    for (const t of report.otherTypeBreakdown.slice(0, 8)) {
      lines.push(`  ${pad(`    - ${t.type}`, 60)} ${padNum(t.count.toLocaleString(), 8)}`);
    }
    lines.push(`  ${pad(`Below ${report.notes.minSampleSize}-article sample floor`, 60)} ${padNum(belowFloor.toLocaleString(), 8)}`);
    lines.push(`  ${pad('No DOI in OpenAlex (nothing to probe)', 60)} ${padNum(s.noDoi.toLocaleString(), 8)}`);
    lines.push(`  ${pad('Duplicate DOI in OpenAlex (probed once)', 60)} ${padNum(s.duplicateDoi.toLocaleString(), 8)}`);
    if (s.probeFailed > 0) {
      lines.push(`  ${pad('Crossref probe unresolved (excluded)', 60)} ${padNum(s.probeFailed.toLocaleString(), 8)}`);
    }
    lines.push(sep);
  }

  lines.push('');
  lines.push(`  ${report.notes.source}`);
  lines.push(`  ${report.notes.contentType}. Sample threshold: ${report.notes.minSampleSize} articles.`);
  lines.push('');
  lines.push('  OxROR = this institution\'s ROR present on any author affiliation.');
  lines.push('  AnyROR = any ROR ID present in author affiliations.');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const { ror, search, days } = parseArgs();

  if (!ror && !search) {
    console.error('Usage:');
    console.error('  --ror <ror_id>       Analyze by ROR ID (e.g., 052gg0110)');
    console.error('  --search "<name>"    Search for an institution');
    console.error('  --days <n>           Window size in days (default: 90)');
    process.exit(1);
  }

  let targetRor = ror;

  if (search && !ror) {
    console.log(`\nSearching for "${search}"...\n`);
    const results = await searchInstitutions(search);
    if (results.length === 0) { console.error('No institutions found.'); process.exit(1); }
    console.log('Results:');
    results.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} (${r.country}) - ROR: ${r.ror}`));
    console.log(`\nUsing first result: ${results[0].name}\n`);
    targetRor = results[0].ror;
  }

  if (!targetRor) { console.error('No ROR ID resolved.'); process.exit(1); }

  console.log(`Analyzing institution (ROR: ${targetRor}, window: ${days} days)...`);
  console.log('  1. Fetching DOIs from OpenAlex (cursor pagination)...');
  console.log('  2. Fetching Crossref work records in batches and inspecting each...');

  const report = await analyzeInstitution(targetRor, days);
  console.log(formatReport(report));
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
