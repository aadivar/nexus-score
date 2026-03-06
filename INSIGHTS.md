# Leaderboard Insights: The State of Scholarly Metadata

*All data sourced from the [Crossref API](https://api.crossref.org/) (queried March 2026) and the Nexus Score leaderboard (generated March 1, 2026). Nexus Score evaluates metadata completeness across five dimensions: provenance, people, organizations, funding, and access.*

---

## Most of Scholarly Publishing Gets an F

Of 28,155 Crossref members with at least one registered DOI, **87.9% score an F** on metadata completeness. Only 2 earn an A. 42 earn a B. The average score is 16.7 out of 100; the median is 15.

| Grade | Count | Percentage |
|-------|-------|------------|
| **A** | 2 | 0.0% |
| **B** | 42 | 0.1% |
| **C** | 598 | 2.1% |
| **D** | 2,770 | 9.8% |
| **F** | 24,743 | 87.9% |

This isn't about a few bad actors — the vast majority of the ecosystem deposits DOIs with minimal metadata attached.

## The Biggest Publishers Score D's and F's

Every household name in academic publishing sits in the bottom half of the grading scale:

| Publisher | Total DOIs | 2025 DOIs | Score | Grade |
|-----------|-----------|-----------|-------|-------|
| Elsevier | 24.6M | 1.36M | 36 | D |
| Springer Nature | 18.3M | 962K | 39 | D |
| Wiley | 11.9M | 432K | 43 | D |
| OUP | 7.5M | 200K | 20 | F |
| IEEE | 5.9M | — | 34 | F |
| PLoS | 403K | 25.5K | 57 | C |
| MDPI | 2.0M | 303K | 68 | B |

These seven publishers account for roughly **65 million DOIs**. None scores above a B.

**Elsevier** — the largest — registers 3,700+ DOIs per day (1.36M in 2025 alone), but only 39% of its current articles include ORCIDs, 40% include funder information, and 0% include ROR IDs or structured affiliations.

**Springer Nature** (18.3M DOIs) has ORCIDs on 35% of current content and affiliations on just 7%. **OUP** (7.5M DOIs) manages only 27% ORCIDs and 18% funders on current content, earning an F with a score of 20.

## They Are Improving — Unevenly

Every major publisher shows better metadata on recent content versus their backfiles:

| Publisher | ORCIDs (backfile → current) | Funders (backfile → current) |
|-----------|----------------------------|------------------------------|
| Elsevier | 8% → 39% | 15% → 40% |
| Springer Nature | 10% → 35% | 7% → 27% |
| Wiley | 13% → 61% | 11% → 29% |
| PLoS | 40% → 94% | 31% → 63% |
| MDPI | 80% → 87% | 54% → 59% |

But improvement on ORCIDs hasn't extended to other dimensions. **ROR IDs remain at 0%** for Elsevier, Springer, Wiley, OUP, PLoS, and IEEE. The industry has made progress on identifying *people* (via ORCIDs) but has barely started on identifying *institutions*.

## MDPI: Proof It's Possible at Scale

MDPI stands out as the only publisher with 100K+ DOIs to earn a B (score 68). With 2 million DOIs and 303K registered in 2025 alone, their current coverage includes: 87% ORCIDs, 89% affiliations, 59% funders, 99% licenses, 98% abstracts, and 88% references. This isn't a tiny niche operation — MDPI publishes more annually than PLoS, OUP, or IEEE individually.

## The Two Publishers Who Got A's

Only two members earn a grade of A:

### GigaScience Press (Hong Kong) — Score 88, 172 DOIs

Crossref confirms they are actively publishing: 26 DOIs in 2025, 1 in 2026, with steady output of 25–42 articles/year since 2020. Coverage: 100% ORCIDs, 100% references, 100% licenses, 100% abstracts, 97% affiliations, 84% funders, 41% ROR IDs. Near-perfect across the board — but at a scale of 172 articles, the comparison to million-DOI publishers is inherently limited.

### Life Science Alliance (New York) — Score 86, 1,726 DOIs

Also actively publishing: 163 DOIs in 2025, 31 already in 2026. Coverage: 99% ORCIDs, 100% affiliations, 86% ROR IDs, 91% funders, 97% references, 100% licenses, 96% abstracts. Notably, Life Science Alliance is one of the *only* members depositing ROR IDs at meaningful rates (86%). At ~1,700 DOIs it's still small, but 10x larger than GigaScience and maintaining similarly high standards.

## The Biggest Transformation Stories

**International Ocean Discovery Program** (Texas) went from 3% ORCIDs and 4% funders on its backfile to 97% ORCIDs and 83% funders on current content — a complete overhaul of metadata practices. Their 10,663 DOIs are primarily book chapters and monographs from scientific ocean drilling expeditions.

**American Astronomical Society** (188K DOIs) went from 24% to 98% ORCIDs and from 60% to 99% references on current content. As a large scholarly society, this shows transformation is possible even at significant scale.

## South Korea's Quiet Dominance

**34 of the top 50 members are South Korean** — primarily small-to-mid-size scholarly societies like the Korean Society of Remote Sensing (563 DOIs), GeoAI Data Society (262 DOIs), and Korean Vacuum Society. The pattern is striking and consistent across dozens of independent organizations. The data doesn't explain *why*, but it's clearly not coincidental — it suggests a systemic factor, possibly policy, infrastructure, or platform-level metadata requirements in Korean scholarly publishing.

## The Two Dimensions Nobody Does Well

Across all 28,155 members:

| Dimension | Average | Median |
|-----------|---------|--------|
| Provenance | 19 | 16 |
| People | 18 | 2 |
| Organizations | 5 | 0 |
| Funding | 1 | 0 |
| Access | 36 | 29 |

Even *access* — the best-performing dimension — averages only 36. The industry has a long way to go on every front, but organizational identity and funding metadata are essentially absent.

## A Note on Non-Publishers in the Data

Not all Crossref members are publishers. The leaderboard includes digital libraries, archives, and intergovernmental organizations that register DOIs for different purposes:

- **JSTOR** (3.1M DOIs, score 0) — a digital archive of historical content dating back to 1769, primarily registering DOIs for digitized book chapters and journal back-issues
- **IUCN** (247K DOIs), **United Nations Publications** (215K DOIs), **OECD** (50K DOIs) — intergovernmental organizations
- **Electronic Enlightenment Project** (92K DOIs) — a digital archive of historical correspondence

These members score 0, but expecting structured ORCIDs or funding data on 18th-century journal scans or UN policy documents isn't a meaningful comparison. Their low scores reflect a different mission, not negligence.

## The Bottom Line

The scholarly metadata ecosystem is thin. The largest publishers are improving, but slowly and unevenly — progress on ORCIDs hasn't translated to institutional identifiers or funding data. A handful of small publishers (GigaScience Press, Life Science Alliance) and one mid-size one (MDPI) demonstrate what's achievable. South Korean scholarly societies show that high metadata quality can be a norm, not an exception. But for the vast majority of the 65+ million DOIs held by major publishers, the metadata remains incomplete.

---

*Generated from [Nexus Score](https://nexus-score.vercel.app) leaderboard data. Last updated: March 2026.*
