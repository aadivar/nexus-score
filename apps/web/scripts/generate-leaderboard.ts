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
    'backfile-dois': number;
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
    'update-policies-current': number;
    'update-policies-backfile': number;
    'similarity-checking-current': number;
    'similarity-checking-backfile': number;
    'ror-ids-current': number;
    'ror-ids-backfile': number;
    'award-numbers-current': number;
    'award-numbers-backfile': number;
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
  currentScore: number;
  backfileScore: number | null; // null if no backfile content
  improvement: number | null; // null if no backfile to compare against
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
  currentScore: number;
  backfileScore: number | null;
  improvement: number | null;
  dimensions: LeaderboardEntry['dimensions'];
} {
  const coverage = member.coverage || {};
  const hasBackfile = (member.counts?.['backfile-dois'] || 0) > 0;

  // Coverage values from Crossref are decimals (0-1), convert to percentages (0-100)
  const toPercent = (val: number | undefined) => Math.round((val || 0) * 100);

  // Calculate CURRENT dimension percentages
  // Provenance: references (15pts) + update-policies (5pts) + similarity-checking (5pts) = 25pts
  const currentReferences = toPercent(coverage['references-current']);
  const currentUpdatePolicies = toPercent(coverage['update-policies-current']);
  const currentSimilarityCheck = toPercent(coverage['similarity-checking-current']);
  const currentProvenance = Math.round((currentReferences * 15 + currentUpdatePolicies * 5 + currentSimilarityCheck * 5) / 25);

  const currentPeople = toPercent(coverage['orcids-current']);

  // Organizations: affiliations (5pts) + ROR IDs (10pts) = 15pts
  const currentAffiliations = toPercent(coverage['affiliations-current']);
  const currentRorIds = toPercent(coverage['ror-ids-current']);
  const currentOrganizations = Math.round((currentAffiliations * 5 + currentRorIds * 10) / 15);

  // Funding: funders (10pts) + award-numbers (10pts) = 20pts
  const currentFunders = toPercent(coverage['funders-current']);
  const currentAwardNumbers = toPercent(coverage['award-numbers-current']);
  const currentFunding = Math.round((currentFunders * 10 + currentAwardNumbers * 10) / 20);

  // Access: licenses (7pts) + resource-links (7pts) + abstracts (6pts) = 20pts
  const currentAbstracts = toPercent(coverage['abstracts-current']);
  const currentLicenses = toPercent(coverage['licenses-current']);
  const currentLinks = toPercent(coverage['resource-links-current']);
  const currentAccess = Math.round((currentLicenses * 7 + currentLinks * 7 + currentAbstracts * 6) / 20);

  // Calculate BACKFILE dimension percentages
  const backfileReferences = toPercent(coverage['references-backfile']);
  const backfileUpdatePolicies = toPercent(coverage['update-policies-backfile']);
  const backfileSimilarityCheck = toPercent(coverage['similarity-checking-backfile']);
  const backfileProvenance = Math.round((backfileReferences * 15 + backfileUpdatePolicies * 5 + backfileSimilarityCheck * 5) / 25);

  const backfilePeople = toPercent(coverage['orcids-backfile']);

  const backfileAffiliations = toPercent(coverage['affiliations-backfile']);
  const backfileRorIds = toPercent(coverage['ror-ids-backfile']);
  const backfileOrganizations = Math.round((backfileAffiliations * 5 + backfileRorIds * 10) / 15);

  const backfileFunders = toPercent(coverage['funders-backfile']);
  const backfileAwardNumbers = toPercent(coverage['award-numbers-backfile']);
  const backfileFunding = Math.round((backfileFunders * 10 + backfileAwardNumbers * 10) / 20);

  const backfileAbstracts = toPercent(coverage['abstracts-backfile']);
  const backfileLicenses = toPercent(coverage['licenses-backfile']);
  const backfileLinks = toPercent(coverage['resource-links-backfile']);
  const backfileAccess = Math.round((backfileLicenses * 7 + backfileLinks * 7 + backfileAbstracts * 6) / 20);

  // Calculate weighted current score
  const currentScore = Math.round(
    (currentProvenance * WEIGHTS.provenance +
      currentPeople * WEIGHTS.people +
      currentOrganizations * WEIGHTS.organizations +
      currentFunding * WEIGHTS.funding +
      currentAccess * WEIGHTS.access) / 100
  );

  // Calculate weighted backfile score (only if they have backfile content)
  const backfileScoreValue = Math.round(
    (backfileProvenance * WEIGHTS.provenance +
      backfilePeople * WEIGHTS.people +
      backfileOrganizations * WEIGHTS.organizations +
      backfileFunding * WEIGHTS.funding +
      backfileAccess * WEIGHTS.access) / 100
  );

  // Only set backfile score and improvement if publisher has backfile content
  const backfileScore = hasBackfile ? backfileScoreValue : null;
  const improvement = hasBackfile ? currentScore - backfileScoreValue : null;

  // Overall dimensions (average of current and backfile)
  const provenance = Math.round((currentProvenance + backfileProvenance) / 2);
  const people = Math.round((currentPeople + backfilePeople) / 2);
  const organizations = Math.round((currentOrganizations + backfileOrganizations) / 2);
  const funding = Math.round((currentFunding + backfileFunding) / 2);
  const access = Math.round((currentAccess + backfileAccess) / 2);

  // Calculate weighted total score (average)
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
    currentScore,
    backfileScore,
    improvement,
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
      currentScore: score.currentScore,
      backfileScore: score.backfileScore,
      improvement: score.improvement,
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
