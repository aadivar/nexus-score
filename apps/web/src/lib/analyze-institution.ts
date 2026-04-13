/**
 * Institutional research visibility analysis.
 *
 * For a given institution (ROR) over the last N days:
 *   1. Enumerate the institution's journal articles from OpenAlex, grouped by publisher
 *   2. For each publisher we can map to a Crossref member ID, batch-fetch the actual
 *      Crossref work records and inspect each one for metadata presence.
 *
 * Gaps are OBSERVED (counted from real Crossref records), not projected from
 * publisher-wide aggregate coverage. Publishers we can't map to a Crossref member
 * are listed separately so their output is not silently dropped.
 */

import {
  PUBLISHER_MAP,
  type InstitutionReport,
  type PublisherGap,
  type UnmappedPublisher,
} from './publisher-map';

const OPENALEX_BASE = 'https://api.openalex.org';
const CROSSREF_BASE = 'https://api.crossref.org';
const MAILTO = process.env.CROSSREF_MAILTO || 'varma2friend@gmail.com';

const WINDOW_DAYS = 90;
const MIN_SAMPLE_SIZE = 10;
const DOI_BATCH_SIZE = 40;
const CROSSREF_CONCURRENCY = 5;
const OPENALEX_CONCURRENCY = 5;
const OPENALEX_PAGE_SIZE = 200;
const CONTENT_TYPE_FILTER = 'type:article'; // OpenAlex
const CROSSREF_TYPE_FILTER = 'type:journal-article';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, retries = 4): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': `nexus-score/0.1.2 (mailto:${MAILTO})` },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.pow(2, attempt) * 500);
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 120)}`);
      return res.json() as Promise<T>;
    } catch (err) {
      // network errors (connection reset, timeout) — retry with backoff
      lastError = err;
      await sleep(Math.pow(2, attempt) * 500);
    }
  }
  throw new Error(
    `Failed after ${retries} retries: ${url.slice(0, 120)} (last: ${String(lastError).slice(0, 80)})`
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function getDateWindow(days: number): { fromDate: string; dateLabel: string } {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const toISO = (d: Date) => d.toISOString().split('T')[0];
  return {
    fromDate: toISO(start),
    dateLabel: `${toISO(start)} to ${toISO(now)} (last ${days} days)`,
  };
}

function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
}

function normalizeRor(ror: string): string {
  return ror.replace(/^https?:\/\/ror\.org\//i, '').toLowerCase();
}

interface OpenAlexInstitution {
  id: string;
  display_name: string;
  ror: string;
  country_code: string;
}

interface OpenAlexInstitutionSearch {
  results: OpenAlexInstitution[];
}

async function openalexInstitutionSearch(
  searchParam: string
): Promise<Array<{ name: string; ror: string; country: string }>> {
  const url = `${OPENALEX_BASE}/institutions?search=${encodeURIComponent(searchParam)}&per_page=10&mailto=${MAILTO}`;
  const data = await fetchJson<OpenAlexInstitutionSearch>(url);
  return data.results.map((inst) => ({
    name: inst.display_name,
    ror: normalizeRor(inst.ror || ''),
    country: inst.country_code || '',
  }));
}

export async function searchInstitutions(
  query: string
): Promise<Array<{ name: string; ror: string; country: string }>> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // First: exact (stemmed) search — best ranking when the user typed the
  // institution's name correctly.
  const exact = await openalexInstitutionSearch(trimmed);
  if (exact.length > 0) return exact;

  // Fallback: apply OpenAlex's native Levenshtein fuzzy (~2) to each word of
  // 3+ characters so typos like "IIT HYderbaad" or "Oxferd University" still
  // resolve. https://developers.openalex.org/guides/searching
  const fuzzy = trimmed
    .split(/\s+/)
    .map((word) => (word.length >= 3 ? `${word}~2` : word))
    .join(' ');
  if (fuzzy === trimmed) return [];
  try {
    return await openalexInstitutionSearch(fuzzy);
  } catch {
    return [];
  }
}

async function getInstitutionInfo(
  ror: string
): Promise<{ name: string; country: string }> {
  const url = `${OPENALEX_BASE}/institutions/ror:${ror}?mailto=${MAILTO}`;
  const data = await fetchJson<{ display_name: string; country_code: string }>(url);
  return { name: data.display_name, country: data.country_code || '' };
}

/**
 * Cheap one-off count query for the institution's full-year journal-article
 * output. Used in the UI to annualise cost estimates computed from the 90-day
 * sample without requiring a full-year analysis.
 */
async function fetchAnnualArticleCount(ror: string): Promise<number> {
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const params = new URLSearchParams({
    filter: `authorships.institutions.ror:https://ror.org/${ror},from_publication_date:${yearAgo},${CONTENT_TYPE_FILTER}`,
    per_page: '1',
    select: 'id',
    mailto: MAILTO,
  });
  try {
    const data = await fetchJson<{ meta: { count: number } }>(
      `${OPENALEX_BASE}/works?${params.toString()}`
    );
    return data.meta.count;
  } catch {
    return 0; // non-fatal; annualisation falls back to raw 90-day numbers
  }
}

