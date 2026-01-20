import type { EnrichmentResult, Author, Reference, Funder } from './types';

const REDUCTO_BASE_URL = 'https://platform.reducto.ai';

// System prompt for Crossref metadata extraction
const EXTRACTION_SYSTEM_PROMPT = `You are a scientific metadata extraction specialist. Extract the following structured metadata from this academic PDF to fill gaps in Crossref records.

## Required Output Format (JSON)

{
  "abstract": "The full abstract text, preserving formatting",
  "authors": [
    {
      "name": "Full Name",
      "orcid": "0000-0000-0000-0000 or null",
      "affiliations": ["Institution Name, City, Country"]
    }
  ],
  "references": [
    {
      "citation": "Full citation text",
      "doi": "10.xxxx/xxxxx or null",
      "title": "Article title if identifiable",
      "authors": "First author et al. or full list",
      "year": "Publication year"
    }
  ],
  "funding": [
    {
      "funder_name": "Full funder organization name",
      "award_number": "Grant/award ID or null",
      "recipient": "PI name if mentioned"
    }
  ],
  "license": "License type (CC-BY, CC-BY-NC, etc.) or null",
  "keywords": ["keyword1", "keyword2"]
}

## Extraction Rules

### Abstract
- Look in: Title page, first page after title/authors, or section labeled "Abstract" or "Summary"
- Include the complete text, not truncated
- For "Insight" or commentary articles without formal abstract, extract the opening summary paragraph

### Authors & Affiliations
- Extract ALL authors with their superscript affiliation markers
- Look for ORCID icons (iD logo) or explicit ORCID URLs
- Map each author to their complete affiliation(s)
- Preserve affiliation hierarchy: Department, Institution, City, Country

### References
- Extract from "References", "Bibliography", "Literature Cited", or "Works Cited" section
- CRITICAL: Extract DOIs - look for patterns like:
  - "doi: 10.xxxx/xxxxx"
  - "https://doi.org/10.xxxx/xxxxx"
  - DOIs embedded in URLs
- Remove trailing punctuation from DOIs
- Number references sequentially as they appear

### Funding
- Look in: "Acknowledgments", "Funding", "Financial Support", "Grant Information"
- Extract funder names in full (e.g., "National Institutes of Health" not just "NIH")
- Capture grant/award numbers with their prefixes (e.g., "R01-GM123456")
- Associate award numbers with the correct funder

### License
- Look in footer, first page, or end matter
- Identify Creative Commons variants or publisher-specific licenses

## Quality Standards
- Return null for fields you cannot confidently extract
- Do not hallucinate or infer missing data
- Preserve original formatting for abstracts and citations
- Validate DOI format: must start with "10." followed by registrant code
`;

// Structured output from the extraction
export interface ReductoExtractedMetadata {
  abstract?: string;
  authors?: Array<{
    name: string;
    orcid?: string | null;
    affiliations?: string[];
  }>;
  references?: Array<{
    citation?: string;
    doi?: string | null;
    title?: string;
    authors?: string;
    year?: string;
  }>;
  funding?: Array<{
    funder_name: string;
    award_number?: string | null;
    recipient?: string;
  }>;
  license?: string | null;
  keywords?: string[];
}

