'use client';

import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';

type EventProps = Record<string, string | number | boolean | null>;

interface FilloutTriggerProps {
  buttonText: string;
  filloutId?: string;
  event?: AnalyticsEvent;
  eventData?: EventProps;
  className?: string;
}

/**
 * Fillout slider trigger. Pass `event` to fire a Vercel Analytics event when
 * the user clicks the rendered Fillout button. Tracks via the wrapper's
 * capture-phase click listener so Fillout's own handler can't swallow it.
 */
export function FilloutTrigger({
  buttonText,
  filloutId = '8qawy5VMrmus',
  event,
  eventData,
  className,
}: FilloutTriggerProps) {
  return (
    <div
      className={className}
      onClickCapture={() => {
        if (event) trackEvent(event, eventData);
      }}
    >
      <div
        data-fillout-id={filloutId}
        data-fillout-embed-type="slider"
        data-fillout-button-text={buttonText}
        data-fillout-slider-direction="right"
        data-fillout-inherit-parameters=""
        data-fillout-popup-size="medium"
      />
    </div>
  );
}