interface OpenAlexDoiWork {
  doi: string | null;
}

interface OpenAlexDoiResponse {
  meta: { count: number; next_cursor: string | null };
  results: OpenAlexDoiWork[];
}

interface OpenAlexGroupResponse {
  meta: { count: number };
  group_by: Array<{ key: string; key_display_name: string; count: number }>;
}

/**
 * Two-phase DOI fetch:
 *   1. One group_by call enumerates publishers with counts.
 *   2. For each publisher we can map to a Crossref member, fetch DOIs in parallel
 *      with a filter that includes only that publisher's OpenAlex lineage IDs
 *      (select=doi to minimise payload). Unmapped publishers are retained from
 *      the group_by counts without fetching DOIs.
 */
async function fetchInstitutionDOIs(
  ror: string,
  fromDate: string
): Promise<{
  totalArticles: number;
  mapped: Map<number, { name: string; dois: string[] }>;
  unmapped: Map<string, { name: string; count: number }>;
}> {
  const baseFilter = `authorships.institutions.ror:https://ror.org/${ror},from_publication_date:${fromDate},${CONTENT_TYPE_FILTER}`;

  // Phase 1: enumerate publishers via group_by=host_organization (singular, not lineage).
  // Lineage returns one group per ancestor of each work, which double-counts works
  // published by a child entity under its parent (e.g., a paper at Oxford University
  // Press would also show up as a "University of Oxford" group).
  const groupParams = new URLSearchParams({
    filter: baseFilter,
    group_by: 'primary_location.source.host_organization',
    per_page: '200',
    mailto: MAILTO,
  });
  const groupData = await fetchJson<OpenAlexGroupResponse>(
    `${OPENALEX_BASE}/works?${groupParams.toString()}`
  );
  const totalArticles = groupData.meta.count;

  const mappedGroups = new Map<
    number,
    { name: string; openalexIds: string[] }
  >();
  const unmapped = new Map<string, { name: string; count: number }>();
  let sumOfGroupCounts = 0;

  for (const group of groupData.group_by) {
    sumOfGroupCounts += group.count;
    if (!group.key) continue;
    const mapping = PUBLISHER_MAP[group.key];
    if (mapping) {
      const entry = mappedGroups.get(mapping.crossrefId);
      if (entry) {
        entry.openalexIds.push(group.key);
      } else {
        mappedGroups.set(mapping.crossrefId, {
          name: mapping.name,
          openalexIds: [group.key],
        });
      }
    } else {
      const displayName = group.key_display_name || 'Unknown publisher';
      const existing = unmapped.get(group.key);
      if (existing) {
        existing.count += group.count;
      } else {
        unmapped.set(group.key, { name: displayName, count: group.count });
      }
    }
  }

  // Works whose primary_location.source has no host_organization aren't in any
  // group_by entry. Surface them explicitly so totals reconcile.
  const missingHostOrg = totalArticles - sumOfGroupCounts;
  if (missingHostOrg > 0) {
    unmapped.set('__no_source__', {
      name: 'No publisher metadata in OpenAlex',
      count: missingHostOrg,
    });
  }

  // Phase 2: parallel DOI fetch per mapped publisher
  const mapped = new Map<number, { name: string; dois: string[] }>();
  const mappedList = Array.from(mappedGroups.entries());
  await mapWithConcurrency(mappedList, OPENALEX_CONCURRENCY, async ([crossrefId, info]) => {
    const dois = await fetchPublisherDOIs(baseFilter, info.openalexIds);
    mapped.set(crossrefId, { name: info.name, dois });
  });

  return { totalArticles, mapped, unmapped };
}

