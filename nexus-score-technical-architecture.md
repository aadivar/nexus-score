# Nexus Score: Technical Architecture

## Build Order Strategy

```
Phase 1: MCP Server (Foundation)
    ↓
Phase 2: API Layer (Next.js Route Handlers)
    ↓
Phase 3: Web UI (Next.js Frontend)
    ↓
Phase 4: Advanced Features
```

**Why start with MCP?**
1. Forces you to define clean interfaces first
2. Immediately usable by Claude/AI assistants
3. Can test scoring logic before building UI
4. The MCP server becomes a reusable package
5. Shows Crossref you understand modern AI tooling

---

## Phase 1: MCP Server

### Project Structure

```
nexus-score/
├── packages/
│   ├── mcp-server/           # MCP server (standalone)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts      # MCP server entry
│   │   │   ├── tools/        # MCP tool definitions
│   │   │   │   ├── get-member-score.ts
│   │   │   │   ├── get-journal-score.ts
│   │   │   │   ├── compare-members.ts
│   │   │   │   ├── search-members.ts
│   │   │   │   └── get-recommendations.ts
│   │   │   └── lib/          # Shared logic
│   │   │       ├── crossref-client.ts
│   │   │       ├── scoring.ts
│   │   │       └── types.ts
│   │   └── README.md
│   │
│   └── core/                 # Shared scoring logic (used by MCP + API)
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── crossref/
│       │   │   ├── client.ts
│       │   │   ├── types.ts
│       │   │   └── endpoints.ts
│       │   ├── scoring/
│       │   │   ├── calculator.ts
│       │   │   ├── dimensions.ts
│       │   │   └── recommendations.ts
│       │   └── utils/
│       │       └── cache.ts
│       └── README.md
│
├── apps/
│   └── web/                  # Next.js app (Phase 3)
│       └── ...
│
├── package.json              # Workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

### Monorepo Setup

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// package.json (root)
{
  "name": "nexus-score",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "mcp": "pnpm --filter @nexus-score/mcp-server dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Core Package: `@nexus-score/core`

This is the heart of everything - shared between MCP server and web app.

### Crossref Client

```typescript
// packages/core/src/crossref/client.ts

import { CrossrefMember, CrossrefWork, CrossrefJournal, SearchResult } from './types';

const BASE_URL = 'https://api.crossref.org';
const POLITE_MAIL = process.env.CROSSREF_MAILTO || 'nexus-score@example.com';

interface ClientOptions {
  mailto?: string;
  timeout?: number;
}

export class CrossrefClient {
  private mailto: string;
  private timeout: number;

  constructor(options: ClientOptions = {}) {
    this.mailto = options.mailto || POLITE_MAIL;
    this.timeout = options.timeout || 30000;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    // Add polite pool header via mailto param
    url.searchParams.set('mailto', this.mailto);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': `NexusScore/1.0 (mailto:${this.mailto})`,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new CrossrefAPIError(response.status, await response.text());
    }

    const data = await response.json();
    return data.message as T;
  }

  // ============ MEMBER ENDPOINTS ============

  /**
   * Get member by ID - returns pre-computed coverage stats
   * This is the primary endpoint for scoring!
   */
  async getMember(memberId: string): Promise<CrossrefMember> {
    return this.fetch<CrossrefMember>(`/members/${memberId}`);
  }

  /**
   * Search members by name
   */
  async searchMembers(query: string, limit = 10): Promise<SearchResult<CrossrefMember>> {
    return this.fetch<SearchResult<CrossrefMember>>('/members', {
      query,
      rows: limit.toString(),
    });
  }

  /**
   * Get sample works from a member (for deep analysis)
   */
  async getMemberWorksSample(memberId: string, sampleSize = 100): Promise<CrossrefWork[]> {
    const result = await this.fetch<{ items: CrossrefWork[] }>(
      `/members/${memberId}/works`,
      {
        sample: sampleSize.toString(),
        select: 'DOI,author,funder,reference,license,link,abstract',
      }
    );
    return result.items;
  }

  // ============ JOURNAL ENDPOINTS ============

  /**
   * Get journal by ISSN
   */
  async getJournal(issn: string): Promise<CrossrefJournal> {
    return this.fetch<CrossrefJournal>(`/journals/${issn}`);
  }

  /**
   * Get sample works from a journal
   */
  async getJournalWorksSample(issn: string, sampleSize = 100): Promise<CrossrefWork[]> {
    const result = await this.fetch<{ items: CrossrefWork[] }>(
      `/journals/${issn}/works`,
      {
        sample: sampleSize.toString(),
        select: 'DOI,author,funder,reference,license,link,abstract',
      }
    );
    return result.items;
  }

  // ============ WORKS ENDPOINTS ============

  /**
   * Get a single work by DOI
   */
  async getWork(doi: string): Promise<CrossrefWork> {
    return this.fetch<CrossrefWork>(`/works/${encodeURIComponent(doi)}`);
  }
}

