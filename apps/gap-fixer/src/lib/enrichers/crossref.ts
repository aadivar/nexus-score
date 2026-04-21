/**
 * Crossref API client to fetch current metadata state
 * This shows what the publisher currently has registered
 */

const CROSSREF_BASE_URL = 'https://api.crossref.org';

export interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
  ORCID?: string;
  affiliation?: Array<{ name: string }>;
}

export interface CrossrefFunder {
  name: string;
  DOI?: string;
  award?: string[];
}

export interface CrossrefReference {
  key: string;
  DOI?: string;
  'article-title'?: string;
  author?: string;
  year?: string;
  'journal-title'?: string;
  unstructured?: string;
}

export interface CrossrefWork {
  DOI: string;
  title?: string[];
  abstract?: string;
  author?: CrossrefAuthor[];
  funder?: CrossrefFunder[];
  reference?: CrossrefReference[];
  license?: Array<{
    URL: string;
    'content-version': string;
  }>;
  link?: Array<{
    URL: string;
    'content-type': string;
    'intended-application': string;
  }>;
  'update-policy'?: string;
  publisher?: string;
  'container-title'?: string[];
  created?: {
    'date-parts': number[][];
  };
}

export interface CrossrefMetadata {
  doi: string;
  title: string | null;
  abstract: string | null;
  authors: Array<{
    name: string;
    orcid: string | null;
    affiliations: string[];
  }>;
  references: Array<{
    doi: string | null;
    title: string | null;
    unstructured: string | null;
  }>;
  funders: Array<{
    name: string;
    doi: string | null;
    awards: string[];
  }>;
  license: string | null;
  publisher: string | null;
  journal: string | null;
  createdDate: string | null;
  raw: CrossrefWork;
}

/**
 * Fetch current metadata from Crossref for a DOI
 */
export async function fetchCrossrefMetadata(doi: string): Promise<CrossrefMetadata | null> {
  try {
    const email = process.env.CROSSREF_MAILTO || process.env.OPENALEX_EMAIL;
    const url = email
      ? `${CROSSREF_BASE_URL}/works/${encodeURIComponent(doi)}?mailto=${email}`
      : `${CROSSREF_BASE_URL}/works/${encodeURIComponent(doi)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': email ? `GapFixer/1.0 (mailto:${email})` : 'GapFixer/1.0',
      },
    });

    if (!response.ok) {
      console.log(`Crossref: No data for DOI ${doi} (${response.status})`);
      return null;
    }

    const data = await response.json();
    const work: CrossrefWork = data.message;

    // Parse authors
    const authors = (work.author || []).map(a => {
      const name = a.name || `${a.given || ''} ${a.family || ''}`.trim();
      return {
        name,
        orcid: a.ORCID?.replace('http://orcid.org/', '').replace('https://orcid.org/', '') || null,
        affiliations: (a.affiliation || []).map(aff => aff.name),
      };
    });

    // Parse references
    const references = (work.reference || []).map(ref => ({
      doi: ref.DOI || null,
      title: ref['article-title'] || null,
      unstructured: ref.unstructured || null,
    }));

    // Parse funders
    const funders = (work.funder || []).map(f => ({
      name: f.name,
      doi: f.DOI || null,
      awards: f.award || [],
    }));

    // Parse license
    const license = work.license?.[0]?.URL || null;

    // Parse created date
    const createdParts = work.created?.['date-parts']?.[0];
    const createdDate = createdParts
      ? `${createdParts[0]}-${String(createdParts[1] || 1).padStart(2, '0')}-${String(createdParts[2] || 1).padStart(2, '0')}`
      : null;

    return {
      doi: work.DOI,
      title: work.title?.[0] || null,
      abstract: work.abstract || null,
      authors,
      references,
      funders,
      license,
      publisher: work.publisher || null,
      journal: work['container-title']?.[0] || null,
      createdDate,
      raw: work,
    };
  } catch (error) {
    console.error(`Crossref error for DOI ${doi}:`, error);
    return null;
  }
}

/**
 * Identify what's missing in Crossref metadata
 */
export function identifyGaps(metadata: CrossrefMetadata): {
  hasAbstract: boolean;
  hasReferences: boolean;
  authorsWithOrcid: number;
  authorsTotal: number;
  authorsWithAffiliations: number;
  fundersWithDoi: number;
  fundersTotal: number;
  fundersWithAwards: number;
  hasLicense: boolean;
} {
  const authorsWithOrcid = metadata.authors.filter(a => a.orcid).length;
  const authorsWithAffiliations = metadata.authors.filter(a => a.affiliations.length > 0).length;
  const fundersWithDoi = metadata.funders.filter(f => f.doi).length;
  const fundersWithAwards = metadata.funders.filter(f => f.awards.length > 0).length;

  return {
    hasAbstract: !!metadata.abstract,
    hasReferences: metadata.references.length > 0,
    authorsWithOrcid,
    authorsTotal: metadata.authors.length,
    authorsWithAffiliations,
    fundersWithDoi,
    fundersTotal: metadata.funders.length,
    fundersWithAwards,
    hasLicense: !!metadata.license,
  };
}
