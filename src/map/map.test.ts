import { describe, expect, it } from 'vitest';
import { NUMBER_DISTRIBUTION, PORT_NUMBERS, isHighNumber } from '../data/numbers';
import { TERRAIN, TERRAIN_TYPES } from '../data/terrain';
import {
  analyzeMap,
  articulationPoints,
  connectedComponents,
  countTerrain,
  disjointRoutes,
} from './analysis';
import { CLASSIC_COLUMNS, CLASSIC_HIDDEN_SLOTS, generateClassic } from './classic';
import { swapTiles, setTerrain, repairCounts } from './editing';
import { generateBalanced } from './generator';
import { COLUMN_COUNTS, NEIGHBORS, SLOTS, SQRT3, areAdjacent, boardLayout, slotAt } from './geometry';
import { NUMBERED_TERRAIN } from './numbering';
import { parseMapJson, serializeMap } from './schema';
import { decodeMap, encodeMap } from './share';
import type { MapTile } from './types';

const SEEDS = ['BRASS-0001', 'RIVET-1234', 'LEDGER-9999', 'FOUNDRY-4821', 'VAULT-0042'];

function numberFrequency(tiles: MapTile[]) {
  const f: Record<number, number> = {};
  for (const t of tiles) if (TERRAIN[t.terrain].numbered && t.number != null) f[t.number] = (f[t.number] ?? 0) + 1;
  return f;
}

describe('geometry', () => {
  it('has exactly 30 slots in columns of 3,4,5,6,5,4,3', () => {
    expect(SLOTS).toHaveLength(30);
    expect([...COLUMN_COUNTS]).toEqual([3, 4, 5, 6, 5, 4, 3]);
    COLUMN_COUNTS.forEach((n, col) => expect(SLOTS.filter((s) => s.col === col)).toHaveLength(n));
  });

  it('centres each column vertically (symmetric footprint)', () => {
    for (let col = 0; col < 7; col++) {
      const ys = SLOTS.filter((s) => s.col === col).map((s) => s.y);
      expect(ys.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 9);
    }
  });

  it('adjacency matches flat-top centre distance √3', () => {
    for (const a of SLOTS) {
      for (const b of SLOTS) {
        if (a.index === b.index) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(areAdjacent(a.index, b.index)).toBe(Math.abs(d - SQRT3) < 1e-6);
      }
    }
  });

  it('adjacency is symmetric and at most 6 neighbours', () => {
    NEIGHBORS.forEach((ns, i) => {
      expect(ns.length).toBeLessThanOrEqual(6);
      ns.forEach((n) => expect(NEIGHBORS[n]).toContain(i));
    });
    // The centre column middle hexes are fully surrounded.
    expect(NEIGHBORS[slotAt(3, 2)]).toHaveLength(6);
  });

  it('produces a layout with no overlapping hexes', () => {
    const layout = boardLayout(100, 0);
    for (let i = 0; i < 30; i++)
      for (let j = i + 1; j < 30; j++) {
        const d = Math.hypot(layout.centers[i].x - layout.centers[j].x, layout.centers[i].y - layout.centers[j].y);
        expect(d).toBeGreaterThanOrEqual(100 * SQRT3 - 1e-6);
      }
  });
});

describe('classic map', () => {
  it('reproduces the approved layout exactly', () => {
    const map = generateClassic('BRASS-0001');
    for (const t of map.tiles) {
      const s = SLOTS[t.slot];
      const cell = CLASSIC_COLUMNS[s.col][s.row];
      if (cell === 'hidden') expect(['mine', 'mountain']).toContain(t.terrain);
      else expect(t.terrain).toBe(cell);
    }
    expect(map.tiles[slotAt(0, 1)].terrain).toBe('tax');
    expect(map.tiles[slotAt(4, 2)].terrain).toBe('water');
  });

  it('has 8 hidden slots holding 4 Mines and 4 Mountains', () => {
    expect(CLASSIC_HIDDEN_SLOTS).toHaveLength(8);
    for (const seed of SEEDS) {
      const map = generateClassic(seed);
      const hidden = CLASSIC_HIDDEN_SLOTS.map((s) => map.tiles[s].terrain);
      expect(hidden.filter((t) => t === 'mine')).toHaveLength(4);
      expect(hidden.filter((t) => t === 'mountain')).toHaveLength(4);
    }
  });

  it('shuffles hidden assignments between seeds but keeps fixed terrain', () => {
    const patterns = new Set(SEEDS.map((s) => CLASSIC_HIDDEN_SLOTS.map((h) => generateClassic(s).tiles[h].terrain[1]).join('')));
    expect(patterns.size).toBeGreaterThan(1);
    const a = generateClassic(SEEDS[0]);
    const b = generateClassic(SEEDS[1]);
    a.tiles.forEach((t, i) => {
      if (!CLASSIC_HIDDEN_SLOTS.includes(i)) expect(t.terrain).toBe(b.tiles[i].terrain);
    });
  });

  it('has correct terrain counts', () => {
    const counts = countTerrain(generateClassic('X').tiles);
    for (const t of TERRAIN_TYPES) expect(counts[t]).toBe(TERRAIN[t].count);
  });

  it('passes every hard validation check', () => {
    for (const seed of SEEDS) expect(analyzeMap(generateClassic(seed).tiles).errors).toEqual([]);
  });
});

