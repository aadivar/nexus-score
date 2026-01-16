# Nexus Score: Complete Project Plan

## Executive Summary

**What:** An open-source tool to measure and visualize how well Crossref members' metadata contributes to the Research Nexus vision.

**Why:** To demonstrate product thinking, technical skills, and deep Crossref knowledge for the Product Manager, Metadata role.

**Deliverables:**
1. `@nexus-score/core` - TypeScript library for scoring
2. `@nexus-score/mcp-server` - MCP server for AI assistants
3. `nexus-score.vercel.app` - Next.js web application
4. Documentation portfolio (API_FINDINGS.md, RECOMMENDATIONS.md)

**Timeline:** 4-5 weeks to MVP, apply by January 30th deadline

---

## Part 1: Strategic Context

### Why This Project Wins

| What Crossref Cares About | How Nexus Score Demonstrates It |
|---------------------------|--------------------------------|
| Research Nexus vision | Tool directly measures nexus connectivity |
| Barcelona Declaration | Aligns with open metadata movement |
| JSON API modeling | Deep work with their API, documented findings |
| Metadata quality | Core purpose of the tool |
| Community engagement | Open source, forum post, shareable |
| Product thinking | Goes beyond Participation Reports |

### Differentiation from Participation Reports

| Participation Reports | Nexus Score |
|----------------------|-------------|
| Shows % field presence | Shows weighted connectivity score |
| 11 separate percentages | Single composite score + breakdown |
| No recommendations | Actionable improvement suggestions |
| No comparisons | Publisher comparison tool |
| No trends visualization | Historical charts |
| Member-only focus | Public leaderboard |
| Web-only | MCP server for AI assistants |

### Barcelona Declaration Alignment

The Barcelona Declaration (April 2024) calls for open research information. Nexus Score supports this by:

1. Making metadata quality **visible and comparable**
2. Encouraging **ROR IDs** for affiliations (new emphasis)
3. Promoting **funding transparency** (only ~25% have funding info)
4. Supporting **FAIR principles** for metadata

Reference this in your cover letter and documentation.

---

## Part 2: Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONSUMERS                               │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│  Next.js    │   Claude    │   Other     │   CLI               │
│  Web App    │   Desktop   │   AI Tools  │   (future)          │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    @nexus-score/core                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Crossref   │  │   Scoring   │  │  Recommend  │             │
│  │   Client    │  │   Engine    │  │   Engine    │             │
│  └──────┬──────┘  └─────────────┘  └─────────────┘             │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Crossref REST API                            │
│                  https://api.crossref.org                       │
│                                                                 │
│  Key Endpoints:                                                 │
│  • /members/{id}         → Pre-computed coverage stats          │
│  • /members/{id}/works   → Sample works for deep analysis       │
│  • /journals/{issn}      → Journal-level stats                  │
│  • /works?sample=N       → Random sampling                      │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
nexus-score/
├── packages/
│   ├── core/                      # Shared library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── crossref/
│   │   │   │   ├── client.ts      # API client with rate limiting
│   │   │   │   ├── types.ts       # Full TypeScript types
│   │   │   │   └── errors.ts      # Custom error classes
│   │   │   ├── scoring/
│   │   │   │   ├── calculator.ts  # Main scoring algorithm
│   │   │   │   ├── dimensions.ts  # Dimension definitions
│   │   │   │   ├── weights.ts     # Configurable weights
│   │   │   │   └── grades.ts      # Grade thresholds
│   │   │   ├── recommendations/
│   │   │   │   ├── engine.ts      # Recommendation generator
│   │   │   │   ├── templates.ts   # Recommendation templates
│   │   │   │   └── priorities.ts  # Priority calculation
│   │   │   └── utils/
│   │   │       ├── cache.ts       # In-memory caching
│   │   │       └── rate-limit.ts  # Rate limiter
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mcp-server/                # MCP server package
│       ├── src/
│       │   ├── index.ts           # Server entry point
│       │   ├── tools/             # MCP tool definitions
│       │   └── resources/         # MCP resources
│       ├── package.json
│       └── README.md
│
├── apps/
│   └── web/                       # Next.js application
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx           # Landing/search
│       │   ├── member/[id]/
│       │   │   └── page.tsx       # Member dashboard
│       │   ├── journal/[issn]/
│       │   │   └── page.tsx       # Journal dashboard
│       │   ├── compare/
│       │   │   └── page.tsx       # Comparison tool
│       │   ├── leaderboard/
│       │   │   └── page.tsx       # Rankings
│       │   ├── about/
│       │   │   └── page.tsx       # Methodology
│       │   └── api/               # API routes
│       │       ├── member/[id]/route.ts
│       │       ├── journal/[issn]/route.ts
│       │       ├── search/route.ts
│       │       ├── compare/route.ts
│       │       └── og/route.tsx   # OG image generation
│       ├── components/
│       │   ├── ui/                # shadcn components
│       │   ├── score-card.tsx
│       │   ├── dimension-chart.tsx
│       │   ├── radar-chart.tsx
│       │   ├── trend-chart.tsx
│       │   ├── recommendations.tsx
│       │   ├── member-search.tsx
│       │   └── comparison-table.tsx
│       ├── lib/
│       │   └── api.ts             # Client-side API calls
│       └── package.json
│
├── docs/
│   ├── METHODOLOGY.md             # Scoring explanation
│   ├── API_FINDINGS.md            # ⭐ JSON modeling observations
│   ├── RECOMMENDATIONS.md         # ⭐ Suggestions for Crossref
│   └── CONTRIBUTING.md
│
├── package.json                   # Workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Part 3: Crossref API Deep Dive

