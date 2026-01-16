#!/usr/bin/env npx tsx
/**
 * Generate Leaderboard Data
 *
 * This script fetches ALL Crossref members, calculates their Nexus Scores,
 * and saves the results to a JSON file for the leaderboard.
 *
 * Run manually: pnpm --filter web generate-leaderboard
 * Or set up as a cron job / serverless function for periodic updates.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Crossref API settings
const BASE_URL = 'https://api.crossref.org';
const MAILTO = process.env.CROSSREF_MAILTO || 'varma2friend@gmail.com';
const ROWS_PER_PAGE = 1000; // Max allowed by Crossref
const RATE_LIMIT_DELAY = 100; // ms between requests (polite pool allows faster)

interface CrossrefMember {
  id: number;
  'primary-name': string;
  location?: string;
  counts: {
    'total-dois': number;
    'current-dois': number;
  };
  coverage: {
    'affiliations-current': number;
    'affiliations-backfile': number;
    'funders-current': number;
    'funders-backfile': number;
    'orcids-current': number;
    'orcids-backfile': number;
    'references-current': number;
    'references-backfile': number;
    'abstracts-current': number;
    'abstracts-backfile': number;
    'licenses-current': number;
    'licenses-backfile': number;
    'resource-links-current': number;
    'resource-links-backfile': number;
    'open-references-current': number;
    'open-references-backfile': number;
  };
  'coverage-type'?: {
    all?: {
      'last-status-check-time'?: number;
    };
  };
}

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  location?: string;
  score: number;
  grade: string;
  totalWorks: number;
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
}

interface LeaderboardData {
  generatedAt: string;
  totalMembers: number;
  totalWithWorks: number;
  leaderboard: LeaderboardEntry[];
}

// Dimension weights (must sum to 100)
const WEIGHTS = {
  provenance: 25,
  people: 20,
  organizations: 15,
  funding: 20,
  access: 20,
};

function calculateScore(member: CrossrefMember): {
  total: number;
  grade: string;
  dimensions: LeaderboardEntry['dimensions'];
} {
  const coverage = member.coverage || {};

  // Coverage values from Crossref are decimals (0-1), convert to percentages (0-100)
  const toPercent = (val: number | undefined) => Math.round((val || 0) * 100);

  // Calculate dimension percentages (average of current and backfile)
  const provenance = Math.round(
    (toPercent(coverage['references-current']) + toPercent(coverage['references-backfile'])) / 2
  );

  const people = Math.round(
    (toPercent(coverage['orcids-current']) + toPercent(coverage['orcids-backfile'])) / 2
  );

  const organizations = Math.round(
    (toPercent(coverage['affiliations-current']) + toPercent(coverage['affiliations-backfile'])) / 2
  );

  const funding = Math.round(
    (toPercent(coverage['funders-current']) + toPercent(coverage['funders-backfile'])) / 2
  );

  // Access: average of abstracts, licenses, and resource-links
  const abstractsCoverage = (toPercent(coverage['abstracts-current']) + toPercent(coverage['abstracts-backfile'])) / 2;
  const licensesCoverage = (toPercent(coverage['licenses-current']) + toPercent(coverage['licenses-backfile'])) / 2;
  const linksCoverage = (toPercent(coverage['resource-links-current']) + toPercent(coverage['resource-links-backfile'])) / 2;
  const access = Math.round((abstractsCoverage + licensesCoverage + linksCoverage) / 3);

  // Calculate weighted total score
  const total = Math.round(
    (provenance * WEIGHTS.provenance +
      people * WEIGHTS.people +
      organizations * WEIGHTS.organizations +
      funding * WEIGHTS.funding +
      access * WEIGHTS.access) / 100
  );

  // Determine grade
  let grade: string;
  if (total >= 80) grade = 'A';
  else if (total >= 60) grade = 'B';
  else if (total >= 40) grade = 'C';
  else if (total >= 20) grade = 'D';
  else grade = 'F';

  return {
    total,
    grade,
    dimensions: { provenance, people, organizations, funding, access },
  };
}

async function fetchMembers(offset: number): Promise<{ items: CrossrefMember[]; totalResults: number }> {
  const url = new URL(`${BASE_URL}/members`);
  url.searchParams.set('mailto', MAILTO);
  url.searchParams.set('rows', ROWS_PER_PAGE.toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': `NexusScore/1.0 (mailto:${MAILTO})`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Crossref API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.message.items,
    totalResults: data.message['total-results'],
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting leaderboard generation...');
  console.log(`📧 Using mailto: ${MAILTO}`);

  const allMembers: CrossrefMember[] = [];
  let offset = 0;
  let totalResults = 0;

  // Fetch all members with pagination
  console.log('\n📥 Fetching all Crossref members...');

  do {
    const result = await fetchMembers(offset);
    totalResults = result.totalResults;
    allMembers.push(...result.items);

    const progress = Math.min(100, Math.round((allMembers.length / totalResults) * 100));
    process.stdout.write(`\r   Progress: ${allMembers.length}/${totalResults} members (${progress}%)`);

    offset += ROWS_PER_PAGE;
    await sleep(RATE_LIMIT_DELAY);
  } while (offset < totalResults);

  console.log('\n✅ Fetched all members!');

  // Filter members with works and calculate scores
  console.log('\n📊 Calculating scores...');

  const membersWithWorks = allMembers.filter(
    (m) => m.counts && m.counts['total-dois'] && m.counts['total-dois'] > 0
  );
  console.log(`   Members with works: ${membersWithWorks.length}/${allMembers.length}`);

  const scored = membersWithWorks.map((member) => {
    const score = calculateScore(member);
    return {
      id: member.id,
      name: member['primary-name'],
      location: member.location,
      score: score.total,
      grade: score.grade,
      totalWorks: member.counts['total-dois'],
      dimensions: score.dimensions,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Add ranks
  const leaderboard: LeaderboardEntry[] = scored.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  // Prepare output data
  const data: LeaderboardData = {
    generatedAt: new Date().toISOString(),
    totalMembers: allMembers.length,
    totalWithWorks: membersWithWorks.length,
    leaderboard,
  };

  // Write to file
  const outputPath = join(__dirname, '..', 'data', 'leaderboard.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log(`\n📈 Leaderboard Stats:`);
  console.log(`   Total members: ${data.totalMembers}`);
  console.log(`   Members with works: ${data.totalWithWorks}`);
  console.log(`   Top scorer: ${leaderboard[0]?.name} (${leaderboard[0]?.score} points, Grade ${leaderboard[0]?.grade})`);
  console.log(`   Average score: ${Math.round(scored.reduce((sum, e) => sum + e.score, 0) / scored.length)}`);

  // Show top 10
  console.log(`\n🏆 Top 10 Publishers:`);
  leaderboard.slice(0, 10).forEach((entry) => {
    console.log(`   ${entry.rank}. ${entry.name} - ${entry.score} pts (${entry.grade})`);
  });

  console.log('\n✨ Done!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