export class CrossrefAPIError extends Error {
  constructor(public status: number, public body: string) {
    super(`Crossref API error ${status}: ${body}`);
  }
}
```

### Type Definitions

```typescript
// packages/core/src/crossref/types.ts

/**
 * Coverage statistics from /members/{id} endpoint
 * These are pre-computed by Crossref - no pagination needed!
 */
export interface MemberCoverage {
  // Current = published in last 2 years
  'affiliations-current': number;
  'abstracts-current': number;
  'orcids-current': number;
  'licenses-current': number;
  'references-current': number;
  'funders-current': number;
  'similarity-checking-current': number;
  'award-numbers-current': number;
  'update-policies-current': number;
  'resource-links-current': number;
  'ror-ids-current': number;
  
  // Backfile = older than 2 years
  'affiliations-backfile': number;
  'abstracts-backfile': number;
  'orcids-backfile': number;
  'licenses-backfile': number;
  'references-backfile': number;
  'funders-backfile': number;
  'similarity-checking-backfile': number;
  'award-numbers-backfile': number;
  'update-policies-backfile': number;
  'resource-links-backfile': number;
  'ror-ids-backfile': number;
}

export interface CrossrefMember {
  id: number;
  'primary-name': string;
  names: string[];
  prefixes: { value: string; name: string }[];
  coverage: MemberCoverage;
  'coverage-type': {
    all: Record<string, MemberCoverage>;
    current: Record<string, MemberCoverage>;
    backfile: Record<string, MemberCoverage>;
  };
  counts: {
    'total-dois': number;
    'current-dois': number;
    'backfile-dois': number;
  };
  breakdowns: {
    'dois-by-issued-year': Array<[number, number]>;
  };
  flags: {
    'deposits-abstracts-current': boolean;
    'deposits-orcids-current': boolean;
    'deposits-affiliations-current': boolean;
    'deposits-funders-current': boolean;
    // ... more flags
  };
  location: string;
  tokens: string[];
}

export interface CrossrefJournal {
  ISSN: string[];
  title: string;
  publisher: string;
  'last-status-check-time': number;
  counts: {
    'total-dois': number;
    'current-dois': number;
    'backfile-dois': number;
  };
  coverage: MemberCoverage;
  breakdowns: {
    'dois-by-issued-year': Array<[number, number]>;
  };
}

export interface CrossrefWork {
  DOI: string;
  title: string[];
  author?: Author[];
  funder?: Funder[];
  reference?: Reference[];
  license?: License[];
  link?: Link[];
  abstract?: string;
  'is-referenced-by-count': number;
  'references-count': number;
  type: string;
  issued: DateParts;
  publisher: string;
}

export interface Author {
  given?: string;
  family?: string;
  name?: string; // For organizations
  ORCID?: string;
  affiliation?: Affiliation[];
}

export interface Affiliation {
  name: string;
  id?: Array<{
    id: string;
    'id-type': string; // 'ROR' | 'ISNI' | etc
    'asserted-by': string;
  }>;
}

export interface Funder {
  DOI?: string;
  name: string;
  'doi-asserted-by'?: string;
  award?: string[];
}

export interface Reference {
  key: string;
  DOI?: string;
  'unstructured'?: string;
  'article-title'?: string;
  author?: string;
  year?: string;
}

export interface License {
  URL: string;
  'content-version': string;
  'delay-in-days': number;
}

export interface Link {
  URL: string;
  'content-type': string;
  'intended-application': string;
}

export interface DateParts {
  'date-parts': number[][];
}

export interface SearchResult<T> {
  items: T[];
  'total-results': number;
  'items-per-page': number;
  query: {
    'start-index': number;
    'search-terms': string;
  };
}
```

### Scoring Engine

```typescript
// packages/core/src/scoring/calculator.ts

