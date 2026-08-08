/**
 * Work types supported by Crossref Participation Reports.
 *
 * The Nexus Index scores the same 11 coverage fields. Other Crossref record
 * types (for example peer reviews and journal issues) have different schemas,
 * so treating their inapplicable fields as 0% would create a false penalty.
 * Unknown future types default to not benchmarked until Crossref documents them as
 * Participation Report types.
 */
export const SCORABLE_CONTENT_TYPES = [
  'journal-article',
  'proceedings-article',
  'book',
  'book-chapter',
  'grant',
  'posted-content',
  'report',
  'dataset',
  'standard',
] as const;

const SCORABLE_CONTENT_TYPE_SET = new Set<string>(SCORABLE_CONTENT_TYPES);

export function isScorableContentType(type: string): boolean {
  return SCORABLE_CONTENT_TYPE_SET.has(type);
}
