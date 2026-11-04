# Printing guide

These files are for FDM printers, with Bambu Lab machines as the primary target. They are ordinary meshes. Bambu Studio slices them. Nothing in this set is pre-sliced G-code, and the 3MF files are not Bambu Studio projects.

## Before the full set

1. Print `fit_calibration.stl` in the material and at the layer height you intend to use.
2. Try the plain peg in the three round holes, and the oval peg in spirit: the holes are 0.20, 0.30 and 0.45 mm larger than the peg, measured on the diameter.
3. The middle hole is the design clearance (`hole_clearance` and `flag_clearance` in `printables/cad/lib.scad`).
4. If the peg is tight on your machine, raise that number and run `npm run printables:models`.

No physical test print has been made here, so these clearances are a starting point, not a measured fit.

## Printers

| Profile | Build area | What changes |
| --- | --- | --- |
| Compact | 180 × 180 mm | Every part fits on its own. This is the design target. |
| Standard | 256 × 256 mm | The same parts. You can place more copies on one plate. |

Pick the printer inside Bambu Studio. Do not expect the file to select a nozzle, an AMS unit or a filament preset.

## Suggested baseline

- Material: PLA. PETG is a reasonable alternative for the hex clips, pipeline couplings and card holders, where a little toughness helps.
- Nozzle: 0.4 mm. A 0.2 mm nozzle is optional for the number chips, Steel Coins and the Inspector.
- Layer height: 0.2 mm. Use 0.12 mm where the page says the part is fine detail.
- Walls: the models keep structural walls at or above 1.2 mm. Use 2 or 3 perimeters.
- Supports: none for the orientations listed in the catalog. The Inspector's hat is a separate piece printed brim-down so the brim needs no support.
- Infill: 15–20% is enough for tokens and tiles. Use more for the hex bases if you want them heavier.

Print times and filament weights are not stated. They depend on the slicer, the printer and how many copies you arrange. Measure them in Bambu Studio.

## Opening a file in Bambu Studio

1. File → Open, and choose the STL or the 3MF.
2. Select your printer and a filament. Colour is only a suggestion on the website.
3. Set the layer height and confirm the orientation matches the catalog. The part should already be sitting on the bed in the recommended orientation.
4. Duplicate the part until you reach the quantity in the bill of materials. The download contains one mesh, not one mesh per copy.
5. Slice, look at the preview, then print.

A 3MF opened this way is a single mesh (or a mesh package). It will not restore a saved Bambu project, paint, or support plan.

## Scale

Hex bases are 70 mm across the flats. Adjacent hex centres are 70 mm apart, matching the flat-top board in the map generator. Do not scale individual parts: the pegs, the roads and the chips are designed to that pitch.

The 60 × 85 mm Steel Cards are a prototype paper size. Print those PDFs at 100% scale. They are not the 63 × 88 mm sheets from the on-screen print studio.

## What was not verified

- A physical print on a Bambu Lab machine.
- Opening the 3MF files inside Bambu Studio.
- Self-intersection beyond the watertight, winding and single-shell checks in `PRINT_VALIDATION_REPORT.md`.
- Real filament mass or time.
