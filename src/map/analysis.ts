import { NUMBER_DISTRIBUTION, PORT_NUMBERS, dicePips, isHighNumber } from '../data/numbers';
import { TERRAIN, TERRAIN_TYPES, type TerrainType } from '../data/terrain';
import { NEIGHBORS, SLOT_COUNT } from './geometry';
import { NUMBERED_TERRAIN, numberLayoutPenalty } from './numbering';
import type { MapTile } from './types';

export type Severity = 'pass' | 'warning' | 'error';

export interface Check {
  id: string;
  group: 'integrity' | 'access' | 'balance';
  label: string;
  severity: Severity;
  detail: string;
  slots?: number[];
}

export interface ScoreBreakdown {
  accessibility: number;
  portAccess: number;
  chokepoints: number;
  routeDiversity: number;
  resourceBalance: number;
  numberDistribution: number;
}

export const SCORE_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  accessibility: 0.2,
  portAccess: 0.15,
  chokepoints: 0.15,
  routeDiversity: 0.2,
  resourceBalance: 0.15,
  numberDistribution: 0.15,
};

export const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  accessibility: 'Accessibility',
  portAccess: 'Port access',
  chokepoints: 'Chokepoints',
  routeDiversity: 'Route diversity',
  resourceBalance: 'Resource balance',
  numberDistribution: 'Number distribution',
};

export interface RoutePair {
  city: number;
  port: number;
  paths: number;
}

export interface MapAnalysis {
  checks: Check[];
  errors: Check[];
  warnings: Check[];
  score: number;
  breakdown: ScoreBreakdown;
  counts: Record<TerrainType, number>;
  components: number[][];
  articulation: number[];
  significantChokepoints: number[];
  routes: RoutePair[];
  categoryPips: Record<string, { pips: number; high: number; low: number }>;
  averageRoutes: number;
}

// ------------------------------------------------------------------
// Graph primitives (accessible land only)
// ------------------------------------------------------------------

export function isAccessible(t: MapTile | undefined): boolean {
  return !!t && TERRAIN[t.terrain].accessible;
}

function tileIndex(tiles: MapTile[]): (MapTile | undefined)[] {
  const arr: (MapTile | undefined)[] = new Array(SLOT_COUNT);
  for (const t of tiles) arr[t.slot] = t;
  return arr;
}

export function accessibleNeighbors(tiles: MapTile[], slot: number, open?: (t: MapTile) => boolean): number[] {
  const idx = tileIndex(tiles);
  const ok = open ?? isAccessible;
  return NEIGHBORS[slot].filter((n) => idx[n] && ok(idx[n]!));
}

