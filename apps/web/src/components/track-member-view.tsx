'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  name: string;
  indexValue: number;
}

/**
 * Fires a `publisher_view` event with the publisher's literal name so we can
 * see which publisher pages people actually open. Re-fires when the name
 * changes (client-side nav between two publisher pages reuses this component).
 */
export function TrackMemberView({ name, indexValue }: Props) {
  useEffect(() => {
    trackEvent('publisher_view', { name, indexValue });
  }, [name, indexValue]);

  return null;
}