import { CrossrefMember, CrossrefWork, MemberCoverage } from '../crossref/types';
import { DIMENSION_WEIGHTS, METRIC_WEIGHTS } from './dimensions';

export interface NexusScore {
  total: number;           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: DimensionScores;
  trend: TrendInfo;
  recommendations: Recommendation[];
  metadata: ScoreMetadata;
}

export interface DimensionScores {
  provenance: DimensionDetail;
  people: DimensionDetail;
  organizations: DimensionDetail;
  funding: DimensionDetail;
  access: DimensionDetail;
}

export interface DimensionDetail {
  score: number;
  maxScore: number;
  percentage: number;
  metrics: MetricDetail[];
}

export interface MetricDetail {
  name: string;
  key: string;
  value: number;           // 0-1 (percentage from API)
  contribution: number;    // Points contributed to score
  maxContribution: number;
  status: 'excellent' | 'good' | 'needs-work' | 'poor';
}

export interface TrendInfo {
  direction: 'up' | 'down' | 'stable';
  change: number;          // Difference between current and backfile
  currentScore: number;
  backfileScore: number;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  dimension: keyof DimensionScores;
  metric: string;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  potentialGain: number;
  howToImprove: string;
  documentationUrl: string;
}

export interface ScoreMetadata {
  memberId: number;
  memberName: string;
  calculatedAt: string;
  totalWorks: number;
  currentWorks: number;
  backfileWorks: number;
  dataSource: 'api-coverage' | 'sample-analysis';
}

/**
 * Calculate Nexus Score from member data
 * Primary method - uses pre-computed coverage from API
 */
export function calculateMemberScore(member: CrossrefMember): NexusScore {
  const coverage = member.coverage;
  
  // Calculate each dimension
  const dimensions = {
    provenance: calculateProvenance(coverage),
    people: calculatePeople(coverage),
    organizations: calculateOrganizations(coverage),
    funding: calculateFunding(coverage),
    access: calculateAccess(coverage),
  };
  
  // Sum total score
  const total = Object.values(dimensions).reduce(
    (sum, dim) => sum + dim.score, 
    0
  );
  
  // Calculate trend (current vs backfile)
  const trend = calculateTrend(member);
  
  // Generate recommendations
  const recommendations = generateRecommendations(dimensions, coverage);
  
  return {
    total: Math.round(total),
    grade: scoreToGrade(total),
    dimensions,
    trend,
    recommendations,
    metadata: {
      memberId: member.id,
      memberName: member['primary-name'],
      calculatedAt: new Date().toISOString(),
      totalWorks: member.counts['total-dois'],
      currentWorks: member.counts['current-dois'],
      backfileWorks: member.counts['backfile-dois'],
      dataSource: 'api-coverage',
    },
  };
}

// ============ DIMENSION CALCULATORS ============

function calculateProvenance(c: MemberCoverage): DimensionDetail {
  const metrics: MetricDetail[] = [
    createMetric('References', 'references-current', c['references-current'], 15),
    createMetric('Update Policies', 'update-policies-current', c['update-policies-current'], 5),
    createMetric('Similarity Check', 'similarity-checking-current', c['similarity-checking-current'], 5),
  ];
  
  return createDimension(metrics, 25);
}

function calculatePeople(c: MemberCoverage): DimensionDetail {
  const metrics: MetricDetail[] = [
    createMetric('ORCID Coverage', 'orcids-current', c['orcids-current'], 20),
  ];
  
  return createDimension(metrics, 20);
}

function calculateOrganizations(c: MemberCoverage): DimensionDetail {
  const metrics: MetricDetail[] = [
    createMetric('Affiliations (Text)', 'affiliations-current', c['affiliations-current'], 5),
    createMetric('ROR IDs', 'ror-ids-current', c['ror-ids-current'], 10),
  ];
  
  return createDimension(metrics, 15);
}

function calculateFunding(c: MemberCoverage): DimensionDetail {
  const metrics: MetricDetail[] = [
    createMetric('Funder Registry', 'funders-current', c['funders-current'], 10),
    createMetric('Award Numbers', 'award-numbers-current', c['award-numbers-current'], 10),
  ];
  
  return createDimension(metrics, 20);
}

