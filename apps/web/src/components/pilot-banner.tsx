'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

const VISIBLE_MS = 15_000;

export function PilotBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-brand-rule bg-brand-mist text-brand-ink">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-8">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-signal" aria-hidden="true" /> Pilot
          </span>
          <span>
            <strong>Nexus Gap Fixer is open for pilots.</strong>
            <span className="hidden sm:inline"> Self-hosted, AGPL, no vendor lock-in. $1/article — sustenance only, to keep the project alive.</span>
          </span>
          <Link
            href="/gap-fixer"
            onClick={() => trackEvent('gap_fixer_click', { location: 'pilot_banner' })}
            className="rounded font-semibold underline decoration-brand-signal underline-offset-2 hover:decoration-brand-ink"
          >
            Learn more &rarr;
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-brand-primary hover:bg-brand-paper"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
