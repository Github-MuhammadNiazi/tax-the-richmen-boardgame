# Assembly guide

All sizes are millimetres. The hex is flat-topped, 70 mm across the flats, and the next hex's centre is 70 mm away. Roads run toward the flats. Number chips, Offices and Establishments sit on the vertex axes, in the wedges between the roads.

Print `fit_calibration` before anything else. See `PRINTING_GUIDE.md`.

## Bases and toppers

1. Print 30 `hex_base` parts. One design covers every terrain.
2. Press a topper onto the three pegs. The oval peg faces one flat, so the topper cannot be turned to the wrong position.
3. Default finish: `topper_artwork` on every hex. Drop a 62 mm paper hex, cut from `hex-insert-template.pdf` and the terrain artwork, into the rebate.
4. Alternative finish: the relief topper for that terrain (`topper_city`, `topper_village`, and the rest). Use one finish per hex. The relief quantities match the board: 4 cities, 4 villages, 4 mines, 4 ports, 4 oil rigs, 4 mountains, 5 water, 1 tax office.
5. Optional `hex_clip` parts slide into the slots on the underside and tie two hexes together. They sit fully inside the base, so the tile still rests flat.

## Number chips

The round recess is 28 mm from the centre, on a vertex, clear of the road corridors. Print the chips from `number_chip_3` through `number_chip_11` in the counts on the 3D printing page. There is no 7. Ports use the extra 5, 6, 8 and 9.

Water and the Tax Office are not numbered. Their relief toppers have no chip seat. The shared artwork topper still has one, and it can stay empty.

## Hidden Mines and Mountains

Print 8 `hidden_cover` lids in the same filament. The outside, including the centre rivet, is identical.

1. Fit the Mine or Mountain topper (artwork or relief) and its number chip.
2. Lower the cover over the topper. It rests on the base lip and hides the terrain and the number.
3. Lift it by the finger scoop when the tile is revealed.

Do not print different covers for Mines and Mountains.

## Roads and pipelines

`road_segment` is 44 mm long. Centred on the line between two hexes, each end stops 13 mm from a hex centre. That leaves the chip, two Offices and the Inspector ring room in the middle.

The cobbles face up. A socket near one end takes a player flag; print the flag in that player's filament.

`pipeline_straight` is the same length, on a flat sleeper, with a tube and a valve. It is not a Road. Put it beside a Road if a route uses both. The rules have not settled whether one connection may hold both; that remains a playtest clarification.

`pipeline_coupling` joins two segments end to end. The bore is 0.35 mm larger than the tube, on the diameter.

## Offices, ownership and flags

On one topper, at the same time:

- The number chip, centred 28 mm out on a vertex.
- Two Offices, each 11 × 9 mm, centred 25 mm out on the vertices at 120° and 240°, with the long side across the wedge.
- One Establishment, 12 × 9.2 mm, centred 27 mm out on the opposite vertex, long side across the wedge.

The automated fit check uses those positions. Roads occupy 9 mm wide corridors toward the flats and stop 13 mm from the centre.

The Office is the tall brick building. The Establishment is the lower ownership marker. They do not share a shape.

`flag` and `flag_ship` use the same 3.2 mm peg. The ship flag is only larger in the pennant. Print flags in player colours; do not look for a red or blue STL.

## Markets, leases and bids

A Market sits on its Port, centred about 27 mm out on a free vertex, on the shared 12 × 10 mm plinth. Print another copy of a market file when two Ports choose the same specialization. The rules allow that.

`lease_token` marks the current lessee of a Rig. `bid_marker` is the auction tray: stack `resource_money` coins in it, one coin per Money of the bid. There is no separate token for each bid amount.

## Inspector and the ship

`tax_inspector` stands on its round base. The briefcase reaches the base, so the figure prints without supports. `inspector_hat` prints brim-down; press it onto the peg.

This Inspector is a CAD construction: a suited block figure with a ledger, a briefcase and a separate bowler hat. Blender was not available, so it is not a sculpted miniature. The silhouette is deliberate and printable. It is not a finished collectible sculpt.

`inspector_ring` (19 mm across) marks the occupied hex and stays inside the 13 mm centre keep, clear of the road ends.

`winning_ship` is the victory marker. It fits on a hex by itself. It is not expected to share the Port with a Market, roads and a chip all at once. The stern socket takes either flag.

## Coins and resources

Steel Coins are 18 mm with a raised 1. Money coins are 15 mm with no numeral. Fifty Steel Coins is a practical supply, not a rule. The same is true of the wood, metal, fuel and stone tokens.

`dice`, `card_holder` and `token_tray` are optional.

## Cards

Print the A4 PDFs at 100% scale. Cut Steel Cards on the crop marks. For duplex, flip the paper on the long edge; the back pages are already mirrored. The reference cards repeat the approved costs and leave playtest questions to the rulebook.