function calculateAccess(c: MemberCoverage): DimensionDetail {
  const metrics: MetricDetail[] = [
    createMetric('Licenses', 'licenses-current', c['licenses-current'], 7),
    createMetric('Full-text Links', 'resource-links-current', c['resource-links-current'], 7),
    createMetric('Abstracts', 'abstracts-current', c['abstracts-current'], 6),
  ];
  
  return createDimension(metrics, 20);
}

// ============ HELPERS ============

function createMetric(
  name: string, 
  key: string, 
  value: number, 
  maxContribution: number
): MetricDetail {
  const safeValue = value || 0;
  const contribution = safeValue * maxContribution;
  
  return {
    name,
    key,
    value: safeValue,
    contribution: Math.round(contribution * 100) / 100,
    maxContribution,
    status: valueToStatus(safeValue),
  };
}

function createDimension(metrics: MetricDetail[], maxScore: number): DimensionDetail {
  const score = metrics.reduce((sum, m) => sum + m.contribution, 0);
  
  return {
    score: Math.round(score * 100) / 100,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    metrics,
  };
}

function valueToStatus(value: number): MetricDetail['status'] {
  if (value >= 0.8) return 'excellent';
  if (value >= 0.5) return 'good';
  if (value >= 0.2) return 'needs-work';
  return 'poor';
}

function scoreToGrade(score: number): NexusScore['grade'] {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function calculateTrend(member: CrossrefMember): TrendInfo {
  const currentCoverage = member.coverage;
  
  // Calculate backfile score using backfile metrics
  const backfileCoverage: MemberCoverage = {
    ...currentCoverage,
    'references-current': currentCoverage['references-backfile'],
    'orcids-current': currentCoverage['orcids-backfile'],
    'affiliations-current': currentCoverage['affiliations-backfile'],
    'ror-ids-current': currentCoverage['ror-ids-backfile'],
    'funders-current': currentCoverage['funders-backfile'],
    'award-numbers-current': currentCoverage['award-numbers-backfile'],
    'licenses-current': currentCoverage['licenses-backfile'],
    'resource-links-current': currentCoverage['resource-links-backfile'],
    'abstracts-current': currentCoverage['abstracts-backfile'],
    'update-policies-current': currentCoverage['update-policies-backfile'],
    'similarity-checking-current': currentCoverage['similarity-checking-backfile'],
  };
  
  const currentScore = calculateSimpleScore(currentCoverage);
  const backfileScore = calculateSimpleScore(backfileCoverage);
  const change = currentScore - backfileScore;
  
  return {
    direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
    change: Math.round(change),
    currentScore: Math.round(currentScore),
    backfileScore: Math.round(backfileScore),
  };
}

function calculateSimpleScore(c: MemberCoverage): number {
  return (
    (c['references-current'] || 0) * 15 +
    (c['update-policies-current'] || 0) * 5 +
    (c['similarity-checking-current'] || 0) * 5 +
    (c['orcids-current'] || 0) * 20 +
    (c['affiliations-current'] || 0) * 5 +
    (c['ror-ids-current'] || 0) * 10 +
    (c['funders-current'] || 0) * 10 +
    (c['award-numbers-current'] || 0) * 10 +
    (c['licenses-current'] || 0) * 7 +
    (c['resource-links-current'] || 0) * 7 +
    (c['abstracts-current'] || 0) * 6
  );
}
```

### Recommendations Engine

```typescript
// packages/core/src/scoring/recommendations.ts

import { DimensionScores, Recommendation, MetricDetail } from './calculator';
import { MemberCoverage } from '../crossref/types';

interface RecommendationTemplate {
  id: string;
  metric: string;
  dimension: keyof DimensionScores;
  title: string;
  description: string;
  howToImprove: string;
  documentationUrl: string;
  targetValue: number;
  priorityThreshold: {
    high: number;    // Below this = high priority
    medium: number;  // Below this = medium priority
  };
}

const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'orcid-coverage',
    metric: 'orcids-current',
    dimension: 'people',
    title: 'Increase ORCID Coverage',
    description: 'Add ORCID iDs for all authors to enable precise researcher identification and automatic reporting.',
    howToImprove: 'Require ORCID iDs in your submission system. Use ORCID\'s API for validation. Include the ORCID element in your XML deposits.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/contributors/',
    targetValue: 0.8,
    priorityThreshold: { high: 0.3, medium: 0.6 },
  },
  {
    id: 'ror-ids',
    metric: 'ror-ids-current',
    dimension: 'organizations',
    title: 'Add ROR IDs for Affiliations',
    description: 'Include ROR identifiers for institutional affiliations to enable unambiguous organization linking.',
    howToImprove: 'Use the ROR API to match affiliation text to ROR IDs. Include ROR IDs in your XML deposits alongside affiliation text.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/contributors/',
    targetValue: 0.6,
    priorityThreshold: { high: 0.1, medium: 0.3 },
  },
  {
    id: 'references',
    metric: 'references-current',
    dimension: 'provenance',
    title: 'Deposit Complete References',
    description: 'Include full reference lists to enable citation linking and the Cited-by service.',
    howToImprove: 'Extract references from your published content and include them in your Crossref deposits. Use DOIs where available.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/references/',
    targetValue: 0.95,
    priorityThreshold: { high: 0.5, medium: 0.8 },
  },
  {
    id: 'funders',
    metric: 'funders-current',
    dimension: 'funding',
    title: 'Add Funder Information',
    description: 'Include funding acknowledgements with Funder Registry IDs to enable grant tracking.',
    howToImprove: 'Extract funding info from acknowledgements sections. Use the Funder Registry API to match funder names to IDs.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/funding-information/',
    targetValue: 0.6,
    priorityThreshold: { high: 0.2, medium: 0.4 },
  },
  {
    id: 'award-numbers',
    metric: 'award-numbers-current',
    dimension: 'funding',
    title: 'Include Award/Grant Numbers',
    description: 'Add specific grant/award numbers to enable precise funding-to-output linking.',
    howToImprove: 'When funding info is available, also extract and include the specific award numbers. Consider using the new Grant DOI field.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/funding-information/',
    targetValue: 0.5,
    priorityThreshold: { high: 0.1, medium: 0.3 },
  },
  {
    id: 'abstracts',
    metric: 'abstracts-current',
    dimension: 'access',
    title: 'Include Abstracts',
    description: 'Add abstracts to improve discoverability and enable better search results.',
    howToImprove: 'Include the abstract element in your XML deposits. Both plain text and JATS XML formats are supported.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/abstracts/',
    targetValue: 0.9,
    priorityThreshold: { high: 0.3, medium: 0.6 },
  },
  {
    id: 'licenses',
    metric: 'licenses-current',
    dimension: 'access',
    title: 'Add License Information',
    description: 'Include license URLs to clarify reuse rights and support OA compliance checking.',
    howToImprove: 'Add the license element with the license URL (e.g., Creative Commons URL) to your deposits.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/license-information/',
    targetValue: 0.9,
    priorityThreshold: { high: 0.3, medium: 0.6 },
  },
  {
    id: 'full-text-links',
    metric: 'resource-links-current',
    dimension: 'access',
    title: 'Add Full-Text URLs',
    description: 'Include links to full-text content to enable text mining and improve accessibility.',
    howToImprove: 'Add resource links with content-type and intended-application attributes in your deposits.',
    documentationUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/full-text-urls/',
    targetValue: 0.8,
    priorityThreshold: { high: 0.3, medium: 0.5 },
  },
];

