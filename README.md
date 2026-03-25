# Research Nexus Score

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Turborepo-2.7-purple?style=flat-square&logo=turborepo" alt="Turborepo" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
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
- **Gap Fixer**: Recover missing metadata from Crossref Participation Reports using open data sources
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

### Dimensions (100 points total)

| Dimension | Points | What It Measures |
|-----------|--------|------------------|
| **Provenance** | 25 | References (15), Update Policies (5), Similarity Check (5) |
| **People** | 20 | ORCID iD Coverage (20) |
| **Organizations** | 15 | Affiliations (5), ROR IDs (10) |
| **Funding** | 20 | Funder Registry IDs (10), Award Numbers (10) |
| **Access** | 20 | Licenses (7), Full-text Links (7), Abstracts (6) |

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
│   │   │   ├── app/          # App router pages
│   │   │   └── components/   # React components
│   │   ├── scripts/          # Leaderboard generation scripts
│   │   └── data/             # Cached leaderboard data (27,830 publishers)
│   └── gap-fixer/            # Metadata recovery tool
│       ├── src/
│       │   ├── lib/
│       │   │   ├── enrichers/  # OpenAlex, ORCID, ROR clients
│       │   │   ├── parsers/    # Gap report CSV parser
│       │   │   └── scoring/    # Confidence scoring
│       │   └── components/   # Upload & analysis UI
│       └── README.md
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

## Gap Fixer

Once you know what metadata is missing, Gap Fixer helps you recover it.

### How It Works

1. **Upload** your [Crossref Participation Report](https://www.crossref.org/documentation/reports/participation-reports/) gap CSV
2. **Enrich** each DOI using OpenAlex, ORCID, ROR APIs + Reducto PDF extraction
3. **Score** recovered data with multi-source confidence levels
4. **Export** high-confidence recoveries formatted for Crossref submission

### Supported Recovery

| Gap Type | Sources | Confidence |
|----------|---------|------------|
| Abstracts | OpenAlex, Reducto | Up to 95% |
| References | OpenAlex, Reducto | Up to 95% |
| ORCID iDs | OpenAlex, ORCID, Reducto | Up to 100% |
| Affiliations | OpenAlex, Reducto | Up to 95% |
| ROR IDs | OpenAlex, ROR | Up to 95% |
| Funder IDs | OpenAlex, Reducto | Up to 95% |
| Award Numbers | OpenAlex, Reducto | Up to 95% |
| Licenses | OpenAlex, Reducto | Up to 95% |

See [apps/gap-fixer/README.md](apps/gap-fixer/README.md) for detailed documentation.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
  url          = {https://github.com/aadivar/nexus-score},
  note         = {Open-source tool for evaluating publisher metadata quality}
}
```

Or in text:

> Varma D., A. (2025). *Research Nexus Score: Metadata Coverage Scoring for Crossref Members*. https://github.com/aadivar/nexus-score

## Author

**Aadi Narayana Varma**

- LinkedIn: [@aadi-narayana-varma-dantuluri](https://www.linkedin.com/in/aadi-narayana-varma-dantuluri-62332b105/)
- GitHub: [@aadivar](https://github.com/aadivar)
- Email: varma2friend@gmail.com

---

<p align="center">
  <sub>Built with care for the open research community</sub>
</p>