### Key Discovery: Pre-computed Coverage

The `/members/{id}` endpoint returns **pre-computed coverage statistics**. This is crucial - it means:

- ✅ Single API call for basic scoring
- ✅ No pagination needed
- ✅ No heavy computation on our side
- ✅ Data updated daily by Crossref

```bash
# Example: Get Oxford University Press coverage
curl "https://api.crossref.org/members/286?mailto=you@email.com"
```

Response includes:
```json
{
  "message": {
    "id": 286,
    "primary-name": "Oxford University Press (OUP)",
    "coverage": {
      "affiliations-current": 0.78,
      "abstracts-current": 0.89,
      "orcids-current": 0.45,
      "licenses-current": 0.91,
      "references-current": 0.94,
      "funders-current": 0.52,
      "ror-ids-current": 0.31,
      "award-numbers-current": 0.42,
      ...
    },
    "counts": {
      "total-dois": 245892,
      "current-dois": 48234,
      "backfile-dois": 197658
    }
  }
}
```

### Rate Limits (Updated December 2025)

Crossref recently updated rate limits. Our approach:

| Pool | Access | Rate Limit | Our Strategy |
|------|--------|------------|--------------|
| Public | No mailto | Lower | Never use |
| Polite | With mailto | Higher | Always use |
| Plus | Paid subscription | Highest | Not needed for MVP |

**Implementation:**
```typescript
// ALWAYS include mailto for polite pool
const BASE_URL = 'https://api.crossref.org';
const MAILTO = process.env.CROSSREF_MAILTO;

function buildUrl(endpoint: string): string {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('mailto', MAILTO);
  return url.toString();
}
```

### Endpoints We'll Use

| Endpoint | Purpose | Pagination? |
|----------|---------|-------------|
| `/members/{id}` | Get coverage stats | No |
| `/members/{id}/works?sample=N` | Deep analysis sample | No (sample) |
| `/members?query=X` | Search members | Yes, but limited |
| `/journals/{issn}` | Journal stats | No |
| `/journals/{issn}/works?sample=N` | Journal sample | No (sample) |

### Coverage Fields Available

From the API, we get these pre-computed percentages:

