/**
 * Custom error classes for Crossref API interactions
 */

export class CrossrefAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly endpoint: string
  ) {
    super(`Crossref API error ${status} on ${endpoint}: ${body}`);
    this.name = 'CrossrefAPIError';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export class CrossrefNotFoundError extends CrossrefAPIError {
  constructor(endpoint: string, identifier: string) {
    super(404, `Resource not found: ${identifier}`, endpoint);
    this.name = 'CrossrefNotFoundError';
  }
}

export class CrossrefRateLimitError extends CrossrefAPIError {
  public readonly retryAfter: number | null;

  constructor(endpoint: string, retryAfter: number | null = null) {
    super(429, 'Rate limit exceeded', endpoint);
    this.name = 'CrossrefRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class CrossrefTimeoutError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly timeout: number
  ) {
    super(`Request to ${endpoint} timed out after ${timeout}ms`);
    this.name = 'CrossrefTimeoutError';
  }
}
