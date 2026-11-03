import { TERRAIN, TERRAIN_TYPES, type TerrainType } from '../data/terrain';
import { createRng } from '../lib/rng';
import { analyzeMap, connectedComponents, type MapAnalysis } from './analysis';
import { assignVariants } from './classic';
import { SLOT_COUNT } from './geometry';
import { assignNumbers } from './numbering';
import type { BoardMap, GenerationReport, MapTile } from './types';

export const DEFAULT_CANDIDATES = 240;
export const ACCEPT_SCORE = 90;

export function terrainBag(): TerrainType[] {
  return TERRAIN_TYPES.flatMap((t) => Array.from({ length: TERRAIN[t].count }, () => t));
}

export interface GenerateOptions {
  /** Tiles to preserve exactly (terrain, variant, number). Used by "regenerate unlocked". */
  locked?: MapTile[];
  maxCandidates?: number;
}

export interface GenerateResult {
  map: BoardMap;
  analysis: MapAnalysis;
  report: GenerationReport;
}

/**
 * Seeded candidate loop:
 *   1. shuffle terrain into open slots  2. counts are exact by construction
 *   3. hidden types fall out of the shuffle  4. assign numbers  5–6. analyse & score
 *   7. reject candidates with hard errors  8. keep the best acceptable candidate.
 * Bounded: stops after `maxCandidates` or once a candidate reaches ACCEPT_SCORE after a minimum sample.
 */
export function generateBalanced(seed: string, opts: GenerateOptions = {}): GenerateResult {
  const rng = createRng(`balanced:${seed}`);
  const maxCandidates = opts.maxCandidates ?? DEFAULT_CANDIDATES;
  const locked = new Map((opts.locked ?? []).map((t) => [t.slot, { ...t, locked: true }]));

  const bag = terrainBag();
  for (const t of locked.values()) {
    const i = bag.indexOf(t.terrain);
    if (i >= 0) bag.splice(i, 1);
  }
  const openSlots = Array.from({ length: SLOT_COUNT }, (_, i) => i).filter((s) => !locked.has(s));
  // If locked tiles over-use a terrain, pad with remaining types so the board stays full.
  while (bag.length < openSlots.length) bag.push('water');
  bag.length = openSlots.length;

  let best: { tiles: MapTile[]; analysis: MapAnalysis; valid: boolean } | null = null;
  let tried = 0;
  let valid = 0;
  const minSample = Math.min(60, maxCandidates);

  for (let i = 0; i < maxCandidates; i++) {
    tried++;
    const shuffled = rng.shuffle(bag);
    let tiles: MapTile[] = Array.from({ length: SLOT_COUNT }, (_, slot) => {
      const l = locked.get(slot);
      if (l) return l;
      return { slot, terrain: shuffled[openSlots.indexOf(slot)], variant: 0, number: null, revealed: false, locked: false };
    });

    // Cheap pre-check before numbering: reject disconnected land immediately.
    const pre = quickTopologyOk(tiles);
    if (!pre && best?.valid) continue;

    tiles = assignVariants(tiles, rng);
    tiles = assignNumbers(tiles, rng, 24);
    const analysis = analyzeMap(tiles);
    const isValid = analysis.errors.length === 0;
    if (isValid) valid++;
    const better =
      !best ||
      (isValid && !best.valid) ||
      (isValid === best.valid && analysis.score > best.analysis.score);
    if (better) best = { tiles, analysis, valid: isValid };
    if (best!.valid && best!.analysis.score >= ACCEPT_SCORE && tried >= minSample) break;
  }

  const finalTiles = best!.tiles.map((t) => ({ ...t, locked: locked.has(t.slot) }));

  return {
    map: { version: 1, name: 'Balanced Random Board', mode: 'balanced', seed, tiles: finalTiles },
    analysis: best!.analysis,
    report: { candidatesTried: tried, candidatesValid: valid, bestScore: best!.analysis.score, fallback: !best!.valid },
  };
}

function quickTopologyOk(tiles: MapTile[]): boolean {
  return connectedComponents(tiles).length === 1;
}