async function fetchPublisherDOIs(
  baseFilter: string,
  openalexIds: string[]
): Promise<string[]> {
  const out: string[] = [];
  // OpenAlex OR-filter syntax uses `|` between values. Use host_organization
  // (singular) to match the group_by grouping and avoid ancestor double-counting.
  const lineageClause = `primary_location.source.host_organization:${openalexIds.join('|')}`;
  let cursor: string | null = '*';
  while (cursor !== null) {
    const currentCursor: string = cursor;
    const params = new URLSearchParams({
      filter: `${baseFilter},${lineageClause}`,
      select: 'doi',
      per_page: String(OPENALEX_PAGE_SIZE),
      cursor: currentCursor,
      mailto: MAILTO,
    });
    const data = await fetchJson<OpenAlexDoiResponse>(
      `${OPENALEX_BASE}/works?${params.toString()}`
    );
    for (const w of data.results) {
      const doi = normalizeDoi(w.doi);
      if (doi) out.push(doi);
    }
    cursor = data.meta.next_cursor;
    if (cursor && data.results.length === 0) break;
  }
  return out;
}

interface CrossrefWork {
  DOI?: string;
  author?: Array<{
    ORCID?: string;
    affiliation?: Array<{
      name?: string;
      id?: Array<{ id?: string; 'id-type'?: string }>;
    }>;
  }>;
  funder?: Array<unknown>;
  abstract?: string;
  license?: Array<unknown>;
}

interface CrossrefWorksResponse {
  message: {
    items: CrossrefWork[];
    'total-results': number;
  };
}

interface WorkInspection {
  hasAffiliation: boolean;
  hasAnyRor: boolean;
  hasInstitutionRor: boolean;
  hasFunder: boolean;
  hasAbstract: boolean;
  hasLicense: boolean;
  hasOrcid: boolean;
}

function inspectWork(work: CrossrefWork, institutionRorBare: string): WorkInspection {
  const authors = work.author || [];
  let hasAffiliation = false;
  let hasAnyRor = false;
  let hasInstitutionRor = false;
  let hasOrcid = false;

  for (const author of authors) {
    if (author.ORCID) hasOrcid = true;
    const affils = author.affiliation || [];
    for (const af of affils) {
      if (af.name || (af.id && af.id.length > 0)) hasAffiliation = true;
      for (const id of af.id || []) {
        if ((id['id-type'] || '').toUpperCase() === 'ROR') {
          hasAnyRor = true;
          const bare = normalizeRor(id.id || '');
          if (bare === institutionRorBare) hasInstitutionRor = true;
        }
      }
    }
  }

  return {
    hasAffiliation,
    hasAnyRor,
    hasInstitutionRor,
    hasFunder: (work.funder || []).length > 0,
    hasAbstract: typeof work.abstract === 'string' && work.abstract.length > 0,
    hasLicense: (work.license || []).length > 0,
    hasOrcid,
  };
}

async function fetchCrossrefBatch(dois: string[]): Promise<CrossrefWork[]> {
  const filter =
    dois.map((d) => `doi:${d}`).join(',') + `,${CROSSREF_TYPE_FILTER}`;
  const params = new URLSearchParams({
    filter,
    rows: String(dois.length),
    mailto: MAILTO,
    select: 'DOI,author,funder,abstract,license',
  });
  const url = `${CROSSREF_BASE}/works?${params.toString()}`;
  const data = await fetchJson<CrossrefWorksResponse>(url);
  return data.message.items;
}

interface GapTally {
  withAffiliation: number;
  withAnyRor: number;
  withInstitutionRor: number;
  withFunder: number;
  withAbstract: number;
  withLicense: number;
  withOrcid: number;
}