interface ReductoParseResponse {
  job_id: string;
  result?: {
    chunks: Array<{
      content: string;
      metadata?: {
        page?: number;
        section?: string;
      };
    }>;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface ReductoExtractResponse {
  job_id?: string;
  result?: ReductoExtractedMetadata | ReductoExtractedMetadata[];
  usage?: { num_pages: number; num_fields: number; credits: number };
  status?: string;
  error?: string;
  detail?: string; // Error detail
}

/**
 * Run PDF through Reducto extract API for structured metadata extraction
 */
export async function extractMetadataWithPipeline(
  pdfUrl: string
): Promise<ReductoExtractedMetadata | null> {
  const apiKey = process.env.REDUCTO_API_KEY;

  if (!apiKey) {
    console.error('Reducto: Missing API key');
    return null;
  }

  try {
    console.log('     Reducto: Running extract API...');

    const response = await fetch(`${REDUCTO_BASE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: pdfUrl,
        instructions: {
          schema: {
            type: 'object',
            properties: {
              abstract: { type: 'string', description: 'The full abstract text from the paper' },
              authors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Full author name' },
                    orcid: { type: 'string', description: 'ORCID ID if present' },
                    affiliations: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              references: {
                type: 'array',
                description: 'All references cited in the paper',
                items: {
                  type: 'object',
                  properties: {
                    citation: { type: 'string', description: 'Full citation text' },
                    doi: { type: 'string', description: 'DOI if present (format: 10.xxxx/xxxxx)' },
                    title: { type: 'string', description: 'Article title' },
                    authors: { type: 'string', description: 'Author names' },
                    year: { type: 'string', description: 'Publication year' }
                  }
                }
              },
              funding: {
                type: 'array',
                description: 'Funding sources and grant numbers',
                items: {
                  type: 'object',
                  properties: {
                    funder_name: { type: 'string', description: 'Full name of funding organization' },
                    award_number: { type: 'string', description: 'Grant or award number' },
                    recipient: { type: 'string', description: 'PI or recipient name' }
                  }
                }
              },
              license: { type: 'string', description: 'License type (e.g., CC-BY, CC-BY-NC)' },
              keywords: { type: 'array', items: { type: 'string' } }
            }
          },
          system_prompt: EXTRACTION_SYSTEM_PROMPT,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Reducto extract error (${response.status}): ${errorText}`);
      return null;
    }

    const data: ReductoExtractResponse = await response.json();
    console.log('     Reducto: Raw response keys:', Object.keys(data));
    if (data.usage) {
      console.log(`     Reducto: Used ${data.usage.credits} credits for ${data.usage.num_pages} pages`);
    }

    if (data.error || data.detail) {
      console.error(`Reducto extract failed: ${data.error || data.detail}`);
      return null;
    }

    if (data.result) {
      // Handle array result (API returns array)
      const result = Array.isArray(data.result) ? data.result[0] : data.result;
      if (result) {
        console.log(`     Reducto: Extract complete - abstract=${!!result.abstract}, refs=${result.references?.length || 0}`);
        return result;
      }
    }

    // If the response itself is the result (no wrapper)
    if ('abstract' in data || 'references' in data || 'authors' in data) {
      console.log('     Reducto: Extract complete (direct result)');
      return data as unknown as ReductoExtractedMetadata;
    }

    console.log('     Reducto: No result in response');
    return null;
  } catch (error) {
    console.error('Reducto extract error:', error);
    return null;
  }
}

/**
 * Parse a PDF using Reducto API (legacy - for raw parsing)
 */
export async function parsePdfWithReducto(
  pdfUrl: string
): Promise<ReductoParseResponse | null> {
  const apiKey = process.env.REDUCTO_API_KEY;

  if (!apiKey) {
    console.error('Reducto: Missing API key');
    return null;
  }

  try {
    // Start the parsing job
    const response = await fetch(`${REDUCTO_BASE_URL}/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_url: pdfUrl,
        options: {
          chunking_strategy: 'semantic',
          extract_tables: true,
          extract_images: false,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Reducto: API error (${response.status})`);
      return null;
    }

    const data: ReductoParseResponse = await response.json();

    // If synchronous, return immediately
    if (data.result) {
      return data;
    }

    // Otherwise poll for completion
    return await pollReductoJob(data.job_id, apiKey);
  } catch (error) {
    console.error('Reducto error:', error);
    return null;
  }
}

/**
 * Poll for Reducto job completion
 */
async function pollReductoJob(
  jobId: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<ReductoParseResponse | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${REDUCTO_BASE_URL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data: ReductoParseResponse = await response.json();

      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        console.error(`Reducto job failed: ${data.error}`);
        return null;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error('Reducto polling error:', error);
      return null;
    }
  }

  console.error('Reducto: Job timed out');
  return null;
}

/**
 * Extract abstract from parsed PDF content
 */
function extractAbstract(chunks: ReductoParseResponse['result']): string | undefined {
  if (!chunks?.chunks) return undefined;

  // Look for abstract section
  for (const chunk of chunks.chunks) {
    const content = chunk.content.toLowerCase();

    // Check if this chunk is or contains the abstract
    if (content.includes('abstract')) {
      // Extract text after "abstract" heading
      const abstractMatch = chunk.content.match(/abstract[:\s]*\n?([\s\S]*?)(?=\n\s*(introduction|keywords|1\.|background)|$)/i);

      if (abstractMatch && abstractMatch[1]) {
        const abstract = abstractMatch[1].trim();
        // Validate it looks like an abstract (reasonable length)
        if (abstract.length > 100 && abstract.length < 5000) {
          return abstract;
        }
      }
    }
  }

  return undefined;
}