export function generateRecommendations(
  dimensions: DimensionScores,
  coverage: MemberCoverage
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  for (const template of RECOMMENDATION_TEMPLATES) {
    const currentValue = coverage[template.metric as keyof MemberCoverage] || 0;
    
    // Skip if already at target
    if (currentValue >= template.targetValue) continue;
    
    // Calculate potential gain
    const potentialGain = calculatePotentialGain(template, currentValue);
    
    // Determine priority
    const priority = determinePriority(currentValue, template.priorityThreshold);
    
    recommendations.push({
      id: template.id,
      priority,
      dimension: template.dimension,
      metric: template.metric,
      title: template.title,
      description: template.description,
      currentValue: Math.round(currentValue * 100),
      targetValue: Math.round(template.targetValue * 100),
      potentialGain: Math.round(potentialGain),
      howToImprove: template.howToImprove,
      documentationUrl: template.documentationUrl,
    });
  }
  
  // Sort by priority and potential gain
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.potentialGain - a.potentialGain;
  });
}

function calculatePotentialGain(template: RecommendationTemplate, currentValue: number): number {
  // This is simplified - in reality, depends on the metric weight
  const metricWeights: Record<string, number> = {
    'orcids-current': 20,
    'ror-ids-current': 10,
    'references-current': 15,
    'funders-current': 10,
    'award-numbers-current': 10,
    'abstracts-current': 6,
    'licenses-current': 7,
    'resource-links-current': 7,
  };
  
  const weight = metricWeights[template.metric] || 5;
  return (template.targetValue - currentValue) * weight;
}

