# Tax the Richmen — Companion Website

The companion site for **Tax the Richmen**, a vintage-industrial economic strategy board game for 2–4
players. It is a static, frontend-only site with no backend, accounts, database or paid APIs. Everything
runs in the browser, including map generation and PDF export.

## Routes

| Route | Contents |
| --- | --- |
| `/` | Overview, terrain, turn structure, the 7 / Tax Inspector, map preview, components |
| `/how-to-play` | Fourteen guided steps, each with an interactive rules demo |
| `/rulebook` | Complete rules with search, a glossary, paper mode and every open playtest clarification |
| `/map-generator` | Classic, Balanced Random (seeded) and Custom boards; editor, validation and balance score, undo/redo, drag-to-swap, save/load, share link, PNG/SVG/JSON/PDF export |
| `/components` | Component catalogue with filters and a lightbox |
| `/print-export` | Twelve printables (boards, tile backs, number tokens, Steel deck, reference cards, rulebook, quick start), each with a preview, Print and PDF |
| `/3d-printing` | STL, 3MF and OpenSCAD downloads, print quantities, filament preview and A4 Steel Card sheets |

## Stack

Vite 8, React 19, React Router 8, TypeScript 7, Tailwind CSS 4, Zustand 5, Zod 4 and jsPDF 4 (lazy-loaded).
Tests use Vitest 5 with React Testing Library (jsdom) and Playwright 1.64.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm test` | Vitest unit and UI tests |
| `npm run test:e2e` | Playwright end-to-end tests (builds and previews on port 4173) |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run rules:md` | Regenerate `GAME_RULES_V1.md` from `src/data/` |
| `npm run assets:optimize` | Rebuild `public/assets/` from `art-source/` (see `ASSET_MANIFEST.md`) |
| `npm run printables:models` | Rebuild STL, 3MF, previews and zip packs with OpenSCAD |
| `npm run printables:cards` | Rebuild the A4 Steel Card and reference PDFs |

### Playwright browsers

The config uses Playwright's bundled Chromium by default. To use an installed browser instead, set
`PW_CHANNEL`:

```powershell
$env:PW_CHANNEL='chrome'; npm run test:e2e     # or 'msedge'
```

Otherwise run `npx playwright install chromium` once.

### Visual QA screenshots

`e2e/screenshots.spec.ts` is opt-in. It captures every route at 375, 768, 1024, 1440 and 1920 px into
`test-results/qa/`:

```powershell
$env:QA_SCREENS='1'; $env:PW_CHANNEL='chrome'; npx playwright test screenshots --project=desktop
```

Chrome full-page captures of the very tall homepage can leave image areas blank below the first
screens. This is a capture artefact; the live page renders them.

## Project layout

```
src/data/        Frozen game data (terrain, numbers, costs, resources, steel deck) and rules.ts — the single rules source
src/map/         Board geometry, Classic layout, seeded Balanced Random generator, validation, balance score
src/store/       Zustand stores (map editor with history, print jobs)
src/components/  Layout, board rendering, map-generator panels, interactive rules demos
src/pages/       One component per route
src/print/       Print host, document model (HTML + vector PDF), printable sheets, raster sheet PDFs
src/export/      Board sheet and PNG/SVG/PDF board export
e2e/             Playwright specs
art-source/      Image masters; public/assets/ holds the generated derivatives
```

## Game rules

The approved Version 1 mechanics are frozen. All rule text on the site, in the PDFs and in
[`GAME_RULES_V1.md`](GAME_RULES_V1.md) is derived from `src/data/rules.ts`. Open questions are labelled
**Playtest clarification required** and are never resolved by the site.

## Deployment

`dist/` is a static SPA. `vercel.json` and `public/_redirects` rewrite all paths to `index.html`.

## Documentation

- [`GAME_RULES_V1.md`](GAME_RULES_V1.md): generated rules reference
- [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md): artwork provenance and processing
- [`IMPLEMENTATION_REPORT.md`](IMPLEMENTATION_REPORT.md): what was built, test results and remaining tasks
- [`PRINTING_GUIDE.md`](PRINTING_GUIDE.md), [`ASSEMBLY_GUIDE.md`](ASSEMBLY_GUIDE.md), [`MODEL_CATALOG.md`](MODEL_CATALOG.md), [`PRINT_VALIDATION_REPORT.md`](PRINT_VALIDATION_REPORT.md): the physical set

## License

MIT, see [`LICENSE`](LICENSE).
