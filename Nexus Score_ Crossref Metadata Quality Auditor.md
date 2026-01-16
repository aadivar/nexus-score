# **Nexus Score: Crossref Metadata Quality Auditor**

## **Web Application for Measuring Research Nexus Connectivity**

A Next.js application that helps Crossref members visualize and improve their contribution to the Research Nexus vision.

**Live Demo:** `nexus-score.vercel.app` (target)

---

## **Why a Web App \> CLI**

| Aspect | CLI | Web App |
| ----- | ----- | ----- |
| Shareability | Limited | URL sharing, social previews |
| Visualization | ASCII charts | Interactive D3/Recharts |
| Accessibility | Developers only | Anyone can use |
| Portfolio impact | Moderate | High \- shows full-stack skills |
| Crossref team demo | Screenshot | Live link |
| Community adoption | pip install | Just visit URL |

---

## **Application Overview**

### **Landing Page**

┌─────────────────────────────────────────────────────────────────┐  
│  🔗 Nexus Score                                    \[GitHub\] \[About\]│  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│         Measure your contribution to the                        │  
│              Research Nexus                                     │  
│                                                                 │  
│    ┌─────────────────────────────────────────────────────┐     │  
│    │  🔍  Search publisher, journal, or DOI prefix...    │     │  
│    └─────────────────────────────────────────────────────┘     │  
│                                                                 │  
│    Popular:  \[Nature\] \[Elsevier\] \[PLOS\] \[Springer\] \[Wiley\]     │  
│                                                                 │  
│    ─────────────────────────────────────────────────────────   │  
│                                                                 │  
│    📊 What is Nexus Score?                                      │  
│                                                                 │  
│    Crossref's Research Nexus vision connects research           │  
│    objects, people, organizations, and funding. Nexus Score     │  
│    measures how well your metadata enables these connections.   │  
│                                                                 │  
│    \[Learn More →\]                                               │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

### **Member Dashboard (`/member/[id]`)**

┌─────────────────────────────────────────────────────────────────┐  
│  🔗 Nexus Score    \[Search...\]                     \[Compare\] \[API\]│  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  Oxford University Press                              \[Share 🔗\]│  
│  Member ID: 286 · 245,892 works · Since 1996                    │  
│                                                                 │  
│  ┌────────────────────────────────────────────────────────────┐ │  
│  │                                                            │ │  
│  │              NEXUS SCORE                                   │ │  
│  │                                                            │ │  
│  │                  72                                        │ │  
│  │              ───────────                                   │ │  
│  │                 /100                                       │ │  
│  │                                                            │ │  
│  │         \[═══════════════════░░░░░░░░\]                     │ │  
│  │                                                            │ │  
│  │         ↑ \+8 from last year                               │ │  
│  │                                                            │ │  
│  └────────────────────────────────────────────────────────────┘ │  
│                                                                 │  
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │  
│  │PROVENANCE│  PEOPLE  │   ORGS   │ FUNDING  │  ACCESS  │      │  
│  │    85    │    68    │    54    │    62    │    78    │      │  
│  │ ████████ │ ██████░░ │ █████░░░ │ ██████░░ │ ███████░ │      │  
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐  
│  📈 Detailed Breakdown                              \[Current ▼\] │  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  PROVENANCE (85/100)                                           │  
│  ├── References present         94.2%  ████████████████████░   │  
│  ├── References with DOIs       67.8%  █████████████░░░░░░░░   │  
│  └── Relationships defined      12.3%  ██░░░░░░░░░░░░░░░░░░░   │  
│                                                                 │  
│  PEOPLE (68/100)                                               │  
│  ├── ORCID coverage            45.2%  █████████░░░░░░░░░░░░   │  
│  ├── Avg ORCIDs per work        1.8                            │  
│  └── Full ORCID coverage       23.1%  ████░░░░░░░░░░░░░░░░░   │  
│                                                                 │  
│  ... (expandable sections)                                      │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐  
│  🎯 Recommendations                                             │  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  ┌─────────────────────────────────────────────────────────┐   │  
│  │ 🔴 HIGH IMPACT                                          │   │  
│  │                                                          │   │  
│  │ Increase ORCID coverage                                  │   │  
│  │ Current: 45% → Target: 80%                              │   │  
│  │ Potential: \+15 points                                    │   │  
│  │                                                          │   │  
│  │ \[How to improve →\]                                       │   │  
│  └─────────────────────────────────────────────────────────┘   │  
│                                                                 │  
│  ┌─────────────────────────────────────────────────────────┐   │  
│  │ 🟡 QUICK WIN                                            │   │  
│  │                                                          │   │  
│  │ Add ROR IDs to affiliations                             │   │  
│  │ Current: 31% → Target: 60%                              │   │  
│  │ Potential: \+8 points                                     │   │  
│  │                                                          │   │  
│  │ \[How to improve →\]                                       │   │  
│  └─────────────────────────────────────────────────────────┘   │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐  
│  📚 Journal Breakdown                          \[View All (142)\]│  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  Journal                          Score    Trend    Works      │  
│  ─────────────────────────────────────────────────────────────  │  
│  Nucleic Acids Research            89      ↑ \+5     12,453     │  
│  Brain                             76      ↑ \+3      8,234     │  
│  Monthly Notices of the RAS        71      → 0       6,892     │  
│  ...                                                            │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐  
│  📊 Historical Trend                                           │  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│   Score                                                         │  
│    80 │                                          ●              │  
│       │                                    ●────●               │  
│    70 │                              ●────●                     │  
│       │                        ●────●                           │  
│    60 │                  ●────●                                 │  
│       │            ●────●                                       │  
│    50 │      ●────●                                            │  
│       │                                                         │  
│       └─────────────────────────────────────────────────────   │  
│         2020   2021   2022   2023   2024   2025   2026         │  
│                                                                 │  
│   \[Backfile\]  \[Current\]  \[All Time\]                            │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