```typescript
interface MemberCoverage {
  // Current = last 2 calendar years
  'affiliations-current': number;      // Text affiliations
  'abstracts-current': number;         // Has abstract
  'orcids-current': number;            // Has any ORCID
  'licenses-current': number;          // Has license URL
  'references-current': number;        // Has reference list
  'funders-current': number;           // Has funder info
  'similarity-checking-current': number; // Similarity Check URL
  'award-numbers-current': number;     // Has grant numbers
  'update-policies-current': number;   // Crossmark enabled
  'resource-links-current': number;    // Full-text URLs
  'ror-ids-current': number;           // Has ROR IDs
  
  // Backfile = older than 2 years (same fields)
  'affiliations-backfile': number;
  // ... etc
}
```

---

## Part 4: Scoring Algorithm

### The 5 Nexus Dimensions

```
TOTAL: 100 points

┌─────────────────────────────────────────────────────────────┐
│ PROVENANCE (25 pts)     │ Links to prior work              │
│ ├─ References:     15   │ Citation chains                  │
│ ├─ Update Policy:   5   │ Crossmark/corrections            │
│ └─ Similarity:      5   │ Integrity checking               │
├─────────────────────────────────────────────────────────────┤
│ PEOPLE (20 pts)         │ Author identification            │
│ └─ ORCID Coverage: 20   │ Researcher disambiguation        │
├─────────────────────────────────────────────────────────────┤
│ ORGANIZATIONS (15 pts)  │ Institutional links              │
│ ├─ Affiliations:    5   │ Text affiliations                │
│ └─ ROR IDs:        10   │ Structured org IDs               │
├─────────────────────────────────────────────────────────────┤
│ FUNDING (20 pts)        │ Grant tracking                   │
│ ├─ Funder Registry:10   │ Funder identification            │
│ └─ Award Numbers: 10    │ Specific grant linking           │
├─────────────────────────────────────────────────────────────┤
│ ACCESS (20 pts)         │ Content availability             │
│ ├─ Licenses:        7   │ Reuse rights                     │
│ ├─ Full-text URLs:  7   │ Text mining access               │
│ └─ Abstracts:       6   │ Discoverability                  │
└─────────────────────────────────────────────────────────────┘
```

### Why These Weights?

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Provenance | 25 | Core scholarly linking, Cited-by service |
| People | 20 | ORCID is foundational for disambiguation |
| Organizations | 15 | ROR is newer, still emerging |
| Funding | 20 | Barcelona Declaration emphasis, only 25% have it |
| Access | 20 | OA compliance, text mining |

### Score Calculation

```typescript
function calculateNexusScore(coverage: MemberCoverage): number {
  // Provenance (25 max)
  const provenance = 
    (coverage['references-current'] || 0) * 15 +
    (coverage['update-policies-current'] || 0) * 5 +
    (coverage['similarity-checking-current'] || 0) * 5;
  
  // People (20 max)
  const people = 
    (coverage['orcids-current'] || 0) * 20;
  
  // Organizations (15 max)
  const organizations = 
    (coverage['affiliations-current'] || 0) * 5 +
    (coverage['ror-ids-current'] || 0) * 10;
  
  // Funding (20 max)
  const funding = 
    (coverage['funders-current'] || 0) * 10 +
    (coverage['award-numbers-current'] || 0) * 10;
  
  // Access (20 max)
  const access = 
    (coverage['licenses-current'] || 0) * 7 +
    (coverage['resource-links-current'] || 0) * 7 +
    (coverage['abstracts-current'] || 0) * 6;
  
  return Math.round(provenance + people + organizations + funding + access);
}
```

### Grade Thresholds

```typescript
function scoreToGrade(score: number): string {
  if (score >= 80) return 'A';  // Excellent
  if (score >= 65) return 'B';  // Good
  if (score >= 50) return 'C';  // Adequate
  if (score >= 35) return 'D';  // Needs Work
  return 'F';                    // Poor
}
```