export function connectedComponents(tiles: MapTile[], open: (t: MapTile) => boolean = isAccessible): number[][] {
  const idx = tileIndex(tiles);
  const seen = new Set<number>();
  const comps: number[][] = [];
  for (const t of tiles) {
    if (!open(t) || seen.has(t.slot)) continue;
    const comp: number[] = [];
    const stack = [t.slot];
    seen.add(t.slot);
    while (stack.length) {
      const v = stack.pop()!;
      comp.push(v);
      for (const n of NEIGHBORS[v]) {
        const nt = idx[n];
        if (nt && open(nt) && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    comps.push(comp.sort((a, b) => a - b));
  }
  return comps.sort((a, b) => b.length - a.length);
}

/** Tarjan's algorithm: hexes whose removal disconnects accessible land. */
export function articulationPoints(tiles: MapTile[], open: (t: MapTile) => boolean = isAccessible): number[] {
  const idx = tileIndex(tiles);
  const disc = new Map<number, number>();
  const low = new Map<number, number>();
  const result = new Set<number>();
  let time = 0;

  const dfs = (u: number, parent: number) => {
    disc.set(u, time);
    low.set(u, time);
    time++;
    let children = 0;
    for (const v of NEIGHBORS[u]) {
      const vt = idx[v];
      if (!vt || !open(vt)) continue;
      if (!disc.has(v)) {
        children++;
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (parent !== -1 && low.get(v)! >= disc.get(u)!) result.add(u);
      } else if (v !== parent) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
    if (parent === -1 && children > 1) result.add(u);
  };

  for (const t of tiles) if (open(t) && !disc.has(t.slot)) dfs(t.slot, -1);
  return [...result].sort((a, b) => a - b);
}

/** Number of internally vertex-disjoint routes between two hexes (max-flow with node splitting). */
export function disjointRoutes(
  tiles: MapTile[],
  source: number,
  target: number,
  open: (t: MapTile) => boolean = isAccessible,
  cap = 6,
): number {
  if (source === target) return 0;
  const idx = tileIndex(tiles);
  const N = SLOT_COUNT * 2;
  const capacity = new Map<number, number>();
  const adj: number[][] = Array.from({ length: N }, () => []);
  const key = (a: number, b: number) => a * N + b;
  const addEdge = (a: number, b: number, c: number) => {
    if (!capacity.has(key(a, b))) {
      adj[a].push(b);
      adj[b].push(a);
      capacity.set(key(b, a), capacity.get(key(b, a)) ?? 0);
    }
    capacity.set(key(a, b), (capacity.get(key(a, b)) ?? 0) + c);
  };
  const BIG = 1000;
  for (let v = 0; v < SLOT_COUNT; v++) {
    const t = idx[v];
    if (!t || !open(t)) continue;
    addEdge(2 * v, 2 * v + 1, v === source || v === target ? BIG : 1);
    for (const n of NEIGHBORS[v]) {
      const nt = idx[n];
      if (nt && open(nt)) addEdge(2 * v + 1, 2 * n, 1);
    }
  }
  const s = 2 * source + 1;
  const tSink = 2 * target;
  let flow = 0;
  while (flow < cap) {
    const prev = new Int32Array(N).fill(-1);
    prev[s] = s;
    const queue = [s];
    while (queue.length && prev[tSink] === -1) {
      const u = queue.shift()!;
      for (const v of adj[u]) {
        if (prev[v] === -1 && (capacity.get(key(u, v)) ?? 0) > 0) {
          prev[v] = u;
          queue.push(v);
        }
      }
    }
    if (prev[tSink] === -1) break;
    for (let v = tSink; v !== s; v = prev[v]) {
      const u = prev[v];
      capacity.set(key(u, v), capacity.get(key(u, v))! - 1);
      capacity.set(key(v, u), (capacity.get(key(v, u)) ?? 0) + 1);
    }
    flow++;
  }
  return flow;
}

/** Shortest accessible path between two hexes (BFS), or null. */
export function shortestPath(tiles: MapTile[], from: number, to: number): number[] | null {
  const idx = tileIndex(tiles);
  const prev = new Map<number, number>([[from, -1]]);
  const queue = [from];
  while (queue.length) {
    const u = queue.shift()!;
    if (u === to) break;
    for (const n of NEIGHBORS[u]) {
      if (!prev.has(n) && isAccessible(idx[n])) {
        prev.set(n, u);
        queue.push(n);
      }
    }
  }
  if (!prev.has(to)) return null;
  const path: number[] = [];
  for (let v = to; v !== -1; v = prev.get(v)!) path.unshift(v);
  return path;
}

// ------------------------------------------------------------------
// Full analysis
// ------------------------------------------------------------------

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const label = (slot: number) => `hex ${slot + 1}`;
const list = (slots: number[]) => slots.map(label).join(', ');

export function countTerrain(tiles: MapTile[]): Record<TerrainType, number> {
  const counts = Object.fromEntries(TERRAIN_TYPES.map((t) => [t, 0])) as Record<TerrainType, number>;
  for (const t of tiles) counts[t.terrain]++;
  return counts;
}

export function analyzeMap(tiles: MapTile[]): MapAnalysis {
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);
  const idx = tileIndex(tiles);

  // --- Integrity ---------------------------------------------------
  const slots = new Set(tiles.map((t) => t.slot));
  add({
    id: 'tile-count',
    group: 'integrity',
    label: 'Exactly 30 hexes',
    severity: tiles.length === SLOT_COUNT && slots.size === SLOT_COUNT ? 'pass' : 'error',
    detail: `${tiles.length} tiles placed across ${slots.size} of ${SLOT_COUNT} positions.`,
  });

  const counts = countTerrain(tiles);
  const wrong = TERRAIN_TYPES.filter((t) => counts[t] !== TERRAIN[t].count);
  add({
    id: 'terrain-counts',
    group: 'integrity',
    label: 'Terrain quantities',
    severity: wrong.length ? 'error' : 'pass',
    detail: wrong.length
      ? wrong.map((t) => `${TERRAIN[t].plural}: ${counts[t]} of ${TERRAIN[t].count}`).join('; ')
      : '4 City, 4 Village, 4 Mine, 4 Mountain, 4 Port, 4 Oil Rig, 5 Water, 1 Tax Office.',
    slots: wrong.length ? tiles.filter((t) => wrong.includes(t.terrain)).map((t) => t.slot) : undefined,
  });

  const concealed = tiles.filter((t) => TERRAIN[t.terrain].concealed);
  add({
    id: 'hidden-count',
    group: 'integrity',
    label: 'Eight concealed Mine/Mountain hexes',
    severity: concealed.length === 8 ? 'pass' : 'error',
    detail: `${concealed.length} concealed hexes (${counts.mine} Mine, ${counts.mountain} Mountain).`,
  });

  // Numbers
  const numberedTiles = tiles.filter((t) => TERRAIN[t.terrain].numbered);
  const prodNumbers = numberedTiles.map((t) => t.number);
  const freq: Record<number, number> = {};
  for (const n of prodNumbers) if (n != null) freq[n] = (freq[n] ?? 0) + 1;
  const missing = numberedTiles.filter((t) => t.number == null).map((t) => t.slot);
  const sevens = tiles.filter((t) => t.number === 7).map((t) => t.slot);
  const strayNumbers = tiles
    .filter((t) => !TERRAIN[t.terrain].numbered && t.terrain !== 'port' && t.number != null)
    .map((t) => t.slot);
  const freqMismatch = Object.keys({ ...NUMBER_DISTRIBUTION, ...freq })
    .map(Number)
    .filter((n) => (freq[n] ?? 0) !== (NUMBER_DISTRIBUTION[n] ?? 0));
  const numbersOk = !missing.length && !sevens.length && !strayNumbers.length && !freqMismatch.length;
  add({
    id: 'number-distribution',
    group: 'integrity',
    label: 'Production number frequencies',
    severity: numbersOk ? 'pass' : 'error',
    detail: numbersOk
      ? '3×2, 4×3, 5×3, 6×2, 8×2, 9×3, 10×3, 11×2 across 20 resource hexes. No 7.'
      : [
          missing.length ? `${missing.length} resource hex(es) without a number` : '',
          sevens.length ? '7 may never appear on a tile' : '',
          strayNumbers.length ? 'numbers placed on non-producing hexes' : '',
          freqMismatch.length
            ? `frequency mismatch for ${freqMismatch.map((n) => `${n} (${freq[n] ?? 0}/${NUMBER_DISTRIBUTION[n] ?? 0})`).join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('; ') + '.',
    slots: [...missing, ...sevens, ...strayNumbers],
  });

  const ports = tiles.filter((t) => t.terrain === 'port');
  const portNums = ports.map((p) => p.number).sort((a, b) => (a ?? 0) - (b ?? 0));
  const portsOk = portNums.length === 4 && PORT_NUMBERS.every((n, i) => portNums[i] === n);
  add({
    id: 'port-numbers',
    group: 'integrity',
    label: 'Port numbers 5, 6, 8, 9',
    severity: portsOk ? 'pass' : 'error',
    detail: portsOk ? 'Each Port carries a unique number.' : `Ports carry: ${portNums.map((n) => n ?? '—').join(', ')}.`,
    slots: portsOk ? undefined : ports.map((p) => p.slot),
  });

  const categoryPips: MapAnalysis['categoryPips'] = {};
  const unbalancedCats: string[] = [];
  for (const cat of NUMBERED_TERRAIN) {
    const nums = tiles.filter((t) => t.terrain === cat && t.number != null).map((t) => t.number!);
    const high = nums.filter(isHighNumber).length;
    const low = nums.length - high;
    categoryPips[cat] = { pips: nums.reduce((a, n) => a + dicePips(n), 0), high, low };
    if (high !== 2 || low !== 2) unbalancedCats.push(cat);
  }
  add({
    id: 'balanced-assignment',
    group: 'integrity',
    label: 'Two high + two low per category',
    severity: unbalancedCats.length ? 'error' : 'pass',
    detail: unbalancedCats.length
      ? `Not met for ${unbalancedCats.map((c) => TERRAIN[c as TerrainType].plural).join(', ')}.`
      : 'Each resource category holds two of 5/6/8/9 and two of 3/4/10/11.',
    slots: tiles.filter((t) => unbalancedCats.includes(t.terrain)).map((t) => t.slot),
  });

  // --- Access ------------------------------------------------------
  const components = connectedComponents(tiles);
  const minorLand = components.slice(1).flat();
  add({
    id: 'land-connectivity',
    group: 'access',
    label: 'Land forms one connected region',
    severity: components.length <= 1 ? 'pass' : 'error',
    detail:
      components.length <= 1
        ? `All ${components[0]?.length ?? 0} accessible hexes are reachable from each other.`
        : `Water or the Tax Office cut off ${minorLand.length} hex(es): ${list(minorLand)}.`,
    slots: minorLand.length ? minorLand : undefined,
  });

  const cities = tiles.filter((t) => t.terrain === 'city');
  const cityDeg = cities.map((c) => ({ slot: c.slot, deg: accessibleNeighbors(tiles, c.slot).length }));
  const isolatedCities = cityDeg.filter((c) => c.deg === 0).map((c) => c.slot);
  const narrowCities = cityDeg.filter((c) => c.deg === 1).map((c) => c.slot);
  add({
    id: 'city-access',
    group: 'access',
    label: 'City expansion routes',
    severity: isolatedCities.length ? 'error' : narrowCities.length ? 'warning' : 'pass',
    detail: isolatedCities.length
      ? `Cities with no accessible neighbour: ${list(isolatedCities)}.`
      : narrowCities.length
        ? `Cities with a single exit: ${list(narrowCities)}.`
        : `Every City has at least two accessible neighbours (${cityDeg.map((c) => c.deg).join(', ')}).`,
    slots: [...isolatedCities, ...narrowCities],
  });

  const portDeg = ports.map((p) => ({ slot: p.slot, deg: accessibleNeighbors(tiles, p.slot).length }));
  const isolatedPorts = portDeg.filter((c) => c.deg === 0).map((c) => c.slot);
  const narrowPorts = portDeg.filter((c) => c.deg === 1).map((c) => c.slot);
  add({
    id: 'port-access',
    group: 'access',
    label: 'Port access',
    severity: isolatedPorts.length ? 'error' : narrowPorts.length ? 'warning' : 'pass',
    detail: isolatedPorts.length
      ? `Ports isolated from the board: ${list(isolatedPorts)}.`
      : narrowPorts.length
        ? `Ports reachable through one hex only: ${list(narrowPorts)}.`
        : `Every Port has at least two approaches (${portDeg.map((c) => c.deg).join(', ')}).`,
    slots: [...isolatedPorts, ...narrowPorts],
  });

  const ownable = (t: MapTile) => ['city', 'village', 'mine', 'mountain', 'port'].includes(t.terrain);
  const rigs = tiles.filter((t) => t.terrain === 'oil');
  const rigInfo = rigs.map((r) => ({
    slot: r.slot,
    deg: accessibleNeighbors(tiles, r.slot).length,
    ownable: NEIGHBORS[r.slot].filter((n) => idx[n] && ownable(idx[n]!)).length,
  }));
  const deadRigs = rigInfo.filter((r) => r.deg === 0).map((r) => r.slot);
  const weakRigs = rigInfo.filter((r) => r.deg > 0 && r.ownable < 2).map((r) => r.slot);
  add({
    id: 'oil-access',
    group: 'access',
    label: 'Oil Rig approaches',
    severity: deadRigs.length ? 'error' : weakRigs.length ? 'warning' : 'pass',
    detail: deadRigs.length
      ? `Oil Rigs with no accessible approach: ${list(deadRigs)}.`
      : weakRigs.length
        ? `Rigs touching fewer than two ownable hexes limit Pipeline options: ${list(weakRigs)}. Pipelines may still run through adjacent Rigs.`
        : 'Every Oil Rig touches two or more ownable hexes for leasing and Pipeline routes.',
    slots: [...deadRigs, ...weakRigs],
  });

  // Chokepoints
  const articulation = articulationPoints(tiles);
  const significant: number[] = [];
  const concentrated: string[] = [];
  for (const ap of articulation) {
    const without = connectedComponents(tiles, (t) => isAccessible(t) && t.slot !== ap);
    const minor = without.slice(1).flat();
    const minorTiles = minor.map((s) => idx[s]!);
    const holdsKey = minorTiles.some((t) => t.terrain === 'city' || t.terrain === 'port');
    const resourceCount = minorTiles.filter((t) => TERRAIN[t.terrain].numbered).length;
    if (holdsKey || resourceCount >= 2) significant.push(ap);
    for (const cat of NUMBERED_TERRAIN) {
      const total = counts[cat];
      if (total && minorTiles.filter((t) => t.terrain === cat).length === total) {
        concentrated.push(`${TERRAIN[cat].plural} behind ${label(ap)}`);
      }
    }
  }
  add({
    id: 'chokepoints',
    group: 'access',
    label: 'Bottlenecks and single-hex chokepoints',
    severity: significant.length ? 'warning' : 'pass',
    detail: articulation.length
      ? significant.length
        ? `${significant.length} chokepoint(s) control access to Cities, Ports or multiple resources: ${list(significant)}.`
        : `${articulation.length} minor chokepoint(s) that only guard isolated pockets: ${list(articulation)}.`
      : 'No single hex can sever the playable land.',
    slots: significant.length ? significant : articulation,
  });

  add({
    id: 'resource-concentration',
    group: 'access',
    label: 'Resource locations not concentrated behind one passage',
    severity: concentrated.length ? 'warning' : 'pass',
    detail: concentrated.length ? `${concentrated.join('; ')}.` : 'No resource type is entirely reached through a single hex.',
  });

  // Routes
  const routes: RoutePair[] = [];
  for (const c of cities) for (const p of ports) routes.push({ city: c.slot, port: p.slot, paths: disjointRoutes(tiles, c.slot, p.slot) });
  const unreachable = routes.filter((r) => r.paths === 0);
  const single = routes.filter((r) => r.paths === 1);
  const averageRoutes = routes.length ? routes.reduce((a, r) => a + Math.min(r.paths, 4), 0) / routes.length : 0;
  add({
    id: 'route-diversity',
    group: 'access',
    label: 'Alternative City-to-Port routes',
    severity: unreachable.length ? 'error' : single.length ? 'warning' : 'pass',
    detail: unreachable.length
      ? `${unreachable.length} City–Port pair(s) cannot be connected at all.`
      : single.length
        ? `${single.length} of ${routes.length} City–Port pairs rely on one route. Average independent routes: ${averageRoutes.toFixed(1)}.`
        : `Every City–Port pair has at least two independent routes (average ${averageRoutes.toFixed(1)}).`,
    slots: [...new Set([...unreachable, ...single].flatMap((r) => [r.city, r.port]))],
  });

  // Water
  const waterBodies = connectedComponents(tiles, (t) => t.terrain === 'water');
  add({
    id: 'water',
    group: 'access',
    label: 'Water distribution',
    severity: components.length <= 1 ? 'pass' : 'error',
    detail:
      components.length <= 1
        ? `${counts.water} Water hexes in ${waterBodies.length} body/bodies; land remains whole.`
        : 'Water divides the land into separate regions.',
    slots: components.length <= 1 ? undefined : waterBodies.flat(),
  });

  // Tax Office
  const tax = tiles.find((t) => t.terrain === 'tax');
  if (tax) {
    const openTax = (t: MapTile) => isAccessible(t) || t.terrain === 'tax';
    let blocked = 0;
    let narrowed = 0;
    for (const r of routes) {
      const withTax = disjointRoutes(tiles, r.city, r.port, openTax);
      if (r.paths === 0 && withTax > 0) blocked++;
      else if (r.paths === 1 && withTax > 1) narrowed++;
    }
    add({
      id: 'tax-office',
      group: 'access',
      label: 'Tax Office placement',
      severity: blocked ? 'error' : narrowed ? 'warning' : 'pass',
      detail: blocked
        ? `The Tax Office makes ${blocked} City–Port connection(s) impossible.`
        : narrowed
          ? `The Tax Office narrows ${narrowed} City–Port pair(s) to a single route.`
          : 'The Tax Office does not remove any otherwise viable route.',
      slots: blocked || narrowed ? [tax.slot] : undefined,
    });
  }

  // --- Balance -----------------------------------------------------
  const pipValues = Object.values(categoryPips).map((c) => c.pips);
  const pipSpread = pipValues.length ? Math.max(...pipValues) - Math.min(...pipValues) : 0;
  add({
    id: 'production-balance',
    group: 'balance',
    label: 'Production balance across categories',
    severity: pipSpread > 4 ? 'warning' : 'pass',
    detail: `Expected rolls per 36 — ${NUMBERED_TERRAIN.map((c) => `${TERRAIN[c].plural} ${categoryPips[c].pips}`).join(', ')}.`,
  });

  const sameAdjacent: number[] = [];
  for (const t of tiles) {
    if (t.number == null || !TERRAIN[t.terrain].numbered) continue;
    for (const n of NEIGHBORS[t.slot]) {
      const o = idx[n];
      if (o && n > t.slot && TERRAIN[o.terrain].numbered && o.number === t.number) sameAdjacent.push(t.slot, n);
    }
  }
  add({
    id: 'number-adjacency',
    group: 'balance',
    label: 'Identical numbers kept apart',
    severity: sameAdjacent.length ? 'warning' : 'pass',
    detail: sameAdjacent.length
      ? `Adjacent hexes share a number: ${list([...new Set(sameAdjacent)])}.`
      : 'No two adjacent resource hexes share a number.',
    slots: sameAdjacent.length ? [...new Set(sameAdjacent)] : undefined,
  });

  // --- Scores ------------------------------------------------------
  const accessibility = clamp(
    100 -
      cityDeg.reduce((a, k) => a + (k.deg === 0 ? 50 : k.deg === 1 ? 20 : k.deg === 2 ? 4 : 0), 0) -
      rigInfo.reduce((a, k) => a + (k.deg === 0 ? 40 : k.deg === 1 ? 5 : 0), 0) -
      weakRigs.length * 3 -
      minorLand.length * 10,
  );
  const portAvg = portDeg.length ? portDeg.reduce((a, p) => a + p.deg, 0) / portDeg.length : 0;
  const portAccess = clamp((Math.min(portAvg, 3.5) / 3.5) * 100 - isolatedPorts.length * 40);
  const chokepoints = clamp(100 - significant.length * 14 - (articulation.length - significant.length) * 4 - concentrated.length * 10);
  const routeDiversity = clamp((Math.min(averageRoutes, 3) / 3) * 100 - single.length * 3 - unreachable.length * 15);
  const balancedCats = NUMBERED_TERRAIN.length - unbalancedCats.length;
  const resourceBalance = clamp((balancedCats / NUMBERED_TERRAIN.length) * 70 + 30 * (1 - Math.min(pipSpread, 8) / 8));
  const numberDistribution = clamp(100 - numberLayoutPenalty(tiles) * 4);

  const breakdown: ScoreBreakdown = {
    accessibility,
    portAccess,
    chokepoints,
    routeDiversity,
    resourceBalance,
    numberDistribution,
  };
  let score = Object.entries(breakdown).reduce(
    (a, [k, v]) => a + v * SCORE_WEIGHTS[k as keyof ScoreBreakdown],
    0,
  );
  const errors = checks.filter((c) => c.severity === 'error');
  if (errors.length) score = Math.min(score, 40);

  return {
    checks,
    errors,
    warnings: checks.filter((c) => c.severity === 'warning'),
    score: Math.round(score),
    breakdown,
    counts,
    components,
    articulation,
    significantChokepoints: significant,
    routes,
    categoryPips,
    averageRoutes,
  };
}
