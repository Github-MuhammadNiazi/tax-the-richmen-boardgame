# Asset Manifest

Every image on the site is either a generated concept render made for this project or procedural
vector artwork drawn in code. No stock photography and no third-party images are used.

**Concept renders are not photographs of a manufactured game.** They visualise the intended
vintage-industrial (1920s–50s) prototype set. Where physical sizes appear, they are labelled as
prototype proposals; no manufacturing specification has been approved.

## Pipeline

Masters live in `art-source/` (JPEG). `npm run assets:optimize` (`scripts/optimize-assets.mjs`, using
sharp) writes all derivatives into `public/assets/`. Never edit the derivatives by hand.

| Group | Master size | Derivatives | Processing |
| --- | --- | --- | --- |
| Terrain tiles + tile back | 1024 × 1024 | `terrain/*.webp` 512 px (q80); `print/*.jpg` 1024 px (q88 mozjpeg) | Shared colour grade (saturation 0.86, brightness 0.97, gamma 1.04) so all 31 images read as one printed set |
| Components | 1152 × 864 | `components/*.webp` 1200 px wide (q82); `*-sm.webp` 640 px (q78) | The 1200 px version is a slight upscale of the master |
| Hero | 1280 × 720 | `hero/hero-board.webp` 1920 px (q82, lanczos3 + light sharpen); `hero-board-sm.webp` 960 px; `public/og-image.jpg` 1200 × 630 | **The 1920 px hero is upscaled 1.5× from the master** and is softer than a native render |

## Terrain artwork (top-down, 30 tiles + 1 back)

| Terrain | Files | Count |
| --- | --- | ---: |
| City | `terrain-city-1…4` | 4 |
| Village | `terrain-village-1…4` | 4 |
| Mine | `terrain-mine-1…4` | 4 |
| Mountain | `terrain-mountain-1…4` | 4 |
| Port | `terrain-port-1…4` | 4 |
| Oil Rig | `terrain-oil-1…4` | 4 |
| Water | `terrain-water-1…5` | 5 |
| Tax Office | `terrain-tax-1` | 1 |
| Concealed tile back (Mine/Mountain) | `tile-back-hidden` | 1 |

Variant names and alt text are defined in `src/data/terrain.ts`. `terrain-water-4` compresses to a much
smaller file (3 KB WebP) because its master has very little texture; it renders correctly.

## Component concept renders

| File | Used for |
| --- | --- |
| `comp-road` | Road |
| `comp-pipeline` | Pipeline |
| `comp-ownership-marker` | Ownership Marker |
| `comp-office` | Office |
| `comp-lease-bid` | Oil Rig Lease **and** Bid Marker (one shared image) |
| `comp-market-wood/metal/fuel/stone` | Port Markets (Sawmill, Foundry, Fuel Depot, Quarry Workshop) |
| `comp-steel-cards` | Steel Cards |
| `comp-steel-coins` | Steel Coins |
| `comp-steel-vault` | Steel Vault |
| `comp-resource-tokens` | Resource Tokens |
| `comp-dice-upgrade` | Upgrade Gear **and** Dice (one shared image) |
| `comp-tax-inspector` | Tax Inspector |
| `comp-winning-ship` | Winning Ship |
| `hero-board` | Homepage hero, Open Graph image |

Captions and alt text are in `src/data/components.ts`. Rendered text inside a concept image (for
example numbers on cards or markers) is not authoritative: game values always come from `src/data/`.

## Procedural vector artwork (drawn in code, not photorealistic)

| Artwork | Source |
| --- | --- |
| Board frame, hex clipping, number discs, Port and Inspector markers | `src/components/board/BoardArt.tsx`, `TileArt.tsx` |
| Printable board sheet (A3) | `src/export/BoardSheet.tsx` |
| Steel card faces and backs, number-token sheet, tile-back sheet | `src/print/sheets.tsx` |
| Rules demos (roads, tolls, market, inspector, dice, steel) | `src/components/demos/` |
| Favicon | `public/favicon.svg` |

## Fonts

| Font | Package | Licence |
| --- | --- | --- |
| Cinzel | `@fontsource/cinzel` | SIL Open Font License 1.1 |
| Inter | `@fontsource/inter` | SIL Open Font License 1.1 |

The vector PDFs use jsPDF's built-in Times and Helvetica fonts.

## Printable models

Not photographs and not pictures of models. `printables/cad/` is the OpenSCAD source. `npm run printables:models` writes the meshes, previews and zip archives into `public/printables/`.

| Output | Path |
| --- | --- |
| STL and generic 3MF | `public/printables/models/` |
| Geometry-derived previews | `public/printables/renders/` |
| OpenSCAD source served to the browser | `public/printables/cad/` |
| Zip packs | `public/printables/bundles/` |
| A4 Steel Cards, reference cards, hex-insert template | `public/printables/cards/` |

The 3MF files are core-spec meshes, not Bambu Studio projects. The previews are shaded views of those meshes. The Inspector is a CAD construction, not a sculpt. See `PRINT_VALIDATION_REPORT.md`.

## Icons

`lucide-react` (ISC licence).