---

## Part 5: MCP Server Specification

### Tools

```typescript
// 1. get_member_score
{
  name: "get_member_score",
  description: "Get Nexus Score for a Crossref member by ID or name",
  parameters: {
    member_id: "string (optional) - Crossref member ID",
    member_name: "string (optional) - Search by name"
  },
  returns: "NexusScore object with total, dimensions, recommendations"
}

// 2. search_members
{
  name: "search_members", 
  description: "Search for Crossref members by name",
  parameters: {
    query: "string - Search term",
    limit: "number - Max results (default 5)"
  },
  returns: "Array of {id, name, totalWorks}"
}

// 3. get_journal_score
{
  name: "get_journal_score",
  description: "Get Nexus Score for a journal by ISSN",
  parameters: {
    issn: "string - Journal ISSN"
  },
  returns: "NexusScore object"
}

// 4. compare_members
{
  name: "compare_members",
  description: "Compare scores between multiple publishers",
  parameters: {
    member_ids: "string[] - Array of member IDs"
  },
  returns: "Array of NexusScore objects"
}

// 5. get_recommendations
{
  name: "get_recommendations",
  description: "Get improvement recommendations for a member",
  parameters: {
    member_id: "string",
    limit: "number (default 5)"
  },
  returns: "Array of Recommendation objects"
}
```

### Resources

```typescript
// methodology://nexus-score
{
  uri: "methodology://nexus-score",
  description: "Nexus Score methodology and weights explanation",
  mimeType: "text/markdown"
}
```

### Claude Desktop Configuration

```json
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

## Part 6: Web Application Specification

### Pages

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/` | Landing, search | Client-side |
| `/member/[id]` | Member dashboard | ISR (1 hour) |
| `/journal/[issn]` | Journal dashboard | ISR (1 hour) |
| `/compare` | Side-by-side comparison | Client-side |
| `/leaderboard` | Top publishers | ISR (24 hours) |
| `/about` | Methodology | Static |

### API Routes

```typescript
// GET /api/member/[id]
// Returns: NexusScore
// Cache: s-maxage=3600, stale-while-revalidate

// GET /api/journal/[issn]  
// Returns: NexusScore
// Cache: s-maxage=3600, stale-while-revalidate

// GET /api/search?q=query
// Returns: { total, members: [{id, name, works}] }
// Cache: s-maxage=60

// GET /api/compare?ids=1,2,3
// Returns: NexusScore[]
// Cache: s-maxage=3600

// GET /api/leaderboard?limit=50
// Returns: NexusScore[] (sorted)
// Cache: s-maxage=86400

// GET /api/og?member=286&score=72
// Returns: PNG image for social sharing
// Cache: s-maxage=86400
```

### Key Components

```typescript
// ScoreCard - Main score display
interface ScoreCardProps {
  score: number;
  grade: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

// DimensionBreakdown - 5 dimension bars
interface DimensionBreakdownProps {
  dimensions: DimensionScores;
  expanded?: boolean;
}

// RadarChart - Comparison visualization
interface RadarChartProps {
  members: Array<{
    name: string;
    dimensions: DimensionScores;
  }>;
}

// TrendChart - Historical scores
interface TrendChartProps {
  current: number;
  backfile: number;
  // Future: yearly breakdown if we add caching
}

// RecommendationPanel - Improvement suggestions
interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onExpand: (id: string) => void;
}

// MemberSearch - Autocomplete search
interface MemberSearchProps {
  onSelect: (member: { id: string; name: string }) => void;
  placeholder?: string;
}
```

### Tech Stack

```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "components": "shadcn/ui",
  "charts": "Recharts",
  "state": "nuqs (URL state), React Query",
  "deployment": "Vercel"
}
```

---

## Part 7: Documentation Portfolio

### API_FINDINGS.md (Your Interview Weapon)

Document everything you discover:

