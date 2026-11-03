import { TERRAIN, type TerrainType } from '../data/terrain';
import { createRng, type Rng } from '../lib/rng';
import { COLUMN_COUNTS, SLOTS } from './geometry';
import { assignNumbers } from './numbering';
import type { BoardMap, MapTile } from './types';

export type ClassicCell = TerrainType | 'hidden';

/** The approved original arrangement, listed per column from top to bottom. */
export const CLASSIC_COLUMNS: ClassicCell[][] = [
  ['city', 'tax', 'city'],
  ['city', 'village', 'village', 'city'],
  ['hidden', 'village', 'water', 'village', 'hidden'],
  ['hidden', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden'],
  ['port', 'port', 'water', 'port', 'port'],
  ['water', 'oil', 'oil', 'water'],
  ['oil', 'water', 'oil'],
];

if (CLASSIC_COLUMNS.some((c, i) => c.length !== COLUMN_COUNTS[i])) {
  throw new Error('Classic layout does not match column counts');
}

/** Flattened Classic cells indexed by slot. */
export const CLASSIC_CELLS: ClassicCell[] = SLOTS.map((s) => CLASSIC_COLUMNS[s.col][s.row]);

export const CLASSIC_HIDDEN_SLOTS = CLASSIC_CELLS.flatMap((c, i) => (c === 'hidden' ? [i] : []));

/** Gives each tile of a terrain type a distinct artwork variant. */
export function assignVariants(tiles: MapTile[], rng: Rng): MapTile[] {
  const out = tiles.map((t) => ({ ...t }));
  const byType = new Map<TerrainType, MapTile[]>();
  for (const t of out) {
    if (t.locked) continue;
    byType.set(t.terrain, [...(byType.get(t.terrain) ?? []), t]);
  }
  for (const [type, list] of byType) {
    const count = TERRAIN[type].variants.length;
    const taken = new Set(out.filter((t) => t.locked && t.terrain === type).map((t) => t.variant));
    const free = rng.shuffle(Array.from({ length: count }, (_, i) => i).filter((i) => !taken.has(i)));
    list.forEach((t, i) => {
      t.variant = free.length ? free[i % free.length] : i % count;
    });
  }
  return out;
}

export function generateClassic(seed: string): BoardMap {
  const rng = createRng(`classic:${seed}`);
  const hiddenTypes = rng.shuffle<TerrainType>(['mine', 'mine', 'mine', 'mine', 'mountain', 'mountain', 'mountain', 'mountain']);
  let h = 0;
  let tiles: MapTile[] = CLASSIC_CELLS.map((cell, slot) => ({
    slot,
    terrain: cell === 'hidden' ? hiddenTypes[h++] : cell,
    variant: 0,
    number: null,
    revealed: false,
    locked: false,
  }));
  tiles = assignVariants(tiles, rng);
  tiles = assignNumbers(tiles, rng);
  return { version: 1, name: 'Classic Board', mode: 'classic', seed, tiles };
}