function determinePriority(
  value: number, 
  threshold: { high: number; medium: number }
): 'high' | 'medium' | 'low' {
  if (value < threshold.high) return 'high';
  if (value < threshold.medium) return 'medium';
  return 'low';
}
```

---

## MCP Server Package: `@nexus-score/mcp-server`

```typescript
// packages/mcp-server/src/index.ts

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CrossrefClient, calculateMemberScore, calculateJournalScore } from '@nexus-score/core';

const client = new CrossrefClient({
  mailto: process.env.CROSSREF_MAILTO || 'nexus-score-mcp@example.com',
});

const server = new McpServer({
  name: 'nexus-score',
  version: '1.0.0',
});

// ============ TOOLS ============

server.tool(
  'get_member_score',
  'Get Nexus Score for a Crossref member (publisher/organization)',
  {
    member_id: z.string().describe('Crossref member ID (e.g., "286" for Oxford UP)'),
  },
  async ({ member_id }) => {
    try {
      const member = await client.getMember(member_id);
      const score = calculateMemberScore(member);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(score, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching member ${member_id}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  'search_members',
  'Search for Crossref members by name',
  {
    query: z.string().describe('Search query (publisher name)'),
    limit: z.number().optional().default(5).describe('Max results (default 5)'),
  },
  async ({ query, limit }) => {
    const result = await client.searchMembers(query, limit);
    
    const members = result.items.map(m => ({
      id: m.id,
      name: m['primary-name'],
      totalWorks: m.counts['total-dois'],
      location: m.location,
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            total: result['total-results'],
            members 
          }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  'get_journal_score',
  'Get Nexus Score for a specific journal by ISSN',
  {
    issn: z.string().describe('Journal ISSN (e.g., "0028-0836" for Nature)'),
  },
  async ({ issn }) => {
    const journal = await client.getJournal(issn);
    const score = calculateJournalScore(journal);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(score, null, 2),
        },
      ],
    };
  }
);

server.tool(
  'compare_members',
  'Compare Nexus Scores between multiple publishers',
  {
    member_ids: z.array(z.string()).describe('Array of member IDs to compare'),
  },
  async ({ member_ids }) => {
    const scores = await Promise.all(
      member_ids.map(async (id) => {
        const member = await client.getMember(id);
        return calculateMemberScore(member);
      })
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(scores, null, 2),
        },
      ],
    };
  }
);

server.tool(
  'get_recommendations',
  'Get improvement recommendations for a member',
  {
    member_id: z.string().describe('Crossref member ID'),
    limit: z.number().optional().default(5).describe('Max recommendations'),
  },
  async ({ member_id, limit }) => {
    const member = await client.getMember(member_id);
    const score = calculateMemberScore(member);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            member: score.metadata.memberName,
            currentScore: score.total,
            recommendations: score.recommendations.slice(0, limit),
          }, null, 2),
        },
      ],
    };
  }
);

// ============ RESOURCES ============

server.resource(
  'methodology',
  'nexus-score://methodology',
  async () => ({
    contents: [
      {
        uri: 'nexus-score://methodology',
        mimeType: 'text/markdown',
        text: `# Nexus Score Methodology

Nexus Score measures how well metadata contributes to Crossref's Research Nexus vision.

## Dimensions (Total: 100 points)

### Provenance (25 points)
- References: 15 points
- Update Policies: 5 points
- Similarity Check: 5 points

### People (20 points)
- ORCID Coverage: 20 points

### Organizations (15 points)
- Affiliations (text): 5 points
- ROR IDs: 10 points

### Funding (20 points)
- Funder Registry: 10 points
- Award Numbers: 10 points

### Access (20 points)
- Licenses: 7 points
- Full-text Links: 7 points
- Abstracts: 6 points

## Data Source
Scores are calculated using pre-computed coverage statistics from Crossref's /members API endpoint.
`,
      },
    ],
  })
);

// ============ START SERVER ============

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Nexus Score MCP server running');
}

