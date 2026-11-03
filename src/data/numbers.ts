/** Production number frequencies for the 20 resource-producing hexes. 7 never appears on a tile. */
export const NUMBER_DISTRIBUTION: Record<number, number> = {
  3: 2,
  4: 3,
  5: 3,
  6: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 2,
};

export const PORT_NUMBERS = [5, 6, 8, 9] as const;

export const HIGH_NUMBERS = [5, 6, 8, 9] as const;
export const LOW_NUMBERS = [3, 4, 10, 11] as const;

export const PRODUCTION_NUMBERS = Object.keys(NUMBER_DISTRIBUTION).map(Number);

/** Ways to roll n with two six-sided dice, out of 36. */
export function dicePips(n: number): number {
  if (n < 2 || n > 12) return 0;
  return 6 - Math.abs(7 - n);
}

export function diceProbability(n: number): number {
  return dicePips(n) / 36;
}

export function isHighNumber(n: number): boolean {
  return (HIGH_NUMBERS as readonly number[]).includes(n);
}

/** Expand the distribution into a flat pool of 20 numbers. */
export function numberPool(): number[] {
  const out: number[] = [];
  for (const [n, count] of Object.entries(NUMBER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) out.push(Number(n));
  }
  return out;
}

export const TOTAL_NUMBERED_HEXES = numberPool().length;