```markdown
# API Findings: Crossref REST API JSON Modeling

## Overview
While building Nexus Score, I analyzed the Crossref REST API 
extensively. Here are my observations and suggestions.

## Positive Observations
1. Pre-computed coverage stats in /members endpoint - excellent!
2. Consistent field naming across endpoints
3. Good use of ISO dates

## Inconsistencies Found
1. [Document specific examples you find]
2. Field X uses different format in endpoint Y vs Z
3. Missing field documentation for...

## Modeling Suggestions
1. Consider adding coverage for Grant DOIs (new Jan 2026 feature)
2. Standardize affiliation structure across endpoints
3. Add explicit "nexus connectivity" metrics

## Edge Cases
1. Members with zero works handle differently
2. Journals with multiple ISSNs
3. [Other edge cases you discover]

## Questions for the Team
1. Why is field X structured this way?
2. Plans for adding Y coverage metric?
```

### RECOMMENDATIONS.md

```markdown
# Recommendations for Crossref

Based on building Nexus Score, here are suggestions for 
Crossref's metadata products and services.

## Participation Reports Enhancements
1. Add composite "Nexus Score" alongside individual percentages
2. Enable public comparison between members
3. Add trend visualization

## API Improvements
1. Add endpoint for pre-computed journal coverage
2. Include Grant DOI coverage in member stats
3. Provide percentile rankings

## New Metrics to Consider
1. "Full ORCID coverage" - % of works where ALL authors have ORCID
2. "Reference DOI rate" - % of references that have DOIs
3. "Nexus connectivity" - composite relationship score

## Community Tools
1. Embeddable badges for publisher websites
2. API for third-party tools to get scores
3. Monthly email digests of score changes
```

---

## Part 8: Development Timeline

### Week 1: Foundation (Core Package)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Monorepo setup | pnpm workspace, turbo |
| 2 | Crossref types | Full TypeScript definitions |
| 3 | API client | Working client with rate limiting |
| 4 | Scoring algorithm | Calculator with tests |
| 5 | Recommendations | Engine with templates |
| 6-7 | Testing | Unit tests, fixtures |

### Week 2: MCP Server

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | MCP setup | Basic server structure |
| 3-4 | Tools | All 5 tools implemented |
| 5 | Testing | Test with Claude Desktop |
| 6 | Documentation | README, examples |
| 7 | Publish | npm publish @nexus-score/mcp-server |

### Week 3: Web App Core

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Next.js setup | App router, Tailwind, shadcn |
| 2 | API routes | /member, /journal, /search |
| 3-4 | Member page | Full dashboard UI |
| 5 | Search | Landing page with autocomplete |
| 6-7 | Styling | Polish, responsiveness |

### Week 4: Web App Advanced

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Compare page | Radar chart, table |
| 3 | Leaderboard | Rankings with filters |
| 4 | OG images | Social sharing |
| 5 | About page | Methodology explanation |
| 6-7 | Testing | E2E tests, bug fixes |

### Week 5: Launch

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Documentation | README, METHODOLOGY.md |
| 3 | API_FINDINGS.md | Your observations |
| 4 | RECOMMENDATIONS.md | Suggestions |
| 5 | Deploy | Vercel production |
| 6 | Announce | Forum post, social |
| 7 | Apply | Submit application |

---

## Part 9: Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limiting | High | Use polite pool, cache aggressively |
| API changes | Medium | Pin to specific version, monitor |
| Data inconsistencies | Medium | Defensive coding, null checks |
| Vercel limits | Low | Free tier is generous |

### Project Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict MVP definition |
| Time overrun | High | Cut features, not quality |
| Similar tool exists | Medium | Differentiate with MCP + insights |
| No community traction | Low | Tool is valuable regardless |

### Contingency: Minimum Viable Demo

If time runs short, prioritize:

