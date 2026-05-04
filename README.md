# Research Nexus Score

<p align="center">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square" alt="AGPL-3.0 License" />
  <a href="https://doi.org/10.5281/zenodo.19217245"><img src="https://zenodo.org/badge/1135634479.svg" alt="DOI" /></a>
</p>

<p align="center">
  <strong>Measure how well your metadata contributes to Crossref's Research Nexus vision.</strong>
</p>

<p align="center">
  <a href="https://nexus-score.vercel.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#scoring-methodology">Methodology</a> •
  <a href="INSIGHTS.md">Insights</a> •
  <a href="#architecture--vision">Architecture</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#citation">Citation</a>
</p>

---

Research Nexus Score evaluates metadata coverage across five dimensions — **Provenance**, **People**, **Organizations**, **Funding**, and **Access** — giving publishers a composite score (0-100) with actionable recommendations for improvement.

Built to support [Crossref's Research Nexus](https://www.crossref.org/documentation/research-nexus/) initiative and aligned with the [Barcelona Declaration on Open Research Information](https://barcelona-declaration.org/).

## Features

- **Publisher Leaderboard**: Rankings for 27,830+ publishers based on metadata coverage
- **Composite Scoring**: Single score (0-100) that captures overall metadata contribution
- **Dimension Breakdown**: Identify strengths and weaknesses across 5 key areas
- **Trend Analysis**: Compare current metadata practices vs historical (backfile)
- **Actionable Recommendations**: Improvement suggestions with links to Crossref documentation
- **Global Rankings**: See where any publisher stands among all Crossref members
- **Gap Fixer**: Local, self-hosted tool that turns a journal article PDF/DOCX into a Research Nexus scorecard plus a Crossref-ready DOI deposit XML. AGPL-3.0, no vendor lock-in, opt-in LLM with per-call USD ledger ([metadata_gapfixer](https://github.com/aadivar/metadata_gapfixer))
- **Journal Nexus**: Journal-level deep analysis — article-by-article metadata coverage, OpenAlex reconciliation, PDF extraction, and metadata trend tracking
- **Institutional Analysis**: Institution-level view of publisher deposit quality — reconciles an institution's output (via OpenAlex) against what reached Crossref, surfacing per-publisher deposit gaps and unmapped publishers
- **MCP Server**: Integrate with Claude Desktop or other AI assistants
- **Core Library**: Use scoring logic in your own applications

## Quick Start

### Web Interface

Visit [nexus-score.vercel.app](https://nexus-score.vercel.app) to search for any Crossref member and view their score.

### MCP Server (for Claude Desktop)

```bash
npx @nexus-score/mcp-server
```

Add to your `claude_desktop_config.json`:

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

### As a Library

```bash
pnpm add @nexus-score/core
```

```typescript
import { CrossrefClient, calculateMemberScore } from '@nexus-score/core';

const client = new CrossrefClient({ mailto: 'your-email@example.com' });
const member = await client.getMember('286'); // Oxford University Press
const score = calculateMemberScore(member);

console.log(score.total);  // 72
console.log(score.grade);  // 'B'
console.log(score.dimensions.provenance.score);  // 18.5
console.log(score.recommendations[0].title);     // 'Increase ORCID Coverage'
```

## Scoring Methodology

### Why this matters in the AI era

Every AI research tool — Consensus, Elicit, Semantic Scholar, OpenAlex, ChatGPT and Claude with search — reads the scholarly record through deposited metadata. A paper isn't "discoverable" in the abstract; it's discoverable through the specific fields a publisher chose to deposit. Missing fields aren't decoration gaps — they're the paper going silent in the one place AI looks.

The five dimensions below aren't arbitrary. Each maps to something an AI system needs to do its job.

The score measures what publishers deposit, not what exists. Most gaps are pipeline problems: the data is upstream — in manuscripts, submission systems, PDFs — but doesn't make it into the deposit. That makes these gaps **fixable**, not structural. The three-layer architecture (Score → Recommend → Gap Fixer) is built around that fact.

**Not an Impact Factor.** Nexus Score is size-independent. A new journal can score A on day one. A three-person university press can outscore Elsevier. What you deposit is what you're judged on — not how much you publish, not how old you are, not who cites you.

### Dimensions (100 points total)

| Dimension | Points | What It Measures | Why AI needs it | In plain English |
|-----------|--------|------------------|-----------------|------------------|
| **Provenance** | 25 | References (15), Update Policies (5), Similarity Check (5) | Trust and traceability of the claim | Where did this paper come from, and can we trust the trail? Did the publisher tell us when it was published, what version this is, what license it's under, and what it cites? Basically — is the paper's paperwork in order. |
| **People** | 20 | ORCID iD Coverage (20) | Unambiguous author attribution | Do we actually know who wrote it? Are the authors real, identified humans with ORCIDs — or just names on a page that could belong to anyone? If two researchers share a name, can we tell them apart? |
| **Organizations** | 15 | Affiliations (5), ROR IDs (10) | Machine-readable institutional links | Do we know where the authors work? Is the university or institution properly identified with a ROR ID, or is it a free-text string like "Dept of Bio, Univ" that no machine can match to anything? |
| **Funding** | 20 | Funder Registry IDs (10), Award Numbers (10) | Investment traceability for funders | Who paid for this research, and can we follow the money? Is the funder identified with a registry ID? Is the grant number there? Without this, you can't answer basic questions like "what did the NIH's $40B actually produce?" |
| **Access** | 20 | Licenses (7), Full-text Links (7), Abstracts (6) | Whether AI can legally read and ingest the work | Can anyone actually read it? Is the full text open, or paywalled? Is there a license that tells AI tools whether they're allowed to use it? If a paper exists but no one can access it, it may as well not exist for AI discovery. |

### Grading Scale

| Grade | Score Range | Description |
|-------|-------------|-------------|
| **A** | 80-100 | Excellent metadata coverage |
| **B** | 65-79 | Good coverage with room for improvement |
| **C** | 50-64 | Adequate coverage but with significant gaps |
| **D** | 35-49 | Needs substantial work across multiple dimensions |
| **F** | 0-34 | Poor metadata coverage requiring attention |

### Data Source

Scores use pre-computed coverage statistics from the [Crossref /members API](https://api.crossref.org/swagger-ui/index.html#/Members). These statistics are calculated daily by Crossref and represent the percentage of works containing each metadata element.

- **Current**: Works published in the last 2 calendar years
- **Backfile**: Older works in the archive

## Project Structure

```
nexus-score/
├── apps/
│   ├── web/                  # Next.js 16 web application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── leaderboard/        # 27,830-publisher rankings + filters
│   │   │   │   ├── member/[id]/        # Per-publisher score card + radar
│   │   │   │   ├── analysis/
│   │   │   │   │   └── institution/    # Institutional deposit-gap analytics (v0.1.1)
│   │   │   │   └── api/                # Search, member, leaderboard, analyze-institution
│   │   │   └── components/             # Radar, score card, gap tables, blind spots
│   │   ├── scripts/          # Leaderboard generation scripts
│   │   └── data/             # Cached leaderboard data (27,830 publishers)
│   ├── gap-fixer/            # Metadata recovery tool
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── enrichers/  # OpenAlex, ORCID, ROR clients
│   │   │   │   ├── parsers/    # Gap report CSV parser
│   │   │   │   └── scoring/    # Confidence scoring
│   │   │   └── components/   # Upload & analysis UI
│   │   └── README.md
│   └── journal-nexus/        # Journal-level deep analysis
│       └── src/
│           ├── app/
│           │   └── api/      # Enrich, trends, PDF extraction endpoints
│           └── components/   # Score card, trends, reconciliation, PDF modal
├── packages/
│   ├── core/                 # Scoring library (@nexus-score/core)
│   │   ├── src/
│   │   │   ├── crossref/     # Crossref API client
│   │   │   └── scoring/      # Score calculation logic
│   │   └── package.json
│   └── mcp-server/           # MCP server (@nexus-score/mcp-server)
│       └── src/
├── package.json              # Root workspace config
├── turbo.json                # Turborepo configuration
└── pnpm-workspace.yaml       # pnpm workspace definition
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/aadivar/nexus-score.git
cd nexus-score

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
CROSSREF_MAILTO=your-email@example.com
```

Using your email enables access to Crossref's polite pool for better rate limits.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm test` | Run tests |
| `pnpm mcp` | Start MCP server in development mode |

### Regenerating the Leaderboard

The leaderboard data is pre-computed from all 31,000+ Crossref members:

```bash
cd apps/web
pnpm generate-leaderboard
```

This fetches all members, calculates scores, and saves to `data/leaderboard.json`.

**Automated Updates**: A GitHub Actions workflow runs biweekly (1st and 15th of each month) to automatically update the leaderboard data. You can also trigger it manually from the Actions tab.

## Why Research Nexus Score?

### The Problem

Publishers register metadata with Crossref, but there's no easy way to understand:
- How complete is my metadata compared to peers?
- Which areas need the most improvement?
- Am I getting better or worse over time?

### The Solution

Research Nexus Score provides:
1. **Visibility**: See exactly where you stand among 27,830+ publishers
2. **Actionability**: Get specific recommendations with documentation links
3. **Benchmarking**: Compare against industry leaders and peers
4. **Trends**: Track improvement over time (current vs backfile)

### Barcelona Declaration Alignment

Research Nexus Score supports the [Barcelona Declaration on Open Research Information](https://barcelona-declaration.org/) by:

- Making metadata coverage visible and comparable
- Encouraging adoption of persistent identifiers (ORCID, ROR)
- Promoting transparency in funding acknowledgements
- Supporting FAIR principles for metadata

## Journal Nexus

Journal Nexus goes deeper than the leaderboard — it analyzes a journal article-by-article to show exactly where metadata gaps are, what's recoverable, and how quality trends over time.

### How It Works

1. **Search** for any journal by ISSN or title
2. **Score** — see the journal's Nexus Score with dimension breakdown and recommendations
3. **Trends** — metadata coverage by month, broken down by content type, with automated insights
4. **Article Analysis** — every article checked against Crossref, then reconciled with OpenAlex to show what's missing vs what's recoverable
5. **PDF Extraction** — for articles with the biggest gaps, extract metadata directly from the PDF (authors, ORCIDs, affiliations, funding, references)
6. **Impact Summary** — exportable report showing recovery potential and before/after score projections

### Key Finding

Most metadata gaps are **pipeline problems, not content problems**. The data exists upstream — in submission systems, in OpenAlex, in the PDFs themselves — it just doesn't make it into the Crossref deposit. Journal Nexus makes that visible at the article level.

## Gap Fixer

Once you know what metadata is missing, Gap Fixer helps you recover it — one paper at a time, with every paid LLM call metered in USD and gated behind an explicit editor click.

> **Pilot is open.** Self-hosted, AGPL-3.0, no vendor lock-in. **$1/article — sustenance pricing only**, to keep the project alive. The software is and stays free under AGPL; you can self-host the entire pipeline at zero per-article cost forever. Email <varma2friend@gmail.com> to book a demo or apply.

The tool lives in its own repository: **<https://github.com/aadivar/metadata_gapfixer>**.

### How It Works

Upload a single journal article PDF/DOCX. The pipeline produces a Research Nexus scorecard (using the same weights as this project) plus a Crossref-ready DOI deposit XML.

Five layers, each layered on the one below. Costs are transparent and the LLM is never called automatically:

| Layer | What | Cost | Trigger |
|---|---|---|---|
| **L0 · Docling layout** | PDF/DOCX → structured JSON, per-element bboxes, page renders | $0 | Always |
| **L1 · Deterministic factsheet** | Regex sweep (DOI / ORCID / ROR / ISSN / arXiv / license / grant) + PDF /Info + header parser + boilerplate anchors (funding, CoI, data availability, ethics) | $0 | Always |
| **L2 · Free identifier APIs** | ORCID public · ROR v2 · OpenAlex · Crossref REST. Affiliation normalisation + ROR clear-winner auto-accept | $0 | Auto-fix click |
| **L3 · LLM picker** | Per-field structured-output call that picks among API-returned candidates with reasoning + confidence | ~$0.0002/call | Per-field "Adjudicate with AI" |
| **L4 · LLM structurer** | Five named tasks (`structure_authors`, `structure_references`, `structure_funding`, `structure_credit`, `verify_authors`) that take a content region and return a clean structured record | ~$0.0003 – $0.013/call | Per-field "Identify on document" |
| **Side · GLiNER2 NER** | On-device zero-shot NER (`fastino/gliner2-large-v1`) for ad-hoc entity extraction over a chosen text region — no network, no LLM cost | $0 | On demand |

For a typical paper, full premium processing tops out around **$0.025**. Standard auto-fix (no LLM) is **$0**. Every paid call is recorded in a per-submission USD ledger.

### Recoverable fields

| Field | Sources |
|---|---|
| Authors (full names) | L1 header parser, L4 `structure_authors` |
| ORCID iDs | L1 regex, L2 ORCID API + name-swap fallback, L3 picker |
| Affiliations | L1 header marker map, L2 ORCID/OpenAlex, L4 structurer |
| ROR IDs | L2 ROR v2 with comma-delete normalisation + clear-winner auto-accept |
| Funder Registry IDs | L1 grant patterns, L2 OpenAlex/Crossref, L4 `structure_funding` |
| Award/grant numbers | L1 regex, L4 `structure_funding` |
| References | L1 + three-tier references-section detector, L2 OpenAlex/Crossref, L4 `structure_references` |
| Abstracts | L0 Docling, L2 OpenAlex |
| Licenses | L1 license patterns, L2 OpenAlex/Crossref |
| CRediT contributor roles | L4 `structure_credit` |

**No fabrication.** The LLM is constrained by structured outputs and explicit candidate lists. ORCIDs, DOIs, RORs, ISSNs come from APIs or PDF text — never invented. The `verify_authors` structurer also receives the paper's title, abstract excerpt, and OpenAlex concepts so it can reject candidates whose research domain doesn't match.

### Self-host it

```bash
git clone https://github.com/aadivar/metadata_gapfixer
cd metadata_gapfixer
cp .env.example .env                # edit OPENAI_API_KEY + CONTACT_EMAIL
docker compose up -d --build
```

Open <http://localhost:3000>. The LLM router is OpenAI-compatible — point it at OpenAI, OpenRouter, Anthropic-compat, Groq, Ollama, or LiteLLM. Storage is plain disk; swap to S3/Postgres without touching app code. See the [metadata_gapfixer README](https://github.com/aadivar/metadata_gapfixer#readme) for full docs.

## Architecture & Vision

```mermaid
graph TB
    subgraph DATA ["Data Sources"]
        CR["Crossref API<br/><i>31,000+ members</i>"]
        OA["OpenAlex"]
        ORCID["ORCID API"]
        ROR["ROR API"]
        PDF["PDF Layout<br/><i>Docling + GLiNER2 NER + opt-in LLM</i>"]
    end

    subgraph CORE ["@nexus-score/core"]
        SCORE["Scoring Engine<br/><i>5 dimensions, 100 pts</i>"]
        GRADE["Grading & Recommendations"]
    end

    subgraph APPS ["Applications"]
        WEB["Web App<br/><i>Leaderboard · Insights · Content-Type Filters</i>"]
        JN["Journal Nexus<br/><i>Article-level analysis · Trends · PDF extraction</i>"]
        GF["Gap Fixer<br/><i>Upload gap CSV → recover metadata</i>"]
        MCP["MCP Server<br/><i>AI assistant integration</i>"]
    end

    subgraph ENRICHERS ["Pluggable Enrichers 🔌"]
        direction LR
        E1["OpenAlex<br/>Enricher"]
        E2["ORCID<br/>Enricher"]
        E3["ROR<br/>Enricher"]
        E4["PDF<br/>Enricher"]
        E5["Your Own<br/>Enricher"]
    end

    subgraph PLANNED ["Planned"]
        API["Publisher API<br/><i>REST access to scores</i>"]
        BATCH["Batch Recovery<br/><i>Bulk Crossref-ready exports</i>"]
        TREND["Trend Tracking<br/><i>Score history over time</i>"]
        BENCH["Community Benchmarks<br/><i>Peer group comparisons</i>"]
    end

    CR --> SCORE
    SCORE --> GRADE
    GRADE --> WEB
    GRADE --> JN
    GRADE --> MCP
    GRADE --> API

    CR -->|"Gap Reports"| GF
    CR -->|"Per-journal works"| JN
    OA -->|"Reconciliation"| JN
    PDF -->|"Full-text extraction"| JN
    GF --> ENRICHERS
    OA --> E1
    ORCID --> E2
    ROR --> E3
    PDF --> E4
    ENRICHERS -->|"Recovered metadata"| GF

    SCORE --> TREND
    WEB --> BENCH
    GF --> BATCH

    style DATA fill:#e8f4f8,stroke:#2980b9,color:#000
    style CORE fill:#eafaf1,stroke:#27ae60,color:#000
    style APPS fill:#fef9e7,stroke:#f39c12,color:#000
    style ENRICHERS fill:#f4ecf7,stroke:#8e44ad,color:#000
    style PLANNED fill:#fbeee6,stroke:#e67e22,color:#000
    style E5 stroke-dasharray: 5 5
    style API stroke-dasharray: 5 5
    style BATCH stroke-dasharray: 5 5
    style TREND stroke-dasharray: 5 5
    style BENCH stroke-dasharray: 5 5
```

> **Solid boxes** = shipped. **Dashed boxes** = planned. The pluggable enricher layer (purple) is the key extensibility point — anyone can add their own metadata source.

## Roadmap

| Phase | What | Status |
|-------|------|--------|
| **Scoring** | Publisher leaderboard with 27,830+ members, composite scoring, grading | Done |
| **Gap Fixer** | Recover missing metadata from OpenAlex, ORCID, ROR, and PDF extraction | Done |
| **Journal Nexus** | Journal-level article analysis — article-by-article metadata coverage, OpenAlex reconciliation, metadata trends, and PDF full-text extraction | In progress — evaluating with publishers |
| **Content-Type Filtering** | Filter leaderboard and insights by content type (journal-article, book-chapter, etc.) | Done |
| **Pluggable Enrichers** | Modular metadata recovery — plug in any source (OpenAlex, ORCID, ROR, PDF extraction, or your own) to fill gaps your way | In progress |
| **Publisher API** | REST API for programmatic access to scores and gap reports | Planned |
| **Batch Recovery** | Bulk metadata recovery with Crossref-ready export files | Planned |
| **Trend Tracking** | Historical score tracking — see improvement over time per publisher | Planned |
| **Community Benchmarks** | Peer group comparisons by size, discipline, and region | Planned |

### Pluggable Architecture

Gap Fixer recovers missing metadata (ORCIDs, funders, affiliations, abstracts, references) by pulling from multiple sources — OpenAlex, ORCID, ROR, and PDF extraction. Each source is an independent enricher module. Publishers and infrastructure providers can plug in their own sources or swap extraction backends to fit their workflow — no lock-in to any single provider.

**Built-in enrichers:**
- [Docling](https://github.com/docling-project/docling) — local PDF/DOCX layout extraction (structured JSON, bboxes, page renders) at $0
- Deterministic factsheet — regex sweep for DOI / ORCID / ROR / ISSN / arXiv / license / grant patterns + boilerplate anchors
- [OpenAlex](https://openalex.org/) — ORCIDs, ROR IDs, affiliations, references, abstracts, funders
- [ORCID public API](https://info.orcid.org/documentation/api-tutorials/) — author identity validation with name-swap fallback
- [ROR v2](https://ror.org/about/) — organization identifier matching with clear-winner auto-accept
- [Crossref REST](https://api.crossref.org/) — existing-record diff for safe updates
- [GLiNER2](https://huggingface.co/fastino/gliner2-large-v1) — on-device zero-shot NER for ad-hoc entity extraction (no network, no LLM cost)
- OpenAI-compatible LLM router (opt-in, per-call USD ledger) — works with OpenAI, OpenRouter, Anthropic-compat, Groq, Ollama, LiteLLM

**On the radar:**
- GROBID fallback for OCR-only / scanned PDFs
- Local ROR / ORCID daily snapshot for air-gapped publishers
- XSD validation against Crossref schema 5.4.0 + direct deposit API integration

The goal: metadata gaps are a pipeline problem, not a discipline problem. With pluggable enrichers, anyone can recover what's missing using the sources that work best for them. Everything is open source and AGPL-3.0-licensed — contributions and sponsors welcome.

Have ideas? [Open an issue](https://github.com/aadivar/nexus-score/issues) or jump into the conversation on [LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7441758924527222784/).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Monorepo**: [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **MCP**: [Model Context Protocol SDK](https://modelcontextprotocol.io/)
- **Data**: [Crossref REST API](https://api.crossref.org/)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Ideas

- Add new scoring dimensions or metrics
- Improve the UI/UX of the web application
- Add more MCP tools for AI integrations
- Write documentation or tutorials
- Report bugs or suggest features

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Crossref](https://www.crossref.org/) for the REST API and metadata standards
- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP SDK
- The scholarly communication community for feedback and inspiration

## Citation

If you use or mention Research Nexus Score in your work, please cite it as:

```bibtex
@software{nexus_score,
  author       = {Varma D., Aadinarayana},
  title        = {Research Nexus Score: Metadata Coverage Scoring for Crossref Members},
  year         = {2025},
  doi          = {10.5281/zenodo.19217245},
  url          = {https://doi.org/10.5281/zenodo.19217245},
  note         = {Open-source tool for evaluating publisher metadata quality}
}
```

Or in text:

> Varma D., A. (2025). *Research Nexus Score: Metadata Coverage Scoring for Crossref Members*. https://doi.org/10.5281/zenodo.19217245

## Author

**Aadi Narayana Varma**

- LinkedIn: [@aadi-narayana-varma-dantuluri](https://www.linkedin.com/in/aadi-narayana-varma-dantuluri-62332b105/)
- GitHub: [@aadivar](https://github.com/aadivar)
- Email: varma2friend@gmail.com

---

<p align="center">
  <sub>Built with care for the open research community</sub>
</p>
