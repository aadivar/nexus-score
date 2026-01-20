// Common types for all enrichers

export interface Author {
  name: string;
  orcid?: string;
  affiliations: Affiliation[];
}

export interface Affiliation {
  name: string;
  ror?: string;
}

export interface Funder {
  name: string;
  doi?: string; // Crossref Funder Registry DOI
  awardNumber?: string;
}

export interface Reference {
  doi?: string;
  title?: string;
  authors?: string[];
  year?: number;
  journal?: string;
  unstructured?: string;
}

export interface EnrichmentResult {
  doi: string;
  source: 'openalex' | 'orcid' | 'ror' | 'lens' | 'reducto';
  timestamp: Date;

  // Recovered data
  abstract?: string;
  references?: Reference[];
  authors?: Author[];
  funders?: Funder[];
  license?: string;

  // Raw response for debugging
  raw?: unknown;
}

export interface EnrichmentSummary {
  doi: string;
  sources: EnrichmentResult[];

  // Aggregated confidence scores per field
  confidence: {
    abstract?: number;
    references?: number;
    orcidIds?: number;
    affiliations?: number;
    rorIds?: number;
    funderIds?: number;
    awardNumbers?: number;
    license?: number;
  };

  // Best recovered values (from highest confidence source)
  recovered: {
    abstract?: string;
    references?: Reference[];
    authors?: Author[];
    funders?: Funder[];
    license?: string;
  };
}
