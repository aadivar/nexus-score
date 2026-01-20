# Gap Fixer

**Recover missing metadata from Crossref Participation Reports using open data sources.**

Gap Fixer takes the CSV gap reports from [Crossref Participation Reports](https://www.crossref.org/documentation/reports/participation-reports/) and attempts to recover missing metadata by querying authoritative open data sources like OpenAlex, ORCID, ROR, and extracting directly from PDFs using Reducto.

## The Problem

Crossref Participation Reports identify DOIs missing key metadata fields (abstracts, references, ORCID iDs, affiliations, etc.). But knowing what's missing is only half the battle — publishers still need to:

1. Find the missing data from authoritative sources
2. Format it correctly for Crossref submission
3. Verify the data quality before submitting

This manual process is time-consuming and error-prone.

## The Solution

Gap Fixer automates metadata recovery:

1. **Upload** your Crossref gap report CSV
2. **Enrich** each DOI using multiple open data sources
3. **Score** recovered data with confidence levels (0-100%)
4. **Export** high-confidence recoveries formatted for Crossref submission

## Supported Gap Types

| Gap Type | Recovery Sources | Notes |
|----------|------------------|-------|
| Abstracts | OpenAlex, Reducto | OpenAlex inverted index or PDF extraction |
| References | OpenAlex, Reducto | Linked to DOIs where available |
| ORCID iDs | OpenAlex, ORCID, Reducto | Cross-validated across sources |
| Affiliations | OpenAlex, Reducto | Author institution names |
| ROR IDs | OpenAlex, ROR | Institutional identifiers |
| Funder Registry IDs | OpenAlex, Reducto | Crossref Funder Registry DOIs |
| Funding Award Numbers | OpenAlex, Reducto | Grant/award identifiers |
| License URLs | OpenAlex, Reducto | Open access license information |

**Note:** Crossmark enablement is a publisher policy setting and cannot be recovered from external sources.

## Confidence Scoring

Gap Fixer uses a multi-source confidence algorithm:

| Source | Base Weight | Notes |
|--------|-------------|-------|
| OpenAlex | 80 | Comprehensive, aggregates authoritative data |
| ORCID | 75 | Authoritative for researcher identifiers |
| ROR | 75 | Authoritative for organization identifiers |
| Lens | 60 | Secondary validation source |
| Reducto | 60 | PDF extraction for structured content |

**Bonuses:**
- +15 points if 2+ sources agree
- +10 points if 3+ sources agree

**Thresholds:**
- **Recoverable:** ≥60% confidence
- **Auto-submit:** ≥90% confidence

## Data Flow

```
┌─────────────────────┐
│  Crossref Gap CSV   │
│  (DOIs + Gap Types) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Gap Parser       │
│  Parse & Validate   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────┐
│    Enrichment       │────▶│   OpenAlex   │
│      Engine         │────▶│    ORCID     │
│                     │────▶│     ROR      │
│                     │────▶│   Reducto    │──▶ PDF via Unpaywall
└──────────┬──────────┘     └──────────────┘
           │
           ▼
┌─────────────────────┐
│  Confidence Scoring │
│   Multi-source      │
│   Agreement Check   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Storage   │
│  Jobs, Articles,    │
│  Gaps, Recoveries   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Export for        │
│   Crossref Submit   │
└─────────────────────┘
```

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5
- **CSV Parsing:** PapaParse

## Project Structure

```
gap-fixer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── upload-zone.tsx     # CSV upload component
│   │   └── analysis-summary.tsx # Results display
│   └── lib/
│       ├── db/
│       │   ├── supabase.ts     # Database client
│       │   ├── schema.sql      # Database schema
│       │   └── types.ts        # TypeScript types
│       ├── enrichers/
│       │   ├── types.ts        # Common enrichment types
│       │   ├── openalex.ts     # OpenAlex API client
│       │   ├── orcid.ts        # ORCID API client
│       │   ├── ror.ts          # ROR API client
│       │   └── reducto.ts      # Reducto PDF extraction
│       ├── parsers/
│       │   └── gap-report.ts   # CSV parser
│       └── scoring/
│           └── confidence.ts   # Confidence calculation
├── scripts/
│   └── test-enrichment.ts      # Test script
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Supabase account (for production)

### Setup

```bash
# From monorepo root
pnpm install

# Navigate to gap-fixer
cd apps/gap-fixer

# Create environment file
cp .env.local.example .env.local
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: for polite API access
OPENALEX_EMAIL=your-email@example.com

# Reducto (for PDF extraction)
REDUCTO_API_KEY=your-reducto-api-key
```

### Database Setup

Run the schema in Supabase SQL editor:

```bash
# Copy contents of src/lib/db/schema.sql
# Paste into Supabase SQL Editor
# Execute
```

### Development

```bash
# Start dev server (runs on port 3001)
pnpm dev

# Test enrichment pipeline
pnpm test:enrich
```

## API Integration

### OpenAlex

Gap Fixer uses the [OpenAlex API](https://docs.openalex.org/) to retrieve:
- Abstracts (from inverted index)
- Author information with ORCID iDs
- Institutional affiliations with ROR IDs
- References (linked works)
- Funding information
- License data

### ORCID

Direct ORCID API queries for author verification and additional metadata.

### ROR

Research Organization Registry API for institutional identifier validation.

### Reducto

[Reducto](https://reducto.ai/) provides intelligent PDF extraction for scholarly articles:
- Uses structured extraction with JSON schema to pull metadata directly from PDFs
- Retrieves PDF URLs via [Unpaywall](https://unpaywall.org/) API
- Extracts: abstracts, authors (with ORCIDs), affiliations, references (with DOIs), funding acknowledgments, licenses
- Particularly valuable when metadata exists in the PDF but wasn't deposited with Crossref

## Database Schema

### Jobs

Represents a single gap report upload session.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| status | enum | pending, processing, completed, failed |
| total_articles | int | Total DOIs in report |
| recoverable_articles | int | DOIs with recoverable gaps |
| total_gaps | int | Total gaps across all DOIs |
| recoverable_gaps | int | Gaps that can be recovered |

### Articles

Individual DOIs from the gap report.

| Field | Type | Description |
|-------|------|-------------|
| doi | text | The DOI being processed |
| status | enum | pending, enriching, enriched, failed |
| confidence_score | decimal | Overall recovery confidence |
| enrichment_data | jsonb | Raw enrichment results |

### Gaps

Individual metadata gaps per article.

| Field | Type | Description |
|-------|------|-------------|
| gap_type | enum | references, abstracts, orcid_ids, etc. |
| status | enum | pending, recoverable, not_recoverable, recovered |
| confidence_score | decimal | Field-specific confidence |
| recovered_value | jsonb | The recovered metadata |

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Related

- [Research Nexus Score](../web) - Measure metadata coverage
- [@nexus-score/core](../../packages/core) - Scoring library
- [Crossref Participation Reports](https://www.crossref.org/documentation/reports/participation-reports/) - Source gap reports