describe('number assignment', () => {
  const maps = [...SEEDS.map(generateClassic), ...SEEDS.map((s) => generateBalanced(s).map)];

  it('matches the global frequency table and totals 20', () => {
    for (const m of maps) {
      expect(numberFrequency(m.tiles)).toEqual(NUMBER_DISTRIBUTION);
      expect(m.tiles.filter((t) => TERRAIN[t.terrain].numbered && t.number != null)).toHaveLength(20);
    }
  });

  it('never places 7 and never numbers Water or the Tax Office', () => {
    for (const m of maps) {
      expect(m.tiles.some((t) => t.number === 7)).toBe(false);
      m.tiles.filter((t) => t.terrain === 'water' || t.terrain === 'tax').forEach((t) => expect(t.number).toBeNull());
    }
  });

  it('gives Ports the unique numbers 5, 6, 8, 9', () => {
    for (const m of maps) {
      const nums = m.tiles.filter((t) => t.terrain === 'port').map((t) => t.number).sort((a, b) => a! - b!);
      expect(nums).toEqual([...PORT_NUMBERS]);
    }
  });

  it('gives each resource category two high and two low numbers', () => {
    for (const m of maps) {
      for (const cat of NUMBERED_TERRAIN) {
        const nums = m.tiles.filter((t) => t.terrain === cat).map((t) => t.number!);
        expect(nums.filter(isHighNumber)).toHaveLength(2);
        expect(nums.filter((n) => !isHighNumber(n))).toHaveLength(2);
      }
    }
  });
});

describe('seed reproducibility', () => {
  it('same seed and mode produce identical maps', () => {
    for (const seed of SEEDS) {
      expect(generateClassic(seed)).toEqual(generateClassic(seed));
      expect(generateBalanced(seed).map).toEqual(generateBalanced(seed).map);
    }
  });

  it('different seeds produce different balanced maps', () => {
    const encodings = new Set(SEEDS.map((s) => encodeMap(generateBalanced(s).map)));
    expect(encodings.size).toBe(SEEDS.length);
  });
});

describe('balanced random generation', () => {
  it('preserves exact quantities and passes hard checks', () => {
    for (const seed of SEEDS) {
      const { map, analysis, report } = generateBalanced(seed);
      const counts = countTerrain(map.tiles);
      for (const t of TERRAIN_TYPES) expect(counts[t]).toBe(TERRAIN[t].count);
      expect(analysis.errors).toEqual([]);
      expect(report.fallback).toBe(false);
      expect(report.candidatesTried).toBeLessThanOrEqual(240);
    }
  });

  it('respects locked tiles when regenerating', () => {
    const base = generateBalanced('LOCK-1').map;
    const locked = base.tiles.filter((t) => t.slot % 5 === 0).map((t) => ({ ...t, locked: true }));
    const next = generateBalanced('LOCK-2', { locked }).map;
    for (const l of locked) {
      const t = next.tiles[l.slot];
      expect(t.terrain).toBe(l.terrain);
      expect(t.number).toBe(l.number);
      expect(t.locked).toBe(true);
    }
    const counts = countTerrain(next.tiles);
    for (const t of TERRAIN_TYPES) expect(counts[t]).toBe(TERRAIN[t].count);
  });
});

