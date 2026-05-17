'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';

type EventProps = Record<string, string | number | boolean | null>;

interface TrackProps {
  event: AnalyticsEvent;
  eventData?: EventProps;
}

/** A next/link that fires a Vercel Analytics event on click. */
export function TrackLink({
  event,
  eventData,
  onClick,
  ...rest
}: ComponentProps<typeof Link> & TrackProps) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventData);
        onClick?.(e);
      }}
    />
  );
}

/** A plain <a> (mailto / external) that fires a Vercel Analytics event on click. */
export function TrackAnchor({
  event,
  eventData,
  onClick,
  ...rest
}: ComponentProps<'a'> & TrackProps) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventData);
        onClick?.(e);
      }}
    />
  );
}
