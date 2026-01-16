/**
 * Crossref API Client
 * Uses the polite pool for better rate limits
 */

import {
  CrossrefMember,
  CrossrefJournal,
  CrossrefWork,
  CrossrefResponse,
  SearchResult,
  WorksResult,
} from './types.js';
import {
  CrossrefAPIError,
  CrossrefNotFoundError,
  CrossrefRateLimitError,
  CrossrefTimeoutError,
} from './errors.js';

const BASE_URL = 'https://api.crossref.org';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAILTO = 'varma2friend@gmail.com';

export interface CrossrefClientOptions {
  /** Email for polite pool access (required for better rate limits) */
  mailto?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** User agent string */
  userAgent?: string;
}

export class CrossrefClient {
  private readonly mailto: string;
  private readonly timeout: number;
  private readonly userAgent: string;

  constructor(options: CrossrefClientOptions = {}) {
    this.mailto = options.mailto || process.env.CROSSREF_MAILTO || DEFAULT_MAILTO;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.userAgent = options.userAgent || `NexusScore/1.0 (mailto:${this.mailto})`;
  }

  /**
   * Internal fetch method with polite pool headers
   */
  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);

    // Add polite pool mailto
    url.searchParams.set('mailto', this.mailto);

    // Add additional params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.text();

        if (response.status === 404) {
          throw new CrossrefNotFoundError(endpoint, url.pathname);
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new CrossrefRateLimitError(
            endpoint,
            retryAfter ? parseInt(retryAfter, 10) : null
          );
        }

        throw new CrossrefAPIError(response.status, body, endpoint);
      }

      const data = (await response.json()) as CrossrefResponse<T>;
      return data.message;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new CrossrefTimeoutError(endpoint, this.timeout);
      }

      throw error;
    }
  }

  // ============ MEMBER ENDPOINTS ============

  /**
   * Get member by ID - returns pre-computed coverage stats
   * This is the primary endpoint for scoring!
   *
   * @example
   * const member = await client.getMember('286'); // Oxford UP
   */
  async getMember(memberId: string | number): Promise<CrossrefMember> {
    return this.fetch<CrossrefMember>(`/members/${memberId}`);
  }

  /**
   * Search members by name
   *
   * @example
   * const result = await client.searchMembers('oxford', 10);
   */
  async searchMembers(query: string, limit = 10): Promise<SearchResult<CrossrefMember>> {
    return this.fetch<SearchResult<CrossrefMember>>('/members', {
      query,
      rows: limit.toString(),
    });
  }

  /**
   * List members without a search query (returns members by internal ordering)
   * Useful for leaderboards and browsing all members
   *
   * @example
   * const result = await client.listMembers(50);
   */
  async listMembers(limit = 50, offset = 0): Promise<SearchResult<CrossrefMember>> {
    const params: Record<string, string> = {
      rows: limit.toString(),
    };
    if (offset > 0) {
      params.offset = offset.toString();
    }
    return this.fetch<SearchResult<CrossrefMember>>('/members', params);
  }

  /**
   * Get sample works from a member (for deep analysis)
   * Uses the sample parameter to get random works without pagination
   *
   * @example
   * const works = await client.getMemberWorksSample('286', 100);
   */
  async getMemberWorksSample(
    memberId: string | number,
    sampleSize = 100
  ): Promise<CrossrefWork[]> {
    const result = await this.fetch<WorksResult>(`/members/${memberId}/works`, {
      sample: sampleSize.toString(),
      select: 'DOI,title,author,funder,reference,license,link,abstract,type,issued,publisher',
    });
    return result.items;
  }

  /**
   * Get recent works from a member (sorted by indexed date)
   *
   * @example
   * const works = await client.getMemberRecentWorks('286', 20);
   */
  async getMemberRecentWorks(
    memberId: string | number,
    limit = 20
  ): Promise<CrossrefWork[]> {
    const result = await this.fetch<WorksResult>(`/members/${memberId}/works`, {
      rows: limit.toString(),
      sort: 'indexed',
      order: 'desc',
      select: 'DOI,title,author,funder,reference,license,link,abstract,type,issued,publisher',
    });
    return result.items;
  }

  // ============ JOURNAL ENDPOINTS ============

  /**
   * Get journal by ISSN
   *
   * @example
   * const journal = await client.getJournal('0028-0836'); // Nature
   */
  async getJournal(issn: string): Promise<CrossrefJournal> {
    return this.fetch<CrossrefJournal>(`/journals/${issn}`);
  }

  /**
   * Get sample works from a journal
   *
   * @example
   * const works = await client.getJournalWorksSample('0028-0836', 100);
   */
  async getJournalWorksSample(issn: string, sampleSize = 100): Promise<CrossrefWork[]> {
    const result = await this.fetch<WorksResult>(`/journals/${issn}/works`, {
      sample: sampleSize.toString(),
      select: 'DOI,title,author,funder,reference,license,link,abstract,type,issued,publisher',
    });
    return result.items;
  }

  /**
   * Search journals by title
   *
   * @example
   * const result = await client.searchJournals('nature', 10);
   */
  async searchJournals(query: string, limit = 10): Promise<SearchResult<CrossrefJournal>> {
    return this.fetch<SearchResult<CrossrefJournal>>('/journals', {
      query,
      rows: limit.toString(),
    });
  }

  // ============ WORKS ENDPOINTS ============

  /**
   * Get a single work by DOI
   *
   * @example
   * const work = await client.getWork('10.1038/nature12373');
   */
  async getWork(doi: string): Promise<CrossrefWork> {
    return this.fetch<CrossrefWork>(`/works/${encodeURIComponent(doi)}`);
  }

  /**
   * Search works
   *
   * @example
   * const result = await client.searchWorks('machine learning', 20);
   */
  async searchWorks(query: string, limit = 20): Promise<WorksResult> {
    return this.fetch<WorksResult>('/works', {
      query,
      rows: limit.toString(),
    });
  }

  // ============ UTILITY METHODS ============

  /**
   * Check if the API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetch('/members', { rows: '1' });
      return true;
    } catch {
      return false;
    }
  }
}

// Export a default instance factory
export function createCrossrefClient(options?: CrossrefClientOptions): CrossrefClient {
  return new CrossrefClient(options);
}