async function measurePublisherGaps(
  dois: string[],
  institutionRorBare: string
): Promise<{ foundInCrossref: number; tally: GapTally }> {
  const batches: string[][] = [];
  for (let i = 0; i < dois.length; i += DOI_BATCH_SIZE) {
    batches.push(dois.slice(i, i + DOI_BATCH_SIZE));
  }

  // If a single batch fails after retries, skip it rather than tanking the
  // whole analysis. The remaining batches still produce a valid measurement
  // (the sample is smaller, but the percentages remain truthful for what was
  // observed).
  const batchResults = await mapWithConcurrency(
    batches,
    CROSSREF_CONCURRENCY,
    async (batch) => {
      try {
        return await fetchCrossrefBatch(batch);
      } catch (err) {
        console.warn(
          `[analyze-institution] batch of ${batch.length} DOIs failed, skipping: ${String(err).slice(0, 140)}`
        );
        return [] as CrossrefWork[];
      }
    }
  );

  const tally: GapTally = {
    withAffiliation: 0,
    withAnyRor: 0,
    withInstitutionRor: 0,
    withFunder: 0,
    withAbstract: 0,
    withLicense: 0,
    withOrcid: 0,
  };
  let foundInCrossref = 0;

  for (const works of batchResults) {
    for (const work of works) {
      foundInCrossref += 1;
      const insp = inspectWork(work, institutionRorBare);
      if (insp.hasAffiliation) tally.withAffiliation += 1;
      if (insp.hasAnyRor) tally.withAnyRor += 1;
      if (insp.hasInstitutionRor) tally.withInstitutionRor += 1;
      if (insp.hasFunder) tally.withFunder += 1;
      if (insp.hasAbstract) tally.withAbstract += 1;
      if (insp.hasLicense) tally.withLicense += 1;
      if (insp.hasOrcid) tally.withOrcid += 1;
    }
  }

  return { foundInCrossref, tally };
}

function emptyPublisherGap(name: string, crossrefId: number, articles: number): PublisherGap {
  return {
    name,
    crossrefId,
    articles,
    measured: false,
    coverage: { affiliations: 0, rorIds: 0, funders: 0, abstracts: 0, orcids: 0, licenses: 0 },
    institutionalRor: 0,
    gap: { noAffiliation: 0, noRor: 0, noFunder: 0, noAbstract: 0, noLicense: 0, noOrcid: 0, noInstitutionalRor: 0 },
  };
}

async function measurePublisher(
  crossrefId: number,
  name: string,
  dois: string[],
  institutionRor: string
): Promise<PublisherGap> {
  if (dois.length < MIN_SAMPLE_SIZE) return emptyPublisherGap(name, crossrefId, dois.length);

  const { foundInCrossref, tally } = await measurePublisherGaps(dois, institutionRor);
  if (foundInCrossref < MIN_SAMPLE_SIZE) return emptyPublisherGap(name, crossrefId, foundInCrossref);

  const pct = (n: number) => (n / foundInCrossref) * 100;
  return {
    name,
    crossrefId,
    articles: foundInCrossref,
    measured: true,
    coverage: {
      affiliations: pct(tally.withAffiliation),
      rorIds: pct(tally.withAnyRor),
      funders: pct(tally.withFunder),
      abstracts: pct(tally.withAbstract),
      orcids: pct(tally.withOrcid),
      licenses: pct(tally.withLicense),
    },
    institutionalRor: tally.withInstitutionRor,
    gap: {
      noAffiliation: foundInCrossref - tally.withAffiliation,
      noRor: foundInCrossref - tally.withAnyRor,
      noFunder: foundInCrossref - tally.withFunder,
      noAbstract: foundInCrossref - tally.withAbstract,
      noLicense: foundInCrossref - tally.withLicense,
      noOrcid: foundInCrossref - tally.withOrcid,
      noInstitutionalRor: foundInCrossref - tally.withInstitutionRor,
    },
  };
}

