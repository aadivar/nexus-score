/**
 * Test script to validate the enrichment pipeline with real DOIs
 *
 * Usage: pnpm --filter @nexus-score/gap-fixer test:enrich
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

import { enrichFromOpenAlex } from '../src/lib/enrichers/openalex';
import { fetchOrcidRecord } from '../src/lib/enrichers/orcid';
import { matchAffiliation } from '../src/lib/enrichers/ror';
import { createEnrichmentSummary, analyzeGaps } from '../src/lib/scoring/confidence';
import type { GapType } from '../src/lib/db/types';
import type { EnrichmentResult } from '../src/lib/enrichers/types';

// Test DOIs from the gap report with different gap types
const TEST_CASES = [
  // Missing References
  { doi: '10.7554/elife.80570', gaps: ['references'] as GapType[] },
  { doi: '10.7554/elife.00477', gaps: ['references'] as GapType[] },

  // Missing Abstracts
  { doi: '10.7554/elife.02490', gaps: ['abstracts'] as GapType[] },
  { doi: '10.7554/elife.03521', gaps: ['abstracts'] as GapType[] },

  // Missing ORCID, ROR, Funder
  { doi: '10.7554/elife.06758', gaps: ['orcid_ids', 'ror_ids', 'funder_registry_ids'] as GapType[] },
  { doi: '10.7554/elife.06877', gaps: ['orcid_ids', 'ror_ids', 'funder_registry_ids'] as GapType[] },

  // More diverse test cases
  { doi: '10.7554/elife.27970', gaps: ['references'] as GapType[] },
  { doi: '10.7554/elife.94305', gaps: ['abstracts'] as GapType[] },
  { doi: '10.7554/elife.01608', gaps: ['orcid_ids'] as GapType[] },
  { doi: '10.7554/elife.65227', gaps: ['references'] as GapType[] },
];

async function testEnrichment() {
  console.log('='.repeat(60));
  console.log('Gap Fixer - Enrichment Pipeline Test');
  console.log('='.repeat(60));
  console.log();

  const results: Array<{
    doi: string;
    gaps: GapType[];
    openalexFound: boolean;
    summary: ReturnType<typeof analyzeGaps> | null;
  }> = [];

  for (const testCase of TEST_CASES) {
    console.log(`\nTesting DOI: ${testCase.doi}`);
    console.log(`Expected gaps: ${testCase.gaps.join(', ')}`);
    console.log('-'.repeat(40));

    try {
      // Fetch from OpenAlex
      const openalexResult = await enrichFromOpenAlex(testCase.doi);

      if (!openalexResult) {
        console.log('  OpenAlex: No data found');
        results.push({
          doi: testCase.doi,
          gaps: testCase.gaps,
          openalexFound: false,
          summary: null,
        });
        continue;
      }

      console.log('  OpenAlex: Data found');
      console.log(`    - Abstract: ${openalexResult.abstract ? 'Yes (' + openalexResult.abstract.length + ' chars)' : 'No'}`);
      console.log(`    - References: ${openalexResult.references?.length || 0}`);
      console.log(`    - Authors: ${openalexResult.authors?.length || 0}`);

      // Check authors for ORCIDs and RORs
      if (openalexResult.authors) {
        const withOrcid = openalexResult.authors.filter(a => a.orcid).length;
        const withRor = openalexResult.authors.flatMap(a => a.affiliations).filter(aff => aff.ror).length;
        console.log(`    - Authors with ORCID: ${withOrcid}/${openalexResult.authors.length}`);
        console.log(`    - Affiliations with ROR: ${withRor}`);
      }

      console.log(`    - Funders: ${openalexResult.funders?.length || 0}`);
      console.log(`    - License: ${openalexResult.license || 'No'}`);

      // Create enrichment summary
      const enrichmentResults: EnrichmentResult[] = [openalexResult];
      const summary = createEnrichmentSummary(testCase.doi, enrichmentResults);

      // Analyze gaps
      const analysis = analyzeGaps(summary, testCase.gaps);

      console.log(`\n  Gap Analysis:`);
      for (const gap of analysis.gapDetails) {
        const status = gap.recoverable ? '✓ Recoverable' : '✗ Not recoverable';
        const autoSubmit = gap.autoSubmit ? ' (auto-submit ready)' : '';
        console.log(`    - ${gap.type}: ${gap.confidence}% confidence - ${status}${autoSubmit}`);
      }

      results.push({
        doi: testCase.doi,
        gaps: testCase.gaps,
        openalexFound: true,
        summary: analysis,
      });

      // Small delay to be nice to APIs
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.log(`  Error: ${error}`);
      results.push({
        doi: testCase.doi,
        gaps: testCase.gaps,
        openalexFound: false,
        summary: null,
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const found = results.filter(r => r.openalexFound).length;
  const totalGaps = results.reduce((sum, r) => sum + r.gaps.length, 0);
  const recoverableGaps = results.reduce(
    (sum, r) => sum + (r.summary?.recoverableGaps || 0),
    0
  );

  console.log(`\nArticles tested: ${results.length}`);
  console.log(`OpenAlex data found: ${found}/${results.length} (${Math.round(found/results.length*100)}%)`);
  console.log(`Total gaps: ${totalGaps}`);
  console.log(`Recoverable gaps: ${recoverableGaps}/${totalGaps} (${Math.round(recoverableGaps/totalGaps*100)}%)`);

  // Breakdown by gap type
  console.log('\nRecovery rate by gap type:');
  const gapTypeStats: Record<GapType, { total: number; recoverable: number }> = {} as any;

  for (const result of results) {
    if (!result.summary) continue;

    for (const detail of result.summary.gapDetails) {
      if (!gapTypeStats[detail.type]) {
        gapTypeStats[detail.type] = { total: 0, recoverable: 0 };
      }
      gapTypeStats[detail.type].total++;
      if (detail.recoverable) {
        gapTypeStats[detail.type].recoverable++;
      }
    }
  }

  for (const [type, stats] of Object.entries(gapTypeStats)) {
    const rate = Math.round(stats.recoverable / stats.total * 100);
    console.log(`  - ${type}: ${stats.recoverable}/${stats.total} (${rate}%)`);
  }

  console.log('\n' + '='.repeat(60));
}

// Test ROR affiliation matching
async function testRorMatching() {
  console.log('\n\nTesting ROR Affiliation Matching');
  console.log('='.repeat(60));

  const testAffiliations = [
    'Yale University',
    'Brandeis University',
    'University of Cambridge',
    'Max Planck Institute for Brain Research',
    'Howard Hughes Medical Institute',
  ];

  for (const aff of testAffiliations) {
    const result = await matchAffiliation(aff);
    if (result) {
      console.log(`\n"${aff}"`);
      console.log(`  -> ROR: ${result.ror}`);
      console.log(`  -> Name: ${result.name}`);
    } else {
      console.log(`\n"${aff}" -> No match`);
    }
  }
}

// Test ORCID fetching
async function testOrcidFetching() {
  console.log('\n\nTesting ORCID Fetching');
  console.log('='.repeat(60));

  const testOrcids = [
    '0000-0002-5915-4042', // Sungho Jin
    '0000-0001-9632-5448', // Eve Marder
    '0000-0003-2686-9022', // Margaret M. Stratton
  ];

  for (const orcid of testOrcids) {
    const result = await fetchOrcidRecord(orcid);
    if (result) {
      console.log(`\nORCID: ${orcid}`);
      console.log(`  Name: ${result.name}`);
      console.log(`  Affiliations: ${result.affiliations.length}`);
      for (const aff of result.affiliations.slice(0, 3)) {
        console.log(`    - ${aff.name}${aff.ror ? ` (ROR: ${aff.ror})` : ''}`);
      }
    } else {
      console.log(`\nORCID ${orcid}: No data`);
    }
  }
}

async function main() {
  try {
    await testEnrichment();
    await testRorMatching();
    await testOrcidFetching();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