/**
 * Extract references from parsed PDF content
 */
function extractReferences(chunks: ReductoParseResponse['result']): Reference[] {
  if (!chunks?.chunks) return [];

  const references: Reference[] = [];
  let inReferencesSection = false;

  for (const chunk of chunks.chunks) {
    const content = chunk.content;

    // Check if we've reached references section
    if (/^(references|bibliography|works cited)/i.test(content.trim())) {
      inReferencesSection = true;
      continue;
    }

    if (inReferencesSection) {
      // Parse individual references
      // This is a simplified parser - real implementation would be more sophisticated
      const refLines = content.split(/\n(?=\[?\d+[\.\])]|\n[A-Z])/);

      for (const line of refLines) {
        const trimmed = line.trim();
        if (trimmed.length < 20) continue;

        // Try to extract DOI
        const doiMatch = trimmed.match(/10\.\d{4,}\/[^\s]+/);

        references.push({
          unstructured: trimmed,
          doi: doiMatch?.[0]?.replace(/[.,;]$/, ''),
        });
      }
    }
  }

  return references;
}

/**
 * Extract funding information from parsed PDF content
 */
function extractFunding(chunks: ReductoParseResponse['result']): Funder[] {
  if (!chunks?.chunks) return [];

  const funders: Funder[] = [];

  for (const chunk of chunks.chunks) {
    const content = chunk.content.toLowerCase();

    // Look for acknowledgments or funding section
    if (content.includes('acknowledgment') || content.includes('funding') || content.includes('supported by')) {
      // Extract grant/award numbers
      const awardMatches = chunk.content.matchAll(/(?:grant|award|contract)[\s#:]*([A-Z0-9-]+)/gi);

      for (const match of awardMatches) {
        funders.push({
          name: 'Unknown Funder', // Would need NER to extract funder name
          awardNumber: match[1],
        });
      }

      // Look for common funder patterns
      const funderPatterns = [
        /National Institutes of Health|NIH/i,
        /National Science Foundation|NSF/i,
        /European Research Council|ERC/i,
        /Wellcome Trust/i,
        /Howard Hughes Medical Institute|HHMI/i,
      ];

      for (const pattern of funderPatterns) {
        if (pattern.test(chunk.content)) {
          const funderName = chunk.content.match(pattern)?.[0];
          if (funderName && !funders.some(f => f.name === funderName)) {
            funders.push({ name: funderName });
          }
        }
      }
    }
  }

  return funders;
}

/**
 * Get PDF URL for a DOI using Unpaywall
 */
export async function getPdfUrl(doi: string): Promise<string | null> {
  try {
    const email = process.env.OPENALEX_EMAIL || 'test@example.com';
    const url = `https://api.unpaywall.org/v2/${doi}?email=${email}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    // Try to get best OA location
    const bestLocation = data.best_oa_location;
    if (bestLocation?.url_for_pdf) {
      return bestLocation.url_for_pdf;
    }

    // Fallback to any OA location
    for (const location of data.oa_locations || []) {
      if (location.url_for_pdf) {
        return location.url_for_pdf;
      }
    }

    return null;
  } catch (error) {
    console.error(`Unpaywall error for DOI ${doi}:`, error);
    return null;
  }
}

/**
 * Full enrichment pipeline using Reducto
 */
export async function enrichFromReducto(doi: string): Promise<EnrichmentResult | null> {
  // First, get PDF URL
  const pdfUrl = await getPdfUrl(doi);

  if (!pdfUrl) {
    console.log(`Reducto: No PDF available for DOI ${doi}`);
    return null;
  }

  // Parse the PDF
  const parsed = await parsePdfWithReducto(pdfUrl);

  if (!parsed?.result) {
    console.log(`Reducto: Failed to parse PDF for DOI ${doi}`);
    return null;
  }

  // Extract metadata
  const abstract = extractAbstract(parsed.result);
  const references = extractReferences(parsed.result);
  const funders = extractFunding(parsed.result);

  return {
    doi,
    source: 'reducto',
    timestamp: new Date(),
    abstract,
    references: references.length > 0 ? references : undefined,
    funders: funders.length > 0 ? funders : undefined,
    raw: parsed.result,
  };
}
