import type { Affiliation } from './types';

const ROR_BASE_URL = 'https://api.ror.org';

interface RorOrganization {
  id: string;
  name: string;
  types: string[];
  links: string[];
  aliases: string[];
  acronyms: string[];
  status: string;
  country: {
    country_name: string;
    country_code: string;
  };
}

interface RorAffiliationMatch {
  substring: string;
  score: number;
  matching_type: string;
  chosen: boolean;
  organization: RorOrganization;
}

interface RorAffiliationResponse {
  number_of_results: number;
  items: RorAffiliationMatch[];
}

/**
 * Match an affiliation string to a ROR ID
 * Uses the ROR affiliation matching endpoint
 */
export async function matchAffiliation(affiliationString: string): Promise<Affiliation | null> {
  try {
    const params = new URLSearchParams({
      affiliation: affiliationString,
    });

    const url = `${ROR_BASE_URL}/v2/organizations?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`ROR: API error (${response.status})`);
      return null;
    }

    const data: RorAffiliationResponse = await response.json();

    if (data.number_of_results === 0 || !data.items.length) {
      return null;
    }

    // Find the best match (chosen=true or highest score)
    const bestMatch = data.items.find(item => item.chosen) || data.items[0];

    // Only accept high confidence matches (score >= 0.8)
    if (bestMatch.score < 0.8) {
      console.log(`ROR: Low confidence match for "${affiliationString}" (score: ${bestMatch.score})`);
      return null;
    }

    return {
      name: bestMatch.organization.name,
      ror: bestMatch.organization.id.replace('https://ror.org/', ''),
    };
  } catch (error) {
    console.error('ROR matching error:', error);
    return null;
  }
}

/**
 * Fetch organization details by ROR ID
 */
export async function fetchRorOrganization(rorId: string): Promise<RorOrganization | null> {
  try {
    // Normalize ROR ID
    const normalizedId = rorId.replace('https://ror.org/', '');

    const url = `${ROR_BASE_URL}/v2/organizations/${normalizedId}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`ROR fetch error for ${rorId}:`, error);
    return null;
  }
}

/**
 * Enrich affiliations with ROR IDs
 * Takes affiliations without ROR and attempts to match them
 */
export async function enrichAffiliationsWithRor(
  affiliations: Affiliation[]
): Promise<Affiliation[]> {
  const enrichedAffiliations: Affiliation[] = [];

  for (const affiliation of affiliations) {
    if (affiliation.ror) {
      // Already has ROR, keep as is
      enrichedAffiliations.push(affiliation);
    } else {
      // Try to match
      const matched = await matchAffiliation(affiliation.name);

      if (matched) {
        enrichedAffiliations.push({
          ...affiliation,
          ror: matched.ror,
        });
      } else {
        enrichedAffiliations.push(affiliation);
      }
    }
  }

  return enrichedAffiliations;
}

/**
 * Batch match multiple affiliations
 */
export async function batchMatchAffiliations(
  affiliationStrings: string[]
): Promise<Map<string, Affiliation | null>> {
  const results = new Map<string, Affiliation | null>();

  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < affiliationStrings.length; i += batchSize) {
    const batch = affiliationStrings.slice(i, i + batchSize);

    const promises = batch.map(async (aff) => {
      const result = await matchAffiliation(aff);
      results.set(aff, result);
    });

    await Promise.all(promises);

    // Small delay to be nice to the API
    if (i + batchSize < affiliationStrings.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