### **Compare Page (`/compare`)**

┌─────────────────────────────────────────────────────────────────┐  
│  🔗 Nexus Score    \[Search...\]                     \[Compare\] \[API\]│  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  Compare Publishers                                             │  
│                                                                 │  
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │  
│  │ Oxford UP       │ │ \+ Add publisher │ │ \+ Add publisher │   │  
│  │ Score: 72       │ │                 │ │                 │   │  
│  │ \[Remove\]        │ │                 │ │                 │   │  
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │  
│                                                                 │  
│  ┌────────────────────────────────────────────────────────────┐ │  
│  │                    RADAR COMPARISON                        │ │  
│  │                                                            │ │  
│  │                     Provenance                             │ │  
│  │                         ▲                                  │ │  
│  │                        /│\\                                 │ │  
│  │                       / │ \\                                │ │  
│  │           Access ────●──┼──●──── People                   │ │  
│  │                       \\ │ /                                │ │  
│  │                        \\│/                                 │ │  
│  │                         ▼                                  │ │  
│  │            Funding ◄─────────► Organizations               │ │  
│  │                                                            │ │  
│  │           ── Oxford UP  ── Elsevier  ── PLOS              │ │  
│  │                                                            │ │  
│  └────────────────────────────────────────────────────────────┘ │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

### **Journal Page (`/journal/[issn]`)**

┌─────────────────────────────────────────────────────────────────┐  
│  🔗 Nexus Score                                                 │  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  Nature                                               \[Share 🔗\]│  
│  ISSN: 0028-0836 · Publisher: Springer Nature                   │  
│  12,453 works analyzed                                          │  
│                                                                 │  
│              NEXUS SCORE: 84/100                                │  
│                                                                 │  
│  ... (similar layout to member page)                            │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

### **Leaderboard Page (`/leaderboard`)**

┌─────────────────────────────────────────────────────────────────┐  
│  🔗 Nexus Score                                                 │  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  🏆 Top Publishers by Nexus Score                              │  
│                                                                 │  
│  Filter: \[All ▼\]  \[\>10k works ▼\]  \[2026 ▼\]                     │  
│                                                                 │  
│  \#   Publisher                    Score   Trend   Works        │  
│  ─────────────────────────────────────────────────────────────  │  
│  1   PLOS                          91     ↑ \+2    298,234      │  
│  2   eLife Sciences                89     ↑ \+4     42,123      │  
│  3   Frontiers Media               87     ↑ \+6    892,234      │  
│  4   MDPI                          85     ↑ \+3  1,234,567      │  
│  5   Oxford University Press       84     ↑ \+5    245,892      │  
│  ...                                                            │  
│                                                                 │  
│  🌍 Filter by Region: \[Global ▼\]                               │  
│                                                                 │  
│  📈 Most Improved (Year over Year)                             │  
│  ─────────────────────────────────────────────────────────────  │  
│  1   University of Chitral         \+32    (was 24, now 56\)     │  
│  2   Nigerian Publisher X          \+28                          │  
│  ...                                                            │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘

---

## **Tech Stack**

┌─────────────────────────────────────────────────────────────────┐  
│                        FRONTEND                                 │  
├─────────────────────────────────────────────────────────────────┤  
│  Next.js 14 (App Router)                                        │  
│  ├── TypeScript                                                 │  
│  ├── Tailwind CSS                                               │  
│  ├── shadcn/ui components                                       │  
│  ├── Recharts (charts)                                          │  
│  ├── Framer Motion (animations)                                 │  
│  └── nuqs (URL state management)                                │  
└─────────────────────────────────────────────────────────────────┘  
                              │  
                              ▼  
┌─────────────────────────────────────────────────────────────────┐  
│                      API LAYER                                  │  
├─────────────────────────────────────────────────────────────────┤  
│  Next.js API Routes (Route Handlers)                            │  
│  ├── /api/member/\[id\]         → Member score                    │  
│  ├── /api/journal/\[issn\]      → Journal score                   │  
│  ├── /api/search              → Search members/journals         │  
│  ├── /api/compare             → Multi-member comparison         │  
│  └── /api/leaderboard         → Top publishers                  │  
│                                                                 │  
│  Caching Strategy:                                              │  
│  ├── Vercel KV (Redis) for computed scores                      │  
│  ├── ISR for leaderboard (revalidate: 24h)                      │  
│  └── Client-side SWR for real-time queries                      │  
└─────────────────────────────────────────────────────────────────┘  
                              │  
                              ▼  
┌─────────────────────────────────────────────────────────────────┐  
│                    CROSSREF API                                 │  
├─────────────────────────────────────────────────────────────────┤  
│  https://api.crossref.org/                                      │  
│  ├── /members/{id}            → Coverage stats (pre-computed)   │  
│  ├── /members/{id}/works      → Sample for deep analysis        │  
│  ├── /journals/{issn}         → Journal info                    │  
│  └── /works?sample=N          → Random sampling                 │  
└─────────────────────────────────────────────────────────────────┘

### **Key Dependencies**

{  
  "dependencies": {  
    "next": "14.x",  
    "@tanstack/react-query": "^5.0.0",  
    "recharts": "^2.10.0",  
    "@radix-ui/react-\*": "latest",  
    "tailwindcss": "^3.4.0",  
    "class-variance-authority": "^0.7.0",  
    "lucide-react": "^0.300.0",  
    "nuqs": "^1.17.0",  
    "zod": "^3.22.0"  
  }  
}

---

## **Project Structure**

nexus-score/  
├── app/  
│   ├── layout.tsx  
│   ├── page.tsx                    \# Landing/search  
│   ├── member/  
│   │   └── \[id\]/  
│   │       └── page.tsx            \# Member dashboard  
│   ├── journal/  
│   │   └── \[issn\]/  
│   │       └── page.tsx            \# Journal dashboard  
│   ├── compare/  
│   │   └── page.tsx                \# Comparison tool  
│   ├── leaderboard/  
│   │   └── page.tsx                \# Top publishers  
│   ├── about/  
│   │   └── page.tsx                \# Methodology explanation  
│   └── api/  
│       ├── member/  
│       │   └── \[id\]/  
│       │       └── route.ts  
│       ├── journal/  
│       │   └── \[issn\]/  
│       │       └── route.ts  
│       ├── search/  
│       │   └── route.ts  
│       └── leaderboard/  
│           └── route.ts  
│  
├── components/  
│   ├── ui/                         \# shadcn components  
│   ├── nexus-score-card.tsx  
│   ├── dimension-breakdown.tsx  
│   ├── radar-chart.tsx  
│   ├── trend-chart.tsx  
│   ├── recommendations-panel.tsx  
│   ├── journal-table.tsx  
│   ├── search-input.tsx  
│   └── comparison-selector.tsx  
│  
├── lib/  
│   ├── crossref/  
│   │   ├── client.ts               \# API client  
│   │   ├── types.ts                \# TypeScript types  
│   │   └── transform.ts            \# Response transformers  
│   ├── scoring/  
│   │   ├── calculator.ts           \# Score algorithm  
│   │   ├── dimensions.ts           \# Dimension definitions  
│   │   └── recommendations.ts      \# Recommendation engine  
│   └── utils.ts  
│  
├── public/  
│   ├── og-image.png                \# Social preview  
│   └── methodology.pdf             \# Downloadable docs  
│  
├── docs/  
│   ├── METHODOLOGY.md  
│   ├── API\_FINDINGS.md             \# ⭐ Your interview portfolio  
│   └── RECOMMENDATIONS.md          \# ⭐ Suggestions for Crossref  
│  
└── tests/  
    └── ...

