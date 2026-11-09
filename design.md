# Laboratório Mundo Agro — Design

Inspiration: dark hero with radial glow, cream content sections, centered big headings, floating rounded cards with soft shadows. Colors taken from the logo (green → teal → blue).

## Colors
- `--ink` #062A2F — deep teal-navy, hero / dark sections
- `--ink-2` #0B3B41 — raised dark surfaces
- `--green` #11A04B — brand green (logo top)
- `--teal` #2BA89A — brand teal (logo middle)
- `--blue` #1673C4 — brand blue (logo bottom)
- `--mint` #7EE8B8 — CTA accent on dark (replaces template lime)
- `--cream` #F5F2EA — light section background
- `--paper` #FFFDF8 — cards on cream
- `--text` #0E1F22, muted #5B6B6D
- Brand gradient: `linear-gradient(135deg,#11A04B,#2BA89A 50%,#1673C4)`

## Typography
- Manrope (Google Fonts) 400–800. Display: 600 weight, tight tracking (-0.03em), 44–72px hero. Body 16px / 1.65.
- Eyebrow labels: 12px uppercase, 0.14em tracking, pill with border.

## Layout & components
- Max width 1200px, section padding 96–128px vertical.
- Cards: radius 20–28px, 1px border rgba(0,0,0,.06), shadow `0 20px 60px -30px rgba(6,42,47,.35)`.
- Buttons: pill (rounded-full), primary = mint on dark / ink on light; secondary = white.
- Hero: ink background + radial green/blue glows + subtle grain; tilted floating cards overlap into the cream section below.
- Motion: staggered fade-up on load (motion/react), hover lift on cards.
- Status timeline: vertical steps, gradient line for completed.
