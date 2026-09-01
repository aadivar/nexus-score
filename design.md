# Design — Nexus-Index

A locked design system for the portal, derived from the Indigo Mono Remix brand
guidelines and informed by the public Annexis visual language. Every route uses
the same palette, typography, spacing, control voice, and interaction rules.

## Genre

Modern-minimal, technical, and calm. The portal should feel familiar before it
feels branded: clear hierarchy, quiet surfaces, and minimal visual theatre.

## Organising idea

Monochrome carries the message. Signal green marks the primary action, focus,
progress, positive movement, or selected data. It is not decorative fill.

## Macrostructure family

- Marketing/home: Focused Search — a compact single-column introduction with the
  primary search as the visual anchor and small inline facts beneath it.
- App/data routes: Workbench — functional headings, dense data surfaces, crisp
  frames, and direct actions.
- Methodology/legal/content routes: Long Document — readable measure, restrained
  headings, and negative space instead of decorative cards.

## Theme

- Paper: `#FFFFFF` / `oklch(100% 0 0)`
- Ink: `#020817` / `oklch(13.627% 0.03641 259.2)`
- Signal: `#00AA3E` / `oklch(64.299% 0.19056 147.1)`
- Primary control: `#0F172A`
- Mist: `#F1F5F9`
- Border: `#E2E8F0`
- Dark foundation: `#0D0D0D`
- Dark card: `#141414`
- Dark raised: `#313131`
- Dark border: `#1E293B`
- Dark type: `#F8FAFC`
- Dark muted: `#94A3B8`

The target ratio is 70% field, 20% surface, 8% structure, and no more than 2%
Signal green in any viewport.

## Typography

- Display: system sans, weight 600, roman, tight tracking.
- Body/UI: system sans, weight 400, 16px minimum.
- Outlier/data: system mono, used only for code and identifiers—not the wordmark,
  headings, labels, or marketing statistics.
- Display tracking: `-0.06em` for the hero and `-0.03em` for section headings.
- Body measure: 45–75 characters; default 65ch.
- Tabular numbers for scores, ranks, dates, and percentages.

The system-sans stack follows Annexis directly and keeps the dense data portal
coherent without another font dependency.

## Spacing

Use the named 4-point scale in `tokens.css`. Page gutters are fluid and every
route keeps at least 16px inline space at 320px.

## Motion

- Motion is cut by default.
- Hover and press feedback may use transform/opacity only.
- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`.
- Reduced motion: spatial movement collapses to a maximum 150ms opacity change.

## Microinteractions stance

- Focus is immediate and always uses Signal green.
- Success is quiet and inline.
- Loading preserves label geometry.
- Touch targets are at least 44px.
- Controls keep a constant border width in every state.

## CTA voice

- Primary action: Ink fill, Paper text, compact pill or 8px radius; Signal may
  appear as a small arrow, focus ring, or progress cue.
- Secondary action: Paper fill, Ink text, crisp Border outline.
- Links: Ink by default; Signal appears on hover/focus or for the one selected
  item.

## Navigation and footer

- Navigation: N1b three-section structure, always-solid, five real destinations,
  no dropdowns. Mobile keeps the wordmark and a compact set of icon-labelled
  destinations.
- Footer: Ft2 inline-rule close; credits, legal links, data source, and citation
  remain visible without a sitemap grid.

## Per-page allowances

- Marketing pages use typography and functional controls only; no standalone
  proof panel or decorative imagery.
- App/data pages must let the data carry the page.
- Content pages are typography-only.
- Existing dimension colours may remain only when they are necessary data-series
  encodings inside charts; brand chrome, controls, labels, cards, and page
  surfaces remain monochrome plus Signal.

## What pages MUST share

- The Nexus-Index wordmark and connected-node mark.
- Paper, Ink, graphite, and Signal tokens.
- Display/body/outlier font roles.
- Button, input, link, table, focus, and selected-state treatments.
- Crisp rules, restrained 8px radii, and one subtle shadow at most.

## What pages MAY differ on

- Content density and the chosen macrostructure within its page family.
- Whether the dominant field is Paper or graphite.
- Data visualisation encodings where accessibility requires multiple series.

## Exports

### `tokens.css`

`tokens.css` at the project root is the source of truth and contains the complete
light/dark token set.

### Tailwind v4 `@theme`

```css
@theme inline {
  --color-paper: var(--color-paper);
  --color-paper-2: var(--color-paper-2);
  --color-paper-3: var(--color-paper-3);
  --color-rule: var(--color-rule);
  --color-rule-2: var(--color-rule-2);
  --color-muted: var(--color-muted);
  --color-neutral: var(--color-neutral);
  --color-ink-2: var(--color-ink-2);
  --color-ink: var(--color-ink);
  --color-signal: var(--color-signal);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-outlier: var(--font-outlier);
  --radius-card: var(--radius-card);
  --radius-input: var(--radius-input);
  --ease-out: var(--ease-out);
}
```

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(100% 0 0)", "$type": "color" },
    "ink": { "$value": "oklch(13.627% 0.03641 259.2)", "$type": "color" },
    "signal": { "$value": "oklch(64.299% 0.19056 147.1)", "$type": "color" },
    "mist": { "$value": "oklch(96.826% 0.00685 247.9)", "$type": "color" },
    "border": { "$value": "oklch(92.876% 0.01262 255.51)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "outlier": { "$value": "ui-monospace, SFMono-Regular, Menlo, monospace", "$type": "fontFamily" }
  },
  "space": {
    "sm": { "$value": "1rem", "$type": "dimension" },
    "md": { "$value": "1.5rem", "$type": "dimension" },
    "lg": { "$value": "2rem", "$type": "dimension" }
  },
  "duration": {
    "micro": { "$value": "120ms", "$type": "duration" },
    "short": { "$value": "220ms", "$type": "duration" },
    "long": { "$value": "420ms", "$type": "duration" }
  }
}
```

### shadcn/ui variables

```css
:root {
  --background: 100% 0 0;
  --foreground: 13.627% 0.03641 259.2;
  --card: 98.415% 0.00341 247.86;
  --card-foreground: 13.627% 0.03641 259.2;
  --primary: 13.627% 0.03641 259.2;
  --primary-foreground: 100% 0 0;
  --secondary: 96.826% 0.00685 247.9;
  --secondary-foreground: 20.768% 0.03982 265.75;
  --muted: 92.876% 0.01262 255.51;
  --muted-foreground: 55.439% 0.04072 257.42;
  --accent: 64.299% 0.19056 147.1;
  --accent-foreground: 13.627% 0.03641 259.2;
  --border: 92.876% 0.01262 255.51;
  --input: 92.876% 0.01262 255.51;
  --ring: 64.299% 0.19056 147.1;
  --radius: 0.5rem;
}
```
