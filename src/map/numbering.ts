import { HIGH_NUMBERS, LOW_NUMBERS, PORT_NUMBERS, isHighNumber, numberPool } from '../data/numbers';
import { TERRAIN, type TerrainType } from '../data/terrain';
import type { Rng } from '../lib/rng';
import { NEIGHBORS } from './geometry';
import type { MapTile } from './types';

export const NUMBERED_TERRAIN: TerrainType[] = ['city', 'village', 'mine', 'mountain', 'oil'];

function removeOne(pool: number[], n: number): boolean {
  const i = pool.indexOf(n);
  if (i < 0) return false;
  pool.splice(i, 1);
  return true;
}

/** Penalty used to choose between valid assignments: discourages identical or clustered high numbers. */
export function numberLayoutPenalty(tiles: MapTile[]): number {
  let penalty = 0;
  const bySlot = new Map(tiles.map((t) => [t.slot, t]));
  for (const t of tiles) {
    if (t.number == null || !TERRAIN[t.terrain].numbered) continue;
    for (const n of NEIGHBORS[t.slot]) {
      if (n < t.slot) continue;
      const o = bySlot.get(n);
      if (!o || o.number == null || !TERRAIN[o.terrain].numbered) continue;
      if (o.number === t.number) penalty += 4;
      else if (isHighNumber(o.number) && isHighNumber(t.number)) penalty += 1;
    }
  }
  for (const cat of NUMBERED_TERRAIN) {
    const nums = tiles.filter((t) => t.terrain === cat && t.number != null).map((t) => t.number!);
    penalty += (nums.length - new Set(nums).size) * 2;
  }
  return penalty;
}

/**
 * Assigns production numbers (2 high + 2 low per resource category) and unique Port numbers.
 * Tiles with `locked: true` keep their current number. Several shuffles are evaluated and the
 * layout with the lowest clustering penalty is kept, so results are deterministic per RNG state.
 */
export function assignNumbers(tiles: MapTile[], rng: Rng, attempts = 40): MapTile[] {
  let best: MapTile[] | null = null;
  let bestPenalty = Infinity;
  for (let i = 0; i < attempts; i++) {
    const candidate = assignOnce(tiles, rng);
    const p = numberLayoutPenalty(candidate);
    if (p < bestPenalty) {
      best = candidate;
      bestPenalty = p;
      if (p === 0) break;
    }
  }
  return best!;
}

function assignOnce(tiles: MapTile[], rng: Rng): MapTile[] {
  const out = tiles.map((t) => ({ ...t }));

  // Ports: unique 5, 6, 8, 9.
  const ports = out.filter((t) => t.terrain === 'port');
  const portPool: number[] = [...PORT_NUMBERS];
  for (const p of ports) {
    if (p.locked && p.number != null && removeOne(portPool, p.number)) continue;
    if (!p.locked) p.number = null;
  }
  const shuffledPorts = rng.shuffle(portPool);
  for (const p of ports) if (p.number == null) p.number = shuffledPorts.shift() ?? null;

  // Non-numbered terrain never carries a number.
  for (const t of out) if (!TERRAIN[t.terrain].numbered && t.terrain !== 'port') t.number = null;

  // Production numbers.
  const pool = numberPool();
  const numbered = out.filter((t) => TERRAIN[t.terrain].numbered);
  for (const t of numbered) {
    if (t.locked && t.number != null && removeOne(pool, t.number)) continue;
    t.number = null;
  }
  const high = rng.shuffle(pool.filter((n) => (HIGH_NUMBERS as readonly number[]).includes(n)));
  const low = rng.shuffle(pool.filter((n) => (LOW_NUMBERS as readonly number[]).includes(n)));

  for (const cat of rng.shuffle(NUMBERED_TERRAIN)) {
    const catTiles = numbered.filter((t) => t.terrain === cat);
    const open = rng.shuffle(catTiles.filter((t) => t.number == null));
    let highHave = catTiles.filter((t) => t.number != null && isHighNumber(t.number)).length;
    let lowHave = catTiles.filter((t) => t.number != null && !isHighNumber(t.number)).length;
    for (const t of open) {
      const wantHigh = highHave < 2 ? true : lowHave < 2 ? false : high.length >= low.length;
      if (wantHigh && high.length) {
        t.number = high.shift()!;
        highHave++;
      } else if (low.length) {
        t.number = low.shift()!;
        lowHave++;
      } else if (high.length) {
        t.number = high.shift()!;
        highHave++;
      }
    }
  }
  // Any leftover tiles (only when terrain counts are invalid) take whatever remains.
  const rest = rng.shuffle([...high, ...low]);
  for (const t of numbered) if (t.number == null && rest.length) t.number = rest.shift()!;
  return out;
}
