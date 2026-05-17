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
    <div className="border-b border-amber-300 bg-amber-100 text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
            Pilot
          </span>
          <span>
            <strong>Nexus Gap Fixer is open for pilots.</strong> Self-hosted, AGPL,
            no vendor lock-in. $1/article — sustenance only, to keep the project alive.
          </span>
          <Link
            href="/gap-fixer"
            onClick={() => trackEvent('gap_fixer_click', { location: 'pilot_banner' })}
            className="font-semibold underline decoration-amber-700 underline-offset-2 hover:text-amber-950"
          >
            Learn more &rarr;
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-amber-800 hover:bg-amber-200 hover:text-amber-950"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
