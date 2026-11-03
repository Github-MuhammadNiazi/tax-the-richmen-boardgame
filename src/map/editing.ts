import { TERRAIN, TERRAIN_TYPES, type TerrainType } from '../data/terrain';
import { createRng } from '../lib/rng';
import { countTerrain } from './analysis';
import { assignVariants } from './classic';
import { assignNumbers } from './numbering';
import type { MapTile } from './types';

/** Pure editing operations. Each returns a new tile array; locked tiles are never modified by bulk operations. */

const replace = (tiles: MapTile[], slot: number, patch: Partial<MapTile>) =>
  tiles.map((t) => (t.slot === slot ? { ...t, ...patch } : t));

export function setTerrain(tiles: MapTile[], slot: number, terrain: TerrainType): MapTile[] {
  const def = TERRAIN[terrain];
  const current = tiles.find((t) => t.slot === slot);
  if (!current || current.locked || current.terrain === terrain) return tiles;
  const keepNumber = (def.numbered && TERRAIN[current.terrain].numbered) || (terrain === 'port' && current.terrain === 'port');
  const usedVariants = new Set(tiles.filter((t) => t.terrain === terrain).map((t) => t.variant));
  const variant = def.variants.findIndex((_, i) => !usedVariants.has(i));
  return replace(tiles, slot, {
    terrain,
    variant: variant < 0 ? 0 : variant,
    number: keepNumber ? current.number : null,
    revealed: false,
  });
}

/** Swaps two whole tiles (terrain, artwork and number token move together). */
export function swapTiles(tiles: MapTile[], a: number, b: number): MapTile[] {
  const A = tiles.find((t) => t.slot === a);
  const B = tiles.find((t) => t.slot === b);
  if (!A || !B || a === b || A.locked || B.locked) return tiles;
  return tiles.map((t) => {
    if (t.slot === a) return { ...B, slot: a, locked: false };
    if (t.slot === b) return { ...A, slot: b, locked: false };
    return t;
  });
}

/** Swaps only the number tokens of two hexes. */
export function swapNumbers(tiles: MapTile[], a: number, b: number): MapTile[] {
  const A = tiles.find((t) => t.slot === a);
  const B = tiles.find((t) => t.slot === b);
  if (!A || !B || a === b || A.locked || B.locked) return tiles;
  return tiles.map((t) => (t.slot === a ? { ...t, number: B.number } : t.slot === b ? { ...t, number: A.number } : t));
}

export function setNumber(tiles: MapTile[], slot: number, number: number | null): MapTile[] {
  const t = tiles.find((x) => x.slot === slot);
  if (!t || t.locked) return tiles;
  return replace(tiles, slot, { number });
}

export function setVariant(tiles: MapTile[], slot: number, variant: number): MapTile[] {
  const t = tiles.find((x) => x.slot === slot);
  if (!t || t.locked) return tiles;
  return replace(tiles, slot, { variant });
}

export function toggleLock(tiles: MapTile[], slot: number): MapTile[] {
  return tiles.map((t) => (t.slot === slot ? { ...t, locked: !t.locked } : t));
}

export function setAllLocks(tiles: MapTile[], locked: boolean): MapTile[] {
  return tiles.map((t) => ({ ...t, locked }));
}

export function toggleReveal(tiles: MapTile[], slot: number): MapTile[] {
  return tiles.map((t) => (t.slot === slot && TERRAIN[t.terrain].concealed ? { ...t, revealed: !t.revealed } : t));
}

export function setAllRevealed(tiles: MapTile[], revealed: boolean): MapTile[] {
  return tiles.map((t) => (TERRAIN[t.terrain].concealed ? { ...t, revealed } : t));
}

/** Converts surplus terrain on unlocked hexes into missing terrain so the quantities are exact again. */
export function repairCounts(tiles: MapTile[], seed: string): MapTile[] {
  const rng = createRng(`repair:${seed}`);
  const counts = countTerrain(tiles);
  const missing: TerrainType[] = [];
  for (const type of TERRAIN_TYPES) {
    for (let i = counts[type]; i < TERRAIN[type].count; i++) missing.push(type);
  }
  let out = tiles.map((t) => ({ ...t }));
  const queue = rng.shuffle(missing);
  for (const type of TERRAIN_TYPES) {
    let surplus = counts[type] - TERRAIN[type].count;
    if (surplus <= 0) continue;
    const candidates = rng.shuffle(out.filter((t) => t.terrain === type && !t.locked));
    for (const c of candidates) {
      if (surplus <= 0 || !queue.length) break;
      out = setTerrain(out, c.slot, queue.shift()!);
      surplus--;
    }
  }
  return repairNumbers(out, seed);
}

/** Re-deals numbers to unlocked hexes while honouring numbers on locked hexes. */
export function repairNumbers(tiles: MapTile[], seed: string): MapTile[] {
  const rng = createRng(`numbers:${seed}`);
  return assignNumbers(tiles, rng);
}

export function rerollVariants(tiles: MapTile[], seed: string): MapTile[] {
  return assignVariants(tiles, createRng(`variants:${seed}`));
}
