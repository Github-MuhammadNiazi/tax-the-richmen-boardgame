import { TERRAIN_TYPES, type TerrainType } from '../data/terrain';
import { SLOT_COUNT } from './geometry';
import { boardMapSchema } from './schema';
import type { BoardMap, MapMode } from './types';

/**
 * Compact URL encoding: "1.<mode>.<seed>.<30×4 chars>"
 * Each tile: terrain letter, variant digit, number in base-16 (0 = none), flags digit (1 revealed, 2 locked).
 */
const TERRAIN_CODE: Record<TerrainType, string> = {
  city: 'c',
  village: 'v',
  mine: 'm',
  mountain: 'n',
  port: 'p',
  oil: 'o',
  water: 'w',
  tax: 't',
};
const CODE_TERRAIN = Object.fromEntries(Object.entries(TERRAIN_CODE).map(([k, v]) => [v, k])) as Record<string, TerrainType>;
const MODE_CODE: Record<MapMode, string> = { classic: 'c', balanced: 'b', custom: 'x' };
const CODE_MODE = Object.fromEntries(Object.entries(MODE_CODE).map(([k, v]) => [v, k])) as Record<string, MapMode>;

export function encodeMap(map: BoardMap): string {
  const tiles = [...map.tiles].sort((a, b) => a.slot - b.slot);
  const body = tiles
    .map(
      (t) =>
        TERRAIN_CODE[t.terrain] +
        String(t.variant) +
        (t.number == null ? '0' : t.number.toString(16)) +
        String((t.revealed ? 1 : 0) + (t.locked ? 2 : 0)),
    )
    .join('');
  const seed = map.seed.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40) || 'CUSTOM';
  return `1.${MODE_CODE[map.mode]}.${seed}.${body}`;
}

export function decodeMap(code: string): BoardMap | null {
  const parts = code.split('.');
  if (parts.length !== 4 || parts[0] !== '1') return null;
  const [, modeCode, seed, body] = parts;
  const mode = CODE_MODE[modeCode];
  if (!mode || body.length !== SLOT_COUNT * 4) return null;
  const tiles = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const chunk = body.slice(i * 4, i * 4 + 4);
    const terrain = CODE_TERRAIN[chunk[0]];
    const variant = Number(chunk[1]);
    const num = parseInt(chunk[2], 16);
    const flags = Number(chunk[3]);
    if (!terrain || !TERRAIN_TYPES.includes(terrain) || Number.isNaN(variant) || Number.isNaN(num) || Number.isNaN(flags)) {
      return null;
    }
    tiles.push({ slot: i, terrain, variant, number: num === 0 ? null : num, revealed: (flags & 1) === 1, locked: (flags & 2) === 2 });
  }
  const candidate = {
    version: 1 as const,
    name: mode === 'classic' ? 'Shared Classic Board' : mode === 'balanced' ? 'Shared Balanced Board' : 'Shared Custom Board',
    mode,
    seed,
    tiles,
  };
  const parsed = boardMapSchema.safeParse(candidate);
  return parsed.success ? (parsed.data as BoardMap) : null;
}

export function shareUrl(map: BoardMap, origin = window.location.origin): string {
  return `${origin}/map-generator?map=${encodeURIComponent(encodeMap(map))}`;
}

export function seedUrl(mode: 'classic' | 'balanced', seed: string, origin = window.location.origin): string {
  return `${origin}/map-generator?mode=${mode}&seed=${encodeURIComponent(seed)}`;
}
