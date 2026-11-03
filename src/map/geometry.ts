/**
 * Flat-top hex geometry for the 30-hex Tax the Richmen board.
 * Seven vertical columns of 3, 4, 5, 6, 5, 4, 3 hexes, each centred vertically.
 * Unit circumradius = 1; centres are scaled at render time.
 */

export const COLUMN_COUNTS = [3, 4, 5, 6, 5, 4, 3] as const;
export const SLOT_COUNT = COLUMN_COUNTS.reduce((a, b) => a + b, 0);
export const SQRT3 = Math.sqrt(3);

export interface Slot {
  index: number;
  col: number;
  row: number;
  /** Axial coordinates (flat-top). */
  q: number;
  r: number;
  /** Centre in unit-radius space. */
  x: number;
  y: number;
}

const CENTER_COL = (COLUMN_COUNTS.length - 1) / 2;

function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  let index = 0;
  COLUMN_COUNTS.forEach((count, col) => {
    const q = col - CENTER_COL;
    for (let row = 0; row < count; row++) {
      const offset = row - (count - 1) / 2;
      const r = offset - q / 2 + 0.5;
      slots.push({ index, col, row, q, r, x: 1.5 * q, y: SQRT3 * offset });
      index++;
    }
  });
  return slots;
}

export const SLOTS: readonly Slot[] = buildSlots();

const AXIAL_DIRECTIONS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

const slotByAxial = new Map(SLOTS.map((s) => [`${s.q},${s.r}`, s.index]));

export function slotAt(col: number, row: number): number {
  const s = SLOTS.find((x) => x.col === col && x.row === row);
  if (!s) throw new Error(`No slot at column ${col}, row ${row}`);
  return s.index;
}

function computeNeighbors(): number[][] {
  return SLOTS.map((s) =>
    AXIAL_DIRECTIONS.map(([dq, dr]) => slotByAxial.get(`${s.q + dq},${s.r + dr}`)).filter(
      (n): n is number => n !== undefined,
    ),
  );
}

/** Adjacency list, indexed by slot. */
export const NEIGHBORS: readonly (readonly number[])[] = computeNeighbors();

export function areAdjacent(a: number, b: number): boolean {
  return NEIGHBORS[a].includes(b);
}

export function hexDistance(a: number, b: number): number {
  const A = SLOTS[a];
  const B = SLOTS[b];
  const dq = A.q - B.q;
  const dr = A.r - B.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** Corner points of a flat-top hex. */
export function hexCorners(cx: number, cy: number, radius: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i);
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  });
}

export function hexPath(cx: number, cy: number, radius: number): string {
  const pts = hexCorners(cx, cy, radius);
  return `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join('L')}Z`;
}

export interface BoardLayout {
  radius: number;
  padding: number;
  width: number;
  height: number;
  centers: { x: number; y: number }[];
}

/** Pixel layout for a given hex radius; the viewBox origin is the top-left corner. */
export function boardLayout(radius = 100, padding = 24): BoardLayout {
  const xs = SLOTS.map((s) => s.x);
  const ys = SLOTS.map((s) => s.y);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - SQRT3 / 2;
  const maxY = Math.max(...ys) + SQRT3 / 2;
  return {
    radius,
    padding,
    width: (maxX - minX) * radius + padding * 2,
    height: (maxY - minY) * radius + padding * 2,
    centers: SLOTS.map((s) => ({
      x: (s.x - minX) * radius + padding,
      y: (s.y - minY) * radius + padding,
    })),
  };
}

/** All unordered adjacent pairs (potential Road connections). */
export const EDGES: readonly [number, number][] = SLOTS.flatMap((s) =>
  NEIGHBORS[s.index].filter((n) => n > s.index).map((n) => [s.index, n] as [number, number]),
);