1. ✅ Core scoring library (testable)
2. ✅ Single member dashboard page
3. ✅ Basic search
4. ✅ API_FINDINGS.md
5. ❌ Compare page (cut)
6. ❌ Leaderboard (cut)
7. ❌ MCP server (cut - but easy to add later)

---

## Part 10: Success Criteria

### For the Job Application

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Working demo | Live URL | Can show in interview |
| Code quality | Production-grade | TypeScript, tests, docs |
| API understanding | Deep | API_FINDINGS.md |
| Product thinking | Strong | RECOMMENDATIONS.md |
| Community engagement | Visible | Forum post, GitHub |

### For Community Impact

| Criteria | Target | Measurement |
|----------|--------|-------------|
| GitHub stars | 50+ | Organic growth |
| npm downloads | 100+ | MCP server usage |
| Forum engagement | 10+ replies | Community interest |
| Crossref acknowledgment | Any mention | Tweet, blog, email |

---

## Part 11: Launch Checklist

### Pre-Launch

- [ ] All tests passing
- [ ] README complete with screenshots
- [ ] METHODOLOGY.md explains scoring
- [ ] API_FINDINGS.md documents observations
- [ ] RECOMMENDATIONS.md ready
- [ ] Vercel deployment working
- [ ] OG images generating
- [ ] Mobile responsive

### Launch Day

- [ ] Crossref Community Forum post
- [ ] Tweet with demo link
- [ ] LinkedIn post
- [ ] Hacker News (maybe)
- [ ] Email to Patricia Feeney (hiring manager)

### Forum Post Template

```markdown
# Introducing Nexus Score: Measure Your Research Nexus Contribution

Hi everyone,

I built an open-source tool to help members visualize their 
metadata quality and its contribution to the Research Nexus.

🔗 Live demo: nexus-score.vercel.app
📦 GitHub: github.com/[you]/nexus-score
🤖 MCP Server: npx @nexus-score/mcp-server

## What it does
- Calculates a composite "Nexus Score" from coverage data
- Breaks down into 5 dimensions (Provenance, People, Orgs, Funding, Access)
- Provides actionable recommendations
- Allows comparison between publishers

## How it works
Uses the existing /members API endpoint - no heavy crawling needed!
The pre-computed coverage stats are perfect for this.

## Feedback welcome
I'd love to hear:
- Are the dimension weights reasonable?
- What other metrics would be useful?
- Any API observations I should document?

Built with the Research Nexus vision in mind. Hope it's useful!
```

---

## Part 12: After the Application

### If You Get the Interview

Prepare to discuss:

1. **Why these weights?** Be ready to justify each dimension
2. **API observations** Walk through your FINDINGS.md
3. **Product suggestions** Discuss RECOMMENDATIONS.md
4. **Technical decisions** Explain architecture choices
5. **Community feedback** What did people say?

### If You Get the Job

This project becomes:

1. Evidence of your working style
2. Potential internal tool/feature
3. Community goodwill
4. Open source contribution

### If You Don't Get the Job

You still have:

1. Portfolio piece
2. Open source project
3. Community connections
4. Deep Crossref knowledge
5. Reusable MCP server

---

## Quick Start Commands

```bash
# 1. Create monorepo
mkdir nexus-score && cd nexus-score
pnpm init
pnpm add -D turbo typescript @types/node

# 2. Create workspace config
echo 'packages:\n  - "packages/*"\n  - "apps/*"' > pnpm-workspace.yaml

# 3. Create core package
mkdir -p packages/core/src
cd packages/core
pnpm init
pnpm add zod
pnpm add -D typescript vitest

# 4. Start building!
```

---

## Final Checklist

Before you start coding, confirm:

- [ ] Crossref API access works (test with curl)
- [ ] Understood rate limit changes (Dec 2025)
- [ ] Have mailto for polite pool
- [ ] Vercel account ready
- [ ] GitHub repo created
- [ ] Time blocked for 4-5 weeks

---

**You're ready. Build something great.** 🚀
