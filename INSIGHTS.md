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

---

# Current Era Insights: What Changes When You Drop the Backfile

*The [overall leaderboard](/leaderboard) averages current and backfile metadata — meaning publishers with large historical catalogs (some dating back centuries) get dragged down by old content they can't retroactively fix. The [current era leaderboard](/leaderboard/current) ranks purely on current-era content (last 2 years per Crossref), showing who's doing the best work right now.*

## The Industry Is Better Than It Looks

When you strip away historical backfiles and rank publishers on current content only, the picture improves meaningfully:

| Metric | Overall | Current Era | Change |
|--------|---------|-------------|--------|
| Average score | 19 | 23 | **+4** |
| Grade A publishers | 2 | 11 | **+9** |
| Grade B publishers | 41 | 251 | **+210** |
| Grade C publishers | 602 | 1,210 | **+608** |
| Grade F publishers | 19,547 | 17,665 | **-1,882** |

**2,844 publishers** (12.4%) earn a higher grade on current content than overall. The industry *is* improving — it's just buried under decades of legacy metadata.

## The Biggest Transformations Among Large Publishers

These publishers look completely different when judged on recent work:

| Publisher | Current Works | Overall | Current | Jump |
|-----------|---------------|---------|---------|------|
| American Physical Society | 55K | 58 (C) | **81 (A)** | C→A |
| American Society for Microbiology | 15K | 67 (B) | **86 (A)** | B→A |
| American Chemical Society | 210K | 48 (D) | **70 (B)** | D→B |
| American Meteorological Society | 4K | 41 (D) | **66 (B)** | D→B |
| IEEE | 883K | 34 (F) | **41 (D)** | F→D |
| SAGE Publications | 234K | 48 (D) | **61 (C)** | D→C |
| BMJ | 64K | 33 (F) | **47 (D)** | F→D |
| Wolters Kluwer | 237K | 26 (F) | **35 (D)** | F→D |

**APS** is the standout — a C-overall publisher that's producing **A-grade metadata** right now (score 81, #6 among all active publishers). **ASM** jumps from B to A (#3 in current era, score 86).

## The "American Societies" Are Quietly Leading

US-based scholarly societies dominate the current-era large publisher rankings:

| Rank | Publisher | Current Score |
|------|-----------|---------------|
| #3 | American Society for Microbiology | 86 (A) |
| #6 | American Physical Society | 81 (A) |
| #17 | American Astronomical Society | 78 (B) |
| #45 | Proceedings of the National Academy of Sciences | 74 (B) |
| #56 | American Geophysical Union | 73 (B) |
| #111 | American Chemical Society | 70 (B) |

These societies — not the commercial giants — are setting the standard for metadata quality at scale.

## Commercial Publishers: Improved, But Still D's

| Publisher | Current Works | Current Score | Current Grade |
|-----------|---------------|---------------|---------------|
| MDPI | 632K | 68 | B |
| SAGE | 234K | 61 | C |
| IOP Publishing | 117K | 55 | C |
| Wiley | 895K | 48 | D |
| Springer Nature | 2.0M | 47 | D |
| Elsevier | 3.0M | 42 | D |
| IEEE | 883K | 41 | D |
| OUP | 451K | 29 | F |

MDPI remains the only commercial-scale publisher to earn a B. **OUP is the worst performer among major publishers even on current content** — still an F at 29. Elsevier, Springer, and Wiley all remain D's.

## Only 135 Publishers Got Worse

Just **135 publishers** (0.6%) score lower on current content than overall. The most notable: **eLife** dropped from D (39) to F (31) — surprising for an open-access pioneer. Most downgrades are small regional publishers.

## South Korea Still Dominates

**33 of the top 50** current-era publishers are South Korean. The pattern holds regardless of how you measure.

## Organizations and Funding Are Still the Gap

Even on current content, the weakest dimensions remain:

| Dimension | Average (current era) |
|-----------|-----------------------|
| Access | 47 |
| People | 28 |
| Provenance | 25 |
| Organizations | 7 |
| Funding | 2 |

The industry has made progress on provenance and ORCIDs, but institutional identifiers and funding metadata remain nearly empty.

## The Current Era Bottom Line

The current-era view reveals a more optimistic story. The industry *is* getting better — 2,844 publishers earn a higher grade on recent content. American scholarly societies are producing A and B-grade metadata at scale. But the commercial giants (Elsevier, Springer, Wiley) are stuck in D territory even on their newest content, and two entire dimensions (organizations, funding) remain essentially absent across the board.

---

---

# What the Composite Score Hides: A Per-Dimension View

*Composite scores generate interest, but per-dimension coverage is where the actionable insight lives. Different publishers have different priorities and contexts. The leaderboard now supports sorting by individual dimensions and a radar chart profile for each publisher.*

## The Same Score, Completely Different Profiles

Two publishers can score a 50 and look nothing alike:

| Dimension | Publisher A (Access-strong) | Publisher B (People-strong) |
|-----------|---------------------------|----------------------------|
| Provenance | 30% | 60% |
| People | 20% | 90% |
| Organizations | 10% | 5% |
| Funding | 15% | 10% |
| Access | 90% | 40% |
| **Composite** | **~50** | **~50** |

The composite score treats these as equivalent. They're not. Publisher A has prioritized open access metadata (licenses, abstracts, full-text links). Publisher B has invested in author identification (ORCIDs). Both have legitimate strategies — the radar chart makes this visible.

## Dimension Leaders Don't Always Lead Overall

When you sort the leaderboard by individual dimensions, the top 10 changes dramatically:

- **Sort by People (ORCID)**: Publishers like PLoS (94% current), APS (98%), and ASM (99%) rise — they've invested heavily in author identification even if their overall scores are mid-range.
- **Sort by Funding**: Almost everyone drops. The median is 0%. The few publishers with meaningful funder metadata stand out starkly.
- **Sort by Organizations (ROR)**: Life Science Alliance (86%) is essentially alone at the top. Even MDPI — a B-grade publisher overall — has 0% ROR coverage.
- **Sort by Access**: Many publishers score well here (licenses + abstracts), which inflates their composite but masks gaps elsewhere.

## The Practical Takeaway

A publisher scoring an F overall but 90%+ on a single dimension isn't failing — they've made a strategic investment that the composite score doesn't reward. Per-dimension sorting lets the community recognize these efforts and helps publishers decide where to invest next based on what matters most to their stakeholders.

This is why the leaderboard now lets you click any dimension column to re-rank, and click any publisher to see their full radar profile.

---

*Generated from [Nexus Score](https://nexus-score.vercel.app) leaderboard data. Last updated: March 2026.*
