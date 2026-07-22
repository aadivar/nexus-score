/**
 * Crossref API Type Definitions
 * Based on https://api.crossref.org documentation
 */

/**
 * Coverage statistics from /members/{id} endpoint
 * These are pre-computed by Crossref - no pagination needed!
 * Values are percentages (0.0 to 1.0)
 */
export interface MemberCoverage {
  // Current = published in last 2 calendar years
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

  // Backfile = older than 2 calendar years
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

/**
 * Crossref Member (Publisher/Organization)
 */
export interface CrossrefMember {
  id: number;
  'primary-name': string;
  names: string[];
  prefixes: MemberPrefix[];
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
  'counts-type'?: {
    all?: Record<string, number>;
    current?: Record<string, number>;
    backfile?: Record<string, number>;
  };
  breakdowns: {
    'dois-by-issued-year': Array<[number, number]>;
  };
  flags: MemberFlags;
  location: string;
  tokens: string[];
}

export interface MemberPrefix {
  value: string;
  name: string;
  'public-references': boolean;
  reference_visibility: string;
}

export interface MemberFlags {
  'deposits-abstracts-current': boolean;
  'deposits-orcids-current': boolean;
  'deposits-affiliations-current': boolean;
  'deposits-funders-current': boolean;
  'deposits-references-current': boolean;
  'deposits-licenses-current': boolean;
  'deposits-award-numbers-current': boolean;
  'deposits-update-policies-current': boolean;
  'deposits-resource-links-current': boolean;
  'deposits-ror-ids-current': boolean;
  'deposits-abstracts-backfile': boolean;
  'deposits-orcids-backfile': boolean;
  'deposits-affiliations-backfile': boolean;
  'deposits-funders-backfile': boolean;
  'deposits-references-backfile': boolean;
  'deposits-licenses-backfile': boolean;
  'deposits-award-numbers-backfile': boolean;
  'deposits-update-policies-backfile': boolean;
  'deposits-resource-links-backfile': boolean;
  'deposits-ror-ids-backfile': boolean;
}

/**
 * Crossref Journal
 */
export interface CrossrefJournal {
  ISSN: string[];
  title: string;
  publisher: string;
  'publisher-id'?: number;
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
  flags: MemberFlags;
  subjects?: JournalSubject[];
}

export interface JournalSubject {
  ASJC: number;
  name: string;
}

/**
 * Crossref Work (Publication)
 */
export interface CrossrefWork {
  DOI: string;
  URL: string;
  title: string[];
  'container-title'?: string[];
  author?: Author[];
  funder?: Funder[];
  reference?: Reference[];
  license?: License[];
  link?: Link[];
  abstract?: string;
  'is-referenced-by-count': number;
  'references-count': number;
  type: WorkType;
  issued: DateParts;
  published?: DateParts;
  created: DateParts;
  deposited: DateParts;
  indexed: DateParts;
  publisher: string;
  'publisher-location'?: string;
  source: string;
  subject?: string[];
  ISSN?: string[];
  ISBN?: string[];
  'article-number'?: string;
  volume?: string;
  issue?: string;
  page?: string;
  member: string;
  prefix: string;
  score: number;
}

export type WorkType =
  | 'journal-article'
  | 'book-chapter'
  | 'monograph'
  | 'report'
  | 'dataset'
  | 'posted-content'
  | 'proceedings-article'
  | 'component'
  | 'book'
  | 'report-component'
  | 'journal-issue'
  | 'journal-volume'
  | 'book-section'
  | 'book-part'
  | 'book-series'
  | 'book-set'
  | 'edited-book'
  | 'reference-book'
  | 'dissertation'
  | 'standard'
  | 'peer-review'
  | 'other';

export interface Author {
  given?: string;
  family?: string;
  name?: string; // For organizations
  ORCID?: string;
  'authenticated-orcid'?: boolean;
  affiliation?: Affiliation[];
  sequence?: 'first' | 'additional';
}

export interface Affiliation {
  name: string;
  id?: AffiliationId[];
}

export interface AffiliationId {
  id: string;
  'id-type': 'ROR' | 'ISNI' | 'Ringgold' | string;
  'asserted-by': 'publisher' | 'crossref';
}

export interface Funder {
  DOI?: string;
  name: string;
  'doi-asserted-by'?: 'publisher' | 'crossref';
  award?: string[];
}

export interface Reference {
  key: string;
  DOI?: string;
  'doi-asserted-by'?: string;
  unstructured?: string;
  'article-title'?: string;
  'volume-title'?: string;
  author?: string;
  year?: string;
  volume?: string;
  issue?: string;
  'first-page'?: string;
  'journal-title'?: string;
  issn?: string;
}

export interface License {
  URL: string;
  'content-version': 'vor' | 'am' | 'tdm' | 'unspecified';
  'delay-in-days': number;
  start: DateParts;
}

export interface Link {
  URL: string;
  'content-type': string;
  'content-version': string;
  'intended-application': 'text-mining' | 'similarity-checking' | 'unspecified';
}

export interface DateParts {
  'date-parts': number[][];
  timestamp?: number;
}

/**
 * API Response Wrappers
 */
export interface CrossrefResponse<T> {
  status: 'ok' | 'failed';
  'message-type': string;
  'message-version': string;
  message: T;
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

export interface WorksResult {
  items: CrossrefWork[];
  'total-results': number;
  'items-per-page': number;
  query: {
    'start-index': number;
    'search-terms'?: string;
  };
  facets?: Record<string, unknown>;
}
