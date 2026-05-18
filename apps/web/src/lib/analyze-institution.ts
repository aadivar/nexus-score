/**
 * Institutional research visibility analysis.
 *
 * For a given institution (ROR) over the last N days:
 *   1. Enumerate ALL of the institution's journal articles from OpenAlex
 *      (full census, no publisher map gating).
 *   2. Probe Crossref for every DOI directly — no content-type filter — and
 *      classify each by EVIDENCE, not by a heuristic on OpenAlex's publisher
 *      attribution:
 *        - present in Crossref as a journal-article  -> analyzed
 *        - present in Crossref under another type     -> content-type deposit gap
 *        - absent from Crossref entirely              -> registered elsewhere
 *                                                        (DataCite / repo / preprint)
 *   3. Group the analyzed works by the Crossref member + publisher Crossref
 *      itself reports on the record, and inspect each one for metadata presence.
 *
 * Gaps are OBSERVED (counted from real Crossref records), never projected from
 * aggregate coverage and never inferred from OpenAlex's publisher grouping.
 */

import {
  type InstitutionReport,
  type ProgressEvent,
  type PublisherGap,
} from './publisher-map';

type ProgressFn = (event: ProgressEvent) => void;
const noopProgress: ProgressFn = () => {};

const OPENALEX_BASE = 'https://api.openalex.org';
const CROSSREF_BASE = 'https://api.crossref.org';
const MAILTO = process.env.CROSSREF_MAILTO || 'varma2friend@gmail.com';
const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY || '';

