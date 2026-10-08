# ShowTracker design

Dark and calm. Posters and backdrops bring the colour; the interface stays quiet.

## Colour (CSS variables in `src/styles.scss`, mapped in `tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `bg` | #111214 | Page |
| `surface` | #18191C | Cards, lists, inputs |
| `raised` | #202125 | Menus, hover, skeletons |
| `line` | #EDE9E3 at 6-14% | Borders, dividers |
| `ink` / `ink-muted` / `ink-faint` | #EDE9E3 / #A09B93 / #6E6B65 | Text levels |
| `accent` | #E8A33D | One primary action per view, active states, stars, progress |
| `danger` | #E5675A | Destructive actions, errors |

Charts use a deeper amber (#C2802A, validated for the dark surface) and the accent on hover. One hue, no legend for single series, table view available.

## Type

Inter Variable (self-hosted). 15px body. Page titles 28-34px semibold with slight negative tracking. Section titles 18px. Labels 13px. Eyebrows 11px uppercase.

## Shapes and spacing

Cards 10px radius, posters 8px, buttons and inputs 8px, chips full round. 1px borders, no shadows except menus and dialogs. Gradients only as scrims over images.

## Components

`.btn-primary` (amber, one per view), `.btn-secondary`, `.btn-ghost`, `.chip` / `.chip-on`, `.tag`, `.card`, `.input`, `.select`, `.poster`, `.skeleton`.
Shared Angular components: `app-icon` (Lucide paths), `app-poster-card`, `app-media-row`, `app-poster-grid`, `app-rating` (half stars, keyboard), `app-trailer-dialog`, `app-empty`.

## Rules

- Never use the accent for decoration; it marks the action or the state.
- Every list has a loading skeleton and an empty state with a next step.
- Icons are 16-20px, stroke 1.75.
- Mobile: bottom tab bar, horizontal rows scroll with snap, all actions reachable at 390px wide.
