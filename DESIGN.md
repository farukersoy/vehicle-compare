# Design system — EV Compare

Principle: **very few numbers, large and clear.** Light, calm, lots of white
space, subtle borders. No gradients, no emoji, no brand colours on cards.

## Colour tokens

These are the only colours used in the app (defined in `src/app/globals.css`).

| Token | Hex | Use |
|---|---|---|
| `page` | `#F6F7F9` | Page background, image wells |
| `surface` | `#FFFFFF` | Cards, rows, inputs |
| `border` | `#E5E7EB` | All borders and dividers |
| `ink` | `#0B1F3A` | Text, icons, logos in the compare panel |
| `muted` | `#556274` | Secondary text, logos in picker rows |
| `accent` | `#0B1F3A` | Primary buttons, selected chips, selected rows, focus ring |
| `highlight` | `#E8772E` | Small highlights only: the reference identity bar, the active toggle marker. Never as text or a text background (white on it is only 2.9:1). |
| `positive` | `#0F7A5C` | Positive text (reference cheaper / better) |
| `positive-soft` | `#E8F5F0` | Tint behind the result sentence and difference values only |
| `negative` | `#B91C1C` | Negative text (compared car cheaper) |
| `negative-soft` | `#FDECEC` | Tint behind the result sentence and difference values only |
| `range` | `#0F7A5C` | Range badge background, with white text (5.3:1) |
| `monogram` | `#EEF1F5` | Background of brand monograms when no logo exists |

Colour is never the only signal: best values carry a check icon and the label
"bester Wert" / "best value"; differences carry a sign and a word.

## Type scale

Fonts: Space Grotesk (display), Inter (text), JetBrains Mono (figures in rows).

| Role | Size (mobile / ≥ sm) | Weight |
|---|---|---|
| Result sentence | 24 / 30 px | 600, display |
| CHF figures in the compare rows | 26 / 30 px | 600, display, tabular |
| Page title (h1) | 22 / 26 px | 600, display |
| Section heading (h2) | 18 / 20 px | 600, display |
| Body | 15 / 16 px | 400 |
| Labels, row values in the picker | 14 px | 500–600 |
| Captions, chips, badge caption | 12–13 px | 500–600 |

The result sentence and the CHF figures are always the largest text on the page.

## Spacing and shape

- 4 px base grid: 4, 8, 12, 16, 24, 32, 48.
- Page gutter 16 px (mobile), 24 px (≥ sm); content max width 1152 px.
- Radius **12 px** for cards, panels, rows, buttons and inputs; chips and the
  segmented toggle are fully rounded.
- Borders 1 px `border`; one soft ink-tinted shadow for cards only.

## Components

- **Compare panel** — two columns (reference | compared). Header per side:
  logo (28 px, ink), photo (16:10 well, `object-contain`, Symbolbild caption
  where it applies), brand + model, drive-type chip. Reference side: compact
  range badge and the orange identity bar. Then the result sentence, then four
  rows (cost/100 km, cost/year, CO₂, range), then a collapsed "Details" toggle.
- **Row** — label (with optional info button) + two value cells. ≥ 640 px: label
  column left; < 640 px: label above the two cells. Best cell: bold + check icon
  + sr-only "bester Wert".
- **Result sentence** — tinted box (`positive-soft` / `negative-soft`), text in
  `positive` / `negative`, number counts up (off with reduced motion).
- **Segmented toggle** (Zuhause / Öffentlich) — active segment: ink background,
  white text, orange underline marker. Caption below in 12 px muted.
- **Chip** — 44 px tall tap target, pill; selected = ink background, white text.
- **Picker row** — 44 px+ button: logo 20 px (muted), small photo, brand + model,
  type chip, CHF per 100 km at the vehicle's own default rate, difference vs the
  reference as tinted text. Selected = ink ring.
- **Range badge** — `range` background, white text, two lines max.
- **Brand mark** — inline SVG (Simple Icons, `currentColor`), else a monogram:
  rounded square `monogram` background, bold ink initials (1 letter for one
  word, 2 for two words).
- **Info button** — 44 px tap target, small "i" icon, toggles a short note.
- **Sticky bar** — slim bottom bar (ink background, white text) with both names
  and the key difference; appears when the panel leaves the viewport; tap
  scrolls back.

## Motion and accessibility

- Transitions 150–200 ms, ease-out; count-up 600 ms. All motion off with
  `prefers-reduced-motion: reduce`.
- WCAG AA contrast, tap targets ≥ 44 px, visible 2 px ink focus ring.
- Every image and logo has a text alternative; decorative icons are `aria-hidden`.