---

## **Key Features**

### **1\. Smart Search with Autocomplete**

// Debounced search against Crossref members API  
const searchMembers \= async (query: string) \=\> {  
  const res \= await fetch(  
    \`https://api.crossref.org/members?query=${query}\&rows=10\`  
  );  
  return res.json();  
};

### **2\. Real-time Score Calculation**

// Most data comes pre-computed from /members/{id}  
interface MemberCoverage {  
  'abstracts-current': number;  
  'abstracts-backfile': number;  
  'orcids-current': number;  
  'references-current': number;  
  'ror-ids-current': number;  
  'funders-current': number;  
  'award-numbers-current': number;  
  'licenses-current': number;  
  'resource-links-current': number;  
  'similarity-checking-current': number;  
  'update-policies-current': number;  
}

// Single API call gives us everything we need  
const getMemberScore \= async (memberId: string) \=\> {  
  const res \= await fetch(\`https://api.crossref.org/members/${memberId}\`);  
  const data \= await res.json();  
  return calculateNexusScore(data.message);  
};

### **3\. Shareable URLs**

nexus-score.vercel.app/member/286           \# Oxford UP  
nexus-score.vercel.app/journal/0028-0836    \# Nature  
nexus-score.vercel.app/compare?ids=286,78,297

### **4\. Social Preview Cards**

// Dynamic OG images with Nexus Score  
export async function generateMetadata({ params }) {  
  const score \= await getMemberScore(params.id);  
  return {  
    openGraph: {  
      images: \[\`/api/og?member=${params.id}\&score=${score.total}\`\],  
    },  
  };  
}

### **5\. Export Options**

* Download report as PDF  
* Export data as JSON  
* Copy shareable link  
* Embed badge for websites

---

## **Scoring Algorithm (Same as Before)**

interface NexusScore {  
  total: number;           // 0-100  
  dimensions: {  
    provenance: number;    // 0-25  
    people: number;        // 0-20  
    organizations: number; // 0-15  
    funding: number;       // 0-20  
    access: number;        // 0-20  
  };  
  trend: 'up' | 'down' | 'stable';  
  recommendations: Recommendation\[\];  
}

function calculateNexusScore(member: CrossrefMember): NexusScore {  
  const c \= member.coverage;  
    
  const provenance \= Math.round(  
    (c\['references-current'\] || 0\) \* 20 \+  
    (c\['update-policies-current'\] || 0\) \* 5  
  );  
    
  const people \= Math.round(  
    (c\['orcids-current'\] || 0\) \* 20  
  );  
    
  const organizations \= Math.round(  
    (c\['affiliations-current'\] || 0\) \* 5 \+  
    (c\['ror-ids-current'\] || 0\) \* 10  
  );  
    
  const funding \= Math.round(  
    (c\['funders-current'\] || 0\) \* 10 \+  
    (c\['award-numbers-current'\] || 0\) \* 10  
  );  
    
  const access \= Math.round(  
    (c\['licenses-current'\] || 0\) \* 7 \+  
    (c\['resource-links-current'\] || 0\) \* 7 \+  
    (c\['similarity-checking-current'\] || 0\) \* 6  
  );  
    
  return {  
    total: provenance \+ people \+ organizations \+ funding \+ access,  
    dimensions: { provenance, people, organizations, funding, access },  
    trend: calculateTrend(c),  
    recommendations: generateRecommendations(c),  
  };  
}

---

## **Development Timeline**

### **Week 1: Foundation**

* \[ \] Next.js project setup with TypeScript  
* \[ \] Crossref API client with types  
* \[ \] Basic score calculation  
* \[ \] Landing page with search  
* \[ \] Member page (basic)

### **Week 2: Core Features**

* \[ \] Full member dashboard UI  
* \[ \] Dimension breakdown components  
* \[ \] Recommendations panel  
* \[ \] Journal breakdown table  
* \[ \] Trend charts with Recharts

### **Week 3: Advanced Features**

* \[ \] Compare page with radar chart  
* \[ \] Leaderboard with filters  
* \[ \] Journal individual pages  
* \[ \] Social preview (OG images)  
* \[ \] Share/export functionality

### **Week 4: Polish & Deploy**

* \[ \] Loading states & error handling  
* \[ \] Mobile responsiveness  
* \[ \] SEO optimization  
* \[ \] Vercel deployment  
* \[ \] Custom domain setup

### **Week 5: Documentation**

* \[ \] README with screenshots  
* \[ \] METHODOLOGY.md  
* \[ \] API\_FINDINGS.md ⭐  
* \[ \] RECOMMENDATIONS.md ⭐  
* \[ \] About page content

### **Week 6: Launch**

* \[ \] Crossref Community Forum post  
* \[ \] Twitter/LinkedIn announcement  
* \[ \] Submit to Hacker News  
* \[ \] Email to Patricia Feeney (hiring manager)

---

## **Deployment**

\# Deploy to Vercel  
vercel

\# Environment variables  
CROSSREF\_MAILTO=your-email@example.com  \# Polite pool access  
KV\_REST\_API\_URL=...                      \# Optional: caching  
KV\_REST\_API\_TOKEN=...

### **Caching Strategy**

// Cache member scores for 24 hours  
// Crossref updates coverage stats daily  
export const revalidate \= 86400;

// Or use Vercel KV for more control  
import { kv } from '@vercel/kv';

async function getMemberScore(id: string) {  
  const cached \= await kv.get(\`score:${id}\`);  
  if (cached) return cached;  
    
  const score \= await calculateFromAPI(id);  
  await kv.set(\`score:${id}\`, score, { ex: 86400 });  
  return score;  
}

---

## **Differentiators from Participation Reports**

| Participation Reports | Nexus Score |
| ----- | ----- |
| Shows % presence | Shows connectivity score |
| Member-only view | Public comparison tool |
| Table format | Visual dashboard |
| No recommendations | Actionable suggestions |
| No trends | Historical tracking |
| No social sharing | Shareable URLs & badges |
| No leaderboard | Community rankings |

---

## **Portfolio Value**

### **For the Job Application**

1. **Live Demo** \- Send `nexus-score.vercel.app/member/286` in your cover letter  
2. **GitHub Repo** \- Shows code quality, architecture decisions  
3. **API\_FINDINGS.md** \- Direct evidence of JSON modeling understanding  
4. **Community Post** \- Engagement with Crossref community

### **What It Demonstrates**

* ✅ Deep understanding of Crossref API and metadata  
* ✅ JSON modeling awareness (TypeScript types)  
* ✅ Product thinking (features that help members)  
* ✅ Community orientation (open source, shareable)  
* ✅ Technical execution (full-stack implementation)  
* ✅ Research Nexus vision alignment

---

## **MCP Server (Bonus)**

Also expose as MCP server for AI assistants:

// mcp-server/index.ts  
import { FastMCP } from 'fastmcp';

const mcp \= new FastMCP('nexus-score');

mcp.tool('get\_nexus\_score', {  
  description: 'Get Nexus Score for a Crossref member',  
  parameters: {  
    member\_id: { type: 'string', description: 'Crossref member ID' }  
  },  
  handler: async ({ member\_id }) \=\> {  
    const score \= await getMemberScore(member\_id);  
    return JSON.stringify(score);  
  }  
});

mcp.tool('compare\_publishers', {  
  description: 'Compare Nexus Scores between publishers',  
  parameters: {  
    member\_ids: { type: 'array', items: { type: 'string' } }  
  },  
  handler: async ({ member\_ids }) \=\> {  
    const scores \= await Promise.all(member\_ids.map(getMemberScore));  
    return JSON.stringify(scores);  
  }  
});

This lets Claude/ChatGPT users query metadata quality directly\!

---

## **Getting Started**

\# Create project  
npx create-next-app@latest nexus-score \--typescript \--tailwind \--app

\# Add dependencies  
npm install @tanstack/react-query recharts lucide-react zod

\# Add shadcn/ui  
npx shadcn-ui@latest init  
npx shadcn-ui@latest add card button input tabs

\# Start developing  
npm run dev

---

## **Success Metrics**

| Metric | Target | Why It Matters |
| ----- | ----- | ----- |
| Vercel visits | 500+ first month | Shows traction |
| GitHub stars | 100+ | Community validation |
| Forum engagement | 20+ replies | Crossref team visibility |
| Twitter shares | 50+ | Viral potential |
| Crossref mention | Blog/tweet | Direct impact |

---

Ready to start building\! 🚀