main().catch(console.error);
```

### MCP Server package.json

```json
// packages/mcp-server/package.json
{
  "name": "@nexus-score/mcp-server",
  "version": "1.0.0",
  "description": "MCP server for Crossref metadata quality scoring",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "nexus-score-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@nexus-score/core": "workspace:*",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

### Claude Desktop Config

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "nexus-score": {
      "command": "npx",
      "args": ["@nexus-score/mcp-server"],
      "env": {
        "CROSSREF_MAILTO": "your-email@example.com"
      }
    }
  }
}
```

---

## Phase 2: Next.js API Routes

Once the core is solid, the Next.js API routes are thin wrappers:

```typescript
// apps/web/app/api/member/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { CrossrefClient, calculateMemberScore } from '@nexus-score/core';

const client = new CrossrefClient({
  mailto: process.env.CROSSREF_MAILTO,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await client.getMember(params.id);
    const score = calculateMemberScore(member);
    
    return NextResponse.json(score, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }
    throw error;
  }
}
```

```typescript
// apps/web/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { CrossrefClient } from '@nexus-score/core';

const client = new CrossrefClient({
  mailto: process.env.CROSSREF_MAILTO,
});

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }
  
  const result = await client.searchMembers(query, limit);
  
  // Transform to lighter response
  const members = result.items.map(m => ({
    id: m.id,
    name: m['primary-name'],
    totalWorks: m.counts['total-dois'],
  }));
  
  return NextResponse.json({
    total: result['total-results'],
    members,
  });
}
```

---

## Development Sequence

### Week 1: Core Package
```bash
# Day 1-2: Setup monorepo
pnpm init
# Add turbo, typescript, workspace config

# Day 3-4: Crossref client
# Build and test client against real API

# Day 5-7: Scoring engine
# Implement calculator, test with fixtures
```

### Week 2: MCP Server
```bash
# Day 1-3: MCP tools
# Implement all 5 tools

# Day 4-5: Test with Claude Desktop
# Debug, refine responses

# Day 6-7: Publish to npm
npm publish --access public
```

### Week 3-4: Next.js Web App
```bash
# Build on top of working core + MCP
# UI is the easy part once logic is solid
```

---

## Testing Strategy

```typescript
// packages/core/src/__tests__/scoring.test.ts

import { describe, it, expect } from 'vitest';
import { calculateMemberScore } from '../scoring/calculator';
import { mockMember } from './fixtures/members';

describe('calculateMemberScore', () => {
  it('calculates correct total for high-quality member', () => {
    const member = mockMember({
      coverage: {
        'references-current': 0.95,
        'orcids-current': 0.80,
        'ror-ids-current': 0.60,
        'funders-current': 0.70,
        'award-numbers-current': 0.50,
        'licenses-current': 0.90,
        'abstracts-current': 0.85,
        // ...
      },
    });
    
    const score = calculateMemberScore(member);
    
    expect(score.total).toBeGreaterThan(70);
    expect(score.grade).toBe('B');
  });
  
  it('generates recommendations for missing ORCID', () => {
    const member = mockMember({
      coverage: {
        'orcids-current': 0.20,
        // ... other fields high
      },
    });
    
    const score = calculateMemberScore(member);
    
    const orcidRec = score.recommendations.find(r => r.id === 'orcid-coverage');
    expect(orcidRec).toBeDefined();
    expect(orcidRec?.priority).toBe('high');
  });
});
```

---

## API Rate Limiting Considerations

```typescript
// packages/core/src/utils/rate-limiter.ts

import { RateLimiter } from 'limiter';

// Crossref polite pool: 50 requests/second
// We'll be conservative: 10 requests/second
const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'second',
});

export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  await limiter.removeTokens(1);
  return fn();
}
```

---

## Environment Variables

```bash
# .env.example

# Required: Your email for Crossref polite pool
CROSSREF_MAILTO=your-email@example.com

# Optional: Vercel KV for caching
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## Summary: Build Order

```
1. @nexus-score/core         ← Start here
   - Crossref client
   - Type definitions  
   - Scoring algorithm
   - Recommendations engine

2. @nexus-score/mcp-server   ← Then here
   - MCP tool definitions
   - Test with Claude Desktop
   - Publish to npm

3. apps/web                  ← Finally the UI
   - API routes (thin wrappers)
   - React components
   - Charts and visualizations
```

This approach means:
- Logic is testable in isolation
- MCP server works independently
- Web app is mostly presentation
- Easy to maintain and extend
