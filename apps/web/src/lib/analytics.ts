import { track } from '@vercel/analytics';

/**
 * Custom Vercel Analytics events for the web app.
 *
 * Privacy note: we only ever send the *literal names* people are looking at
 * (publisher / institution names, journal titles) and free-text the user
 * already typed into a search box — never opaque identifiers (Crossref member
 * IDs, ROR IDs, ISSNs). Names are public scholarly-infrastructure data, not
 * personal data, so this stays consistent with /privacy.
 */
export type AnalyticsEvent =
  | 'publisher_search' // someone searched the publisher autocomplete
  | 'leaderboard_search' // someone searched within a leaderboard table
  | 'institution_search' // someone searched for an institution to analyze
  | 'institution_analyze' // someone ran the analysis for a named institution
  | 'publisher_view' // someone opened a publisher page
  | 'gap_fixer_click'; // someone clicked through to / acted on Gap Fixer

type EventProps = Record<string, string | number | boolean | null>;

export function trackEvent(event: AnalyticsEvent, props?: EventProps): void {
  track(event, props);
}

/** Keep free-text queries tidy and bounded before they leave the browser. */
export function normalizeQuery(query: string): string {
  return query.trim().slice(0, 80);
}
