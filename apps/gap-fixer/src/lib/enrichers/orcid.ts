import type { Author, Affiliation } from './types';

const ORCID_BASE_URL = 'https://pub.orcid.org/v3.0';

interface OrcidRecord {
  'orcid-identifier': {
    path: string;
  };
  person?: {
    name?: {
      'given-names'?: { value: string };
      'family-name'?: { value: string };
    };
  };
  'activities-summary'?: {
    employments?: {
      'affiliation-group'?: Array<{
        summaries?: Array<{
          'employment-summary'?: {
            organization?: {
              name: string;
              'disambiguated-organization'?: {
                'disambiguated-organization-identifier': string;
                'disambiguation-source': string;
              };
            };
          };
        }>;
      }>;
    };
  };
}

/**
 * Fetch author information from ORCID API
 */
export async function fetchOrcidRecord(orcidId: string): Promise<Author | null> {
  try {
    const url = `${ORCID_BASE_URL}/${orcidId}/record`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`ORCID: No data for ${orcidId} (${response.status})`);
      return null;
    }

    const record: OrcidRecord = await response.json();

    // Extract name
    const givenName = record.person?.name?.['given-names']?.value || '';
    const familyName = record.person?.name?.['family-name']?.value || '';
    const name = `${givenName} ${familyName}`.trim();

    // Extract affiliations from employment history
    const affiliations: Affiliation[] = [];
    const employments = record['activities-summary']?.employments?.['affiliation-group'] || [];

    for (const group of employments) {
      for (const summary of group.summaries || []) {
        const org = summary['employment-summary']?.organization;
        if (org?.name) {
          const affiliation: Affiliation = {
            name: org.name,
          };

          // Check for ROR ID
          const disambiguated = org['disambiguated-organization'];
          if (disambiguated?.['disambiguation-source'] === 'ROR') {
            affiliation.ror = disambiguated['disambiguated-organization-identifier'];
          }

          // Avoid duplicates
          if (!affiliations.some(a => a.name === affiliation.name)) {
            affiliations.push(affiliation);
          }
        }
      }
    }

    return {
      name,
      orcid: orcidId,
      affiliations,
    };
  } catch (error) {
    console.error(`ORCID error for ${orcidId}:`, error);
    return null;
  }
}

/**
 * Search ORCID by author name and affiliation
 * Useful when we don't have an ORCID but need to find one
 */
export async function searchOrcid(
  authorName: string,
  affiliation?: string
): Promise<string[]> {
  try {
    let query = `family-name:${authorName.split(' ').pop() || authorName}`;
    if (affiliation) {
      query += ` AND affiliation-org-name:${affiliation}`;
    }

    const params = new URLSearchParams({
      q: query,
      rows: '5',
    });

    const url = `${ORCID_BASE_URL}/search?${params}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const results = data.result || [];

    return results.map((r: { 'orcid-identifier': { path: string } }) =>
      r['orcid-identifier'].path
    );
  } catch (error) {
    console.error('ORCID search error:', error);
    return [];
  }
}

/**
 * Enrich authors with ORCID data
 * Takes authors from OpenAlex and fetches additional ORCID details
 */
export async function enrichAuthorsWithOrcid(authors: Author[]): Promise<Author[]> {
  const enrichedAuthors: Author[] = [];

  for (const author of authors) {
    if (author.orcid) {
      // Fetch full ORCID record to get more affiliations
      const orcidRecord = await fetchOrcidRecord(author.orcid);

      if (orcidRecord) {
        // Merge affiliations from both sources
        const allAffiliations = [...author.affiliations];

        for (const aff of orcidRecord.affiliations) {
          if (!allAffiliations.some(a => a.name === aff.name)) {
            allAffiliations.push(aff);
          }
        }

        enrichedAuthors.push({
          ...author,
          affiliations: allAffiliations,
        });
      } else {
        enrichedAuthors.push(author);
      }
    } else {
      enrichedAuthors.push(author);
    }
  }

  return enrichedAuthors;
}