const WINDOW_DAYS = 90;
const MIN_SAMPLE_SIZE = 10;
// One /works request per batch. 40 DOIs ~= a 1,800-char filter URL — well
// within Crossref's GET limits and 2x fewer round-trips than 20.
const DOI_BATCH_SIZE = 40;
const CROSSREF_CONCURRENCY = 6;
const OPENALEX_PAGE_SIZE = 200;
// Per-request hard ceiling. Crossref usually answers in <2s; anything past 10s
// is a stalled connection eating budget we need for the rest of the batches.
const FETCH_TIMEOUT_MS = 10_000;
const OPENALEX_TYPE_FILTER = 'type:article'; // OpenAlex content type
const CROSSREF_ARTICLE_TYPE = 'journal-article'; // Crossref work.type value

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, retries = 2): Promise<T> {
  // Premium key auth: append api_key to every OpenAlex request when configured.
  // Bypasses the polite-pool 10 req/s cap.
  const finalUrl =
    OPENALEX_API_KEY && url.includes('api.openalex.org') && !url.includes('api_key=')
      ? `${url}${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(OPENALEX_API_KEY)}`
      : url;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(finalUrl, {
        headers: { 'User-Agent': `nexus-score/0.1.2 (mailto:${MAILTO})` },
        signal: controller.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.pow(2, attempt) * 500);
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${finalUrl.slice(0, 120)}`);
      return (await res.json()) as T;
    } catch (err) {
      // Includes AbortError when the per-request timeout fires.
      lastError = err;
      await sleep(Math.pow(2, attempt) * 500);
    } finally {
      clearTimeout(timer);
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
    filter: `authorships.institutions.ror:https://ror.org/${ror},from_publication_date:${yearAgo},${OPENALEX_TYPE_FILTER}`,
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

/**
 * Full census: cursor-paginate every journal-article DOI OpenAlex attributes
 * to this institution in the window. No publisher grouping, no map — the
 * publisher is whatever Crossref itself reports once we probe each DOI.
 */
async function fetchAllInstitutionDois(
  ror: string,
  fromDate: string,
  onProgress: ProgressFn
): Promise<{
  totalArticles: number;
  dois: string[];
  noDoi: number;
  duplicateDoi: number;
}> {
  const baseFilter = `authorships.institutions.ror:https://ror.org/${ror},from_publication_date:${fromDate},${OPENALEX_TYPE_FILTER}`;
  const seen = new Set<string>();
  // OpenAlex article records that can't enter the Crossref probe at all:
  //   noDoi        — the work has no DOI, so there is nothing to look up
  //   duplicateDoi — multiple OpenAlex works share one DOI (probed once)
  // Tracked so the buckets reconcile to totalArticles instead of silently
  // shrinking to the unique-DOI count.
  let noDoi = 0;
  let duplicateDoi = 0;
  let totalArticles = 0;
  let cursor: string | null = '*';
  while (cursor !== null) {
    const currentCursor: string = cursor;
    const params = new URLSearchParams({
      filter: baseFilter,
      select: 'doi',
      per_page: String(OPENALEX_PAGE_SIZE),
      cursor: currentCursor,
      mailto: MAILTO,
    });
    const data = await fetchJson<OpenAlexDoiResponse>(
      `${OPENALEX_BASE}/works?${params.toString()}`
    );
    if (totalArticles === 0 && data.meta.count > 0) {
      totalArticles = data.meta.count;
      onProgress({ type: 'openalex_total', totalArticles });
    }
    for (const w of data.results) {
      const doi = normalizeDoi(w.doi);
      if (!doi) {
        noDoi += 1;
      } else if (seen.has(doi)) {
        duplicateDoi += 1;
      } else {
        seen.add(doi);
      }
    }
    onProgress({ type: 'openalex_dois', fetched: seen.size, total: totalArticles });
    cursor = data.meta.next_cursor;
    if (cursor && data.results.length === 0) break;
  }
  return { totalArticles, dois: Array.from(seen), noDoi, duplicateDoi };
}

interface CrossrefWork {
  DOI?: string;
  type?: string;
  member?: string;
  publisher?: string;
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

/**
 * Probe Crossref for a batch of DOIs. NO content-type filter — we want to know
 * whether the DOI exists in Crossref at all, then read its type from the
 * record. That lets us tell "in Crossref but typed differently" apart from
 * "not in Crossref at all" instead of conflating them.
 */
async function fetchCrossrefBatch(dois: string[]): Promise<CrossrefWork[]> {
  const filter = dois.map((d) => `doi:${d}`).join(',');
  const params = new URLSearchParams({
    filter,
    rows: String(dois.length),
    mailto: MAILTO,
    select: 'DOI,member,publisher,type,author,funder,abstract,license',
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

function tallyWorks(
  works: CrossrefWork[],
  institutionRorBare: string
): GapTally {
  const tally: GapTally = {
    withAffiliation: 0,
    withAnyRor: 0,
    withInstitutionRor: 0,
    withFunder: 0,
    withAbstract: 0,
    withLicense: 0,
    withOrcid: 0,
  };
  for (const work of works) {
    const insp = inspectWork(work, institutionRorBare);
    if (insp.hasAffiliation) tally.withAffiliation += 1;
    if (insp.hasAnyRor) tally.withAnyRor += 1;
    if (insp.hasInstitutionRor) tally.withInstitutionRor += 1;
    if (insp.hasFunder) tally.withFunder += 1;
    if (insp.hasAbstract) tally.withAbstract += 1;
    if (insp.hasLicense) tally.withLicense += 1;
    if (insp.hasOrcid) tally.withOrcid += 1;
  }
  return tally;
}

function buildPublisherGap(
  crossrefId: number,
  name: string,
  works: CrossrefWork[],
  institutionRor: string
): PublisherGap {
  const articles = works.length;
  if (articles < MIN_SAMPLE_SIZE) {
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
  const tally = tallyWorks(works, institutionRor);
  const pct = (n: number) => (n / articles) * 100;
  return {
    name,
    crossrefId,
    articles,
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
      noAffiliation: articles - tally.withAffiliation,
      noRor: articles - tally.withAnyRor,
      noFunder: articles - tally.withFunder,
      noAbstract: articles - tally.withAbstract,
      noLicense: articles - tally.withLicense,
      noOrcid: articles - tally.withOrcid,
      noInstitutionalRor: articles - tally.withInstitutionRor,
    },
  };
}

interface ProbeResult {
  publishers: PublisherGap[];
  scope: {
    analyzed: number;
    otherContentType: number;
    notInCrossref: number;
    probeFailed: number;
  };
  otherTypeBreakdown: Array<{ type: string; count: number }>;
}

async function probeAndGroup(
  dois: string[],
  institutionRor: string,
  onProgress: ProgressFn
): Promise<ProbeResult> {
  const batches: string[][] = [];
  for (let i = 0; i < dois.length; i += DOI_BATCH_SIZE) {
    batches.push(dois.slice(i, i + DOI_BATCH_SIZE));
  }

  // Each Crossref member becomes one publisher row, named by whatever Crossref
  // itself reports on the record. No hand-maintained OpenAlex→Crossref map.
  const groups = new Map<string, { crossrefId: number; name: string; works: CrossrefWork[] }>();
  const otherTypes = new Map<string, number>();
  const scope = { analyzed: 0, otherContentType: 0, notInCrossref: 0, probeFailed: 0 };
  let probed = 0;

  await mapWithConcurrency(batches, CROSSREF_CONCURRENCY, async (batch) => {
    let items: CrossrefWork[] | null;
    try {
      items = await fetchCrossrefBatch(batch);
    } catch (err) {
      // Probe failed after retries — don't lie about presence. These DOIs are
      // excluded from every denominator and surfaced separately.
      console.warn(
        `[analyze-institution] Crossref probe of ${batch.length} DOIs failed, marking unresolved: ${String(err).slice(0, 140)}`
      );
      items = null;
    }

    if (items === null) {
      scope.probeFailed += batch.length;
    } else {
      const found = new Map<string, CrossrefWork>();
      for (const w of items) {
        const d = normalizeDoi(w.DOI);
        if (d) found.set(d, w);
      }
      for (const doi of batch) {
        const work = found.get(doi);
        if (!work) {
          scope.notInCrossref += 1;
          continue;
        }
        if ((work.type || '').toLowerCase() !== CROSSREF_ARTICLE_TYPE) {
          scope.otherContentType += 1;
          const t = work.type || 'unknown';
          otherTypes.set(t, (otherTypes.get(t) || 0) + 1);
          continue;
        }
        scope.analyzed += 1;
        const memberId = work.member ? parseInt(work.member, 10) : NaN;
        const key = Number.isFinite(memberId)
          ? `m:${memberId}`
          : `n:${(work.publisher || 'Unknown publisher').toLowerCase()}`;
        let g = groups.get(key);
        if (!g) {
          g = {
            crossrefId: Number.isFinite(memberId) ? memberId : 0,
            name: work.publisher || 'Unknown publisher',
            works: [],
          };
          groups.set(key, g);
        }
        g.works.push(work);
      }
    }

    probed += batch.length;
    onProgress({
      type: 'crossref_probe',
      probed,
      total: dois.length,
      foundArticles: scope.analyzed,
    });
  });

  const publishers = Array.from(groups.values())
    .map((g) => buildPublisherGap(g.crossrefId, g.name, g.works, institutionRor))
    .sort((a, b) => b.articles - a.articles);

  const otherTypeBreakdown = Array.from(otherTypes.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  onProgress({
    type: 'crossref_grouped',
    publishers: publishers.length,
    analyzed: scope.analyzed,
  });

  return { publishers, scope, otherTypeBreakdown };
}

export async function analyzeInstitution(
  rorRaw: string,
  windowDays: number = WINDOW_DAYS,
  onProgress: ProgressFn = noopProgress
): Promise<InstitutionReport> {
  const ror = normalizeRor(rorRaw);

  const t0 = Date.now();
  onProgress({ type: 'phase', message: 'Looking up institution in OpenAlex…' });
  const institution = await getInstitutionInfo(ror);
  const { fromDate, dateLabel } = getDateWindow(windowDays);
  onProgress({
    type: 'institution',
    name: institution.name,
    ror,
    country: institution.country,
  });
  const t1 = Date.now();

  // Kick off cheap 1-year count in parallel with the DOI fetch — used for
  // annual extrapolation in cost estimates.
  const annualCountPromise = fetchAnnualArticleCount(ror);

  onProgress({
    type: 'phase',
    message: `Enumerating every ${windowDays}-day journal-article DOI from OpenAlex…`,
  });
  const { totalArticles, dois, noDoi, duplicateDoi } = await fetchAllInstitutionDois(
    ror,
    fromDate,
    onProgress
  );
  const t2 = Date.now();

  onProgress({
    type: 'phase',
    message: `Probing Crossref for all ${dois.length.toLocaleString()} DOIs…`,
  });
  const { publishers, scope, otherTypeBreakdown } = await probeAndGroup(
    dois,
    ror,
    onProgress
  );
  const t3 = Date.now();

  if (process.env.NEXUS_DEBUG_TIMING) {
    console.log(
      `  [timing] institution-info=${t1 - t0}ms openalex-dois=${t2 - t1}ms crossref-probe=${t3 - t2}ms total=${t3 - t0}ms`
    );
  }

  const measured = publishers.filter((p) => p.measured);
  const analyzedArticles = scope.analyzed;
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
    analyzedArticles,
    measuredArticles,
    publishers,
    crossrefScope: {
      analyzed: scope.analyzed,
      otherContentType: scope.otherContentType,
      notInCrossref: scope.notInCrossref,
      probeFailed: scope.probeFailed,
      noDoi,
      duplicateDoi,
    },
    otherTypeBreakdown,
    totals,
    generatedAt: new Date().toISOString(),
    notes: {
      contentType: 'Journal articles only',
      source:
        'Every DOI OpenAlex attributes to the institution is probed directly against Crossref. Presence, content type, and publisher are read from the Crossref record itself — not inferred from OpenAlex publisher attribution.',
      minSampleSize: MIN_SAMPLE_SIZE,
    },
  };
}