export async function analyzeInstitution(
  rorRaw: string,
  windowDays: number = WINDOW_DAYS
): Promise<InstitutionReport> {
  const ror = normalizeRor(rorRaw);

  const t0 = Date.now();
  const [institution, { fromDate, dateLabel }] = [
    await getInstitutionInfo(ror),
    getDateWindow(windowDays),
  ];
  const t1 = Date.now();

  // Kick off cheap 1-year count in parallel with the DOI fetch — used for
  // annual extrapolation in cost estimates.
  const annualCountPromise = fetchAnnualArticleCount(ror);

  const { totalArticles, mapped, unmapped } = await fetchInstitutionDOIs(ror, fromDate);
  const t2 = Date.now();

  const mappedEntries = Array.from(mapped.entries());
  const publishers = await mapWithConcurrency(
    mappedEntries,
    CROSSREF_CONCURRENCY,
    ([crossrefId, info]) => measurePublisher(crossrefId, info.name, info.dois, ror)
  );
  const t3 = Date.now();

  if (process.env.NEXUS_DEBUG_TIMING) {
    console.log(
      `  [timing] institution-info=${t1 - t0}ms openalex-dois=${t2 - t1}ms crossref-measure=${t3 - t2}ms total=${t3 - t0}ms`
    );
  }

  publishers.sort((a, b) => b.articles - a.articles);

  const unmappedPublishers: UnmappedPublisher[] = Array.from(unmapped.entries())
    .map(([key, { name, count }]): UnmappedPublisher => {
      let category: UnmappedPublisher['category'];
      if (key === '__no_source__') category = 'no-metadata';
      else if (key.startsWith('https://openalex.org/I')) category = 'institutional';
      else category = 'unmapped-publisher';
      return { name, articles: count, category };
    })
    .sort((a, b) => b.articles - a.articles);

  // trackedArticles = articles at mapped publishers per OpenAlex (pre-Crossref
  // fetch). This ensures the top-line math reconciles: total = tracked +
  // unmapped. Some of these may not come back from Crossref when we inspect
  // them (e.g. the DOI exists but isn't typed as a journal-article in
  // Crossref) — that shortfall is reflected in measuredArticles being lower.
  const trackedArticles = Array.from(mapped.values()).reduce(
    (s, info) => s + info.dois.length,
    0
  );
  const measured = publishers.filter((p) => p.measured);
  const measuredArticles = measured.reduce((s, p) => s + p.articles, 0);

  const totals = {
    noAffiliation: measured.reduce((s, p) => s + p.gap.noAffiliation, 0),
    noRor: measured.reduce((s, p) => s + p.gap.noRor, 0),
    noFunder: measured.reduce((s, p) => s + p.gap.noFunder, 0),
    noAbstract: measured.reduce((s, p) => s + p.gap.noAbstract, 0),
    noLicense: measured.reduce((s, p) => s + p.gap.noLicense, 0),
    noInstitutionalRor: measured.reduce((s, p) => s + p.gap.noInstitutionalRor, 0),
    affiliationPercent: 0,
    rorPercent: 0,
    funderPercent: 0,
    abstractPercent: 0,
    institutionalRorPercent: 0,
  };

  if (measuredArticles > 0) {
    totals.affiliationPercent = ((measuredArticles - totals.noAffiliation) / measuredArticles) * 100;
    totals.rorPercent = ((measuredArticles - totals.noRor) / measuredArticles) * 100;
    totals.funderPercent = ((measuredArticles - totals.noFunder) / measuredArticles) * 100;
    totals.abstractPercent = ((measuredArticles - totals.noAbstract) / measuredArticles) * 100;
    totals.institutionalRorPercent =
      ((measuredArticles - totals.noInstitutionalRor) / measuredArticles) * 100;
  }

  const annualArticleCount = await annualCountPromise;

  return {
    institution: {
      name: institution.name,
      ror,
      country: institution.country,
    },
    dateRange: dateLabel,
    windowDays,
    totalArticles,
    annualArticleCount,
    trackedArticles,
    measuredArticles,
    publishers,
    unmappedPublishers,
    totals,
    generatedAt: new Date().toISOString(),
    notes: {
      contentType: 'Journal articles only',
      source:
        'Counts are observed directly from Crossref work records, not projected from publisher-wide aggregate coverage.',
      minSampleSize: MIN_SAMPLE_SIZE,
    },
  };
}
