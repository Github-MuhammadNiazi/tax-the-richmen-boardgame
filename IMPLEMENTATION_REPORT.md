# Implementation Report

Status as of 3 November 2026. All six routes are implemented and working. Only results that actually ran
are reported below.

## Delivered

| Area | Status |
| --- | --- |
| Design system (vintage-industrial tokens, Cinzel/Inter, brass/steel/ivory palette) | Done |
| Artwork: 30 terrain renders + tile back, 16 component renders, hero; procedural SVG board, tokens and cards | Done (see `ASSET_MANIFEST.md`) |
| Frozen data modules and the single rules source `src/data/rules.ts` (12 playtest clarifications) | Done |
| Map engine: geometry, Classic layout, seeded Balanced Random, number assignment, validation, balance score | Done |
| `/` Homepage | Done |
| `/how-to-play` — 14 steps with interactive demos (roads, tolls, market, inspector, dice, steel) | Done |
| `/rulebook` — search, glossary, paper mode, clarifications | Done |
| `/map-generator` — editor, drag-to-swap, undo/redo, validation, save/load, share link, PNG/SVG/JSON/PDF/print | Done |
| `/components` — catalogue, filters, lightbox | Done |
| `/print-export` — 12 printables with preview, print and PDF | Done |
| SEO: per-route title and description, Open Graph image, `robots.txt`, `sitemap.xml`, SPA rewrites | Done |
| Docs: README, GAME_RULES_V1 (generated, sync-tested), ASSET_MANIFEST, this report | Done |

### Printables

| Printable | Print | PDF |
| --- | --- | --- |
| Classic board, generated board (A3 landscape) | Yes | Yes (raster) |
| Concealed tile backs (8 backs, 2 × A4) | Yes | Yes (raster, 150 dpi) |
| Number tokens (24 discs, 1 × A4) | Yes | Yes (raster, 150 dpi) |
| Steel deck (20 faces + backs, 4 × A4) | Yes | Yes (raster, 150 dpi) |
| Player reference, Road & Pipeline, Port Market, Oil bidding, Tax Inspector, quick start | Yes | Yes (vector text) |
| Complete rulebook (9 pages) | Yes | Yes (vector text) |

Physical sizes on the sheets (76 mm flat-to-flat hexes, 28 mm tokens, 63 × 88 mm cards) are printed as
**prototype proposals**, not manufacturing specifications.

## Test results (run on 3 November 2026, Windows, Node, Chrome channel)

| Suite | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc -b` | No errors |
| Vitest (unit + RTL UI), 6 files | `npx vitest run` | **76 passed, 0 failed** |
| Playwright desktop (1440 × 900) + mobile (Pixel 7) | `$env:PW_CHANNEL='chrome'; npx playwright test` | **32 passed, 0 failed, 18 skipped** |
| Production build | `npm run build` | Succeeds. Main JS 313 kB (101 kB gzip); jsPDF 400 kB, lazy-loaded only on export |
| Visual QA captures | `QA_SCREENS=1 … screenshots --project=desktop` | 5 widths × 6 routes captured and reviewed |

The 18 skips are by design: 10 opt-in screenshot tests (desktop and mobile × 5 widths) and 8 tests
restricted to a single project, such as drag-and-drop on desktop only and the mobile menu on mobile only.

Playwright covers the following: every route renders without console errors and has title/meta; SPA
deep links; no horizontal overflow at 375/768/1024/1440/1920; the mobile menu; the skip link; rulebook
search; seed reproducibility; drag-to-swap; PNG/SVG/JSON downloads; rulebook and Steel deck PDF
downloads; component images and the lightbox.

### Fixed during QA

- Mobile menu panel was trapped under content by the header's `backdrop-filter`; it was moved outside the header.
- 163 px horizontal overflow at 375 px, caused by the screen-reader dice table; it is now wrapped in an `sr-only` container.
- Primary nav wrapped at 1024 px; the breakpoint moved to `xl` with `nowrap` links.
- Components copy said "twenty-nine" artworks; corrected to thirty.
- Steel card skyline overlapped the card text, and PDF note labels overlapped body text; both were re-laid out.
- Print race: a superseded print job could leave a stale `@page` rule. Jobs are now token-based.

## Not done / known limitations

- [ ] **Lighthouse / axe audits were not run.** Accessibility work is structural: landmarks, skip link, labelled
      controls, `role=radio` groups, keyboard navigation of the board, screen-reader dice table and reduced
      motion. It has not been verified with an automated auditor or a screen reader.
- [ ] Real-device testing (iOS Safari, Android Chrome) was not performed; mobile coverage is Playwright's Pixel 7 emulation.
- [ ] Physical print test on paper at 100 % scale was not performed; sheet dimensions are verified only in the PDF/SVG coordinates.
- [ ] Board sheet (A3) legend leaves unused space at the bottom of the panel (cosmetic).
- [ ] Hero image is upscaled 1.5× from a 1280 px master; a native ≥ 1920 px master would be sharper.
- [ ] Chrome full-page screenshots of the homepage show blank image areas below the first screens. This is a capture
      artefact; the live page renders them, which was checked in the browser.
- [ ] 12 rules questions remain **Playtest clarification required** (listed in `GAME_RULES_V1.md`). They need a
      designer decision; the site intentionally does not resolve them. The demos label the one interpretation they
      must display (the Mountain road surcharge).
- [ ] No store, price, release date, publisher or social links are shown, because none have been provided.

## Resuming work

1. `npm install`, then `npm test` and `$env:PW_CHANNEL='chrome'; npm run test:e2e` to confirm a green baseline.
2. After any change to `src/data/`, run `npm run rules:md` (the Vitest sync test fails otherwise).
3. Work through the unchecked items above.