describe('graph analysis', () => {
  const blank = (terrain: MapTile['terrain'] = 'village'): MapTile[] =>
    SLOTS.map((s) => ({ slot: s.index, terrain, variant: 0, number: null, revealed: false, locked: false }));

  it('detects connectivity and disconnection', () => {
    const tiles = blank();
    expect(connectedComponents(tiles)).toHaveLength(1);
    // Wall of water down the centre column splits the board.
    SLOTS.filter((s) => s.col === 3).forEach((s) => (tiles[s.index].terrain = 'water'));
    expect(connectedComponents(tiles)).toHaveLength(2);
  });

  it('detects articulation points (bottlenecks)', () => {
    const tiles = blank('water');
    // A straight corridor along column 3.
    const corridor = SLOTS.filter((s) => s.col === 3).map((s) => s.index);
    corridor.forEach((i) => (tiles[i].terrain = 'village'));
    const aps = articulationPoints(tiles);
    expect(aps).toEqual(corridor.slice(1, -1));
    expect(articulationPoints(blank())).toEqual([]);
  });

  it('counts vertex-disjoint routes', () => {
    const tiles = blank();
    const a = slotAt(0, 0);
    const b = slotAt(6, 0);
    expect(disjointRoutes(tiles, a, b)).toBe(NEIGHBORS[a].length);
    const corridor = blank('water');
    SLOTS.filter((s) => s.col === 3).forEach((s) => (corridor[s.index].terrain = 'village'));
    expect(disjointRoutes(corridor, slotAt(3, 0), slotAt(3, 5))).toBe(1);
  });

  it('rejects invalid maps with hard errors', () => {
    const map = generateClassic('BAD');
    let tiles = setTerrain(map.tiles, slotAt(3, 0), 'water');
    tiles = setTerrain(tiles, slotAt(3, 1), 'water');
    const a = analyzeMap(tiles);
    expect(a.errors.map((e) => e.id)).toContain('terrain-counts');
    // Isolating a City is a hard error.
    const iso = map.tiles.map((t) => ({ ...t }));
    for (const n of NEIGHBORS[slotAt(0, 0)]) iso[n].terrain = 'water';
    expect(analyzeMap(iso).errors.map((e) => e.id)).toEqual(expect.arrayContaining(['city-access']));
  });

  it('repairs invalid terrain counts', () => {
    const map = generateClassic('FIX');
    const broken = setTerrain(setTerrain(map.tiles, 5, 'water'), 6, 'water');
    const fixed = repairCounts(broken, 'FIX');
    const counts = countTerrain(fixed);
    for (const t of TERRAIN_TYPES) expect(counts[t]).toBe(TERRAIN[t].count);
    expect(analyzeMap(fixed).checks.find((c) => c.id === 'number-distribution')!.severity).toBe('pass');
  });
});

describe('editing', () => {
  it('swaps whole tiles and refuses locked tiles', () => {
    const tiles = generateClassic('SWAP').tiles;
    const swapped = swapTiles(tiles, 0, 29);
    expect(swapped[0].terrain).toBe(tiles[29].terrain);
    expect(swapped[29].number).toBe(tiles[0].number);
    const locked = tiles.map((t) => (t.slot === 0 ? { ...t, locked: true } : t));
    expect(swapTiles(locked, 0, 29)).toBe(locked);
  });
});

describe('serialization', () => {
  it('round-trips JSON export/import', () => {
    const map = generateBalanced('JSON-1').map;
    const parsed = parseMapJson(serializeMap(map));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.map).toEqual(map);
  });

  it('rejects malformed JSON imports with messages', () => {
    expect(parseMapJson('not json').ok).toBe(false);
    const bad = parseMapJson(JSON.stringify({ version: 1, name: 'x', mode: 'classic', seed: 's', tiles: [] }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.length).toBeGreaterThan(0);
    const seven = generateClassic('S');
    const withSeven = { ...seven, tiles: seven.tiles.map((t, i) => (i === 0 ? { ...t, number: 7 } : t)) };
    expect(parseMapJson(JSON.stringify(withSeven)).ok).toBe(false);
  });

  it('round-trips the compact URL encoding', () => {
    const map = { ...generateClassic('URL-7'), tiles: generateClassic('URL-7').tiles.map((t, i) => ({ ...t, locked: i === 3, revealed: i === 5 })) };
    const code = encodeMap(map);
    expect(code.length).toBeLessThan(140);
    const decoded = decodeMap(code)!;
    expect(decoded.tiles).toEqual(map.tiles);
    expect(decoded.mode).toBe('classic');
    expect(decodeMap('garbage')).toBeNull();
  });
});
