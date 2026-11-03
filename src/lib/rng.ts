/** Deterministic seeded random number generation (cyrb128 hash + sfc32 generator). */

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  shuffle<T>(items: readonly T[]): T[];
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: string): Rng {
  const [a, b, c, d] = cyrb128(seed);
  const next = sfc32(a, b, c, d);
  for (let i = 0; i < 12; i++) next();
  const int = (n: number) => Math.floor(next() * n);
  return {
    next,
    int,
    shuffle<T>(items: readonly T[]): T[] {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    pick<T>(items: readonly T[]): T {
      return items[int(items.length)];
    },
  };
}

const SEED_WORDS = [
  'BRASS', 'RIVET', 'GIRDER', 'FOUNDRY', 'LEDGER', 'BOILER', 'HARBOR', 'DERRICK', 'GRANITE', 'FURNACE',
  'TREASURY', 'ANVIL', 'PISTON', 'TIMBER', 'COPPER', 'VAULT', 'STEAMER', 'QUARRY', 'TARIFF', 'BULLION',
];

/** Human-friendly shareable seed such as "FOUNDRY-4821". */
export function randomSeed(): string {
  const r = new Uint32Array(2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(r);
  else {
    r[0] = Math.floor(Math.random() * 2 ** 32);
    r[1] = Math.floor(Math.random() * 2 ** 32);
  }
  return `${SEED_WORDS[r[0] % SEED_WORDS.length]}-${String(r[1] % 10000).padStart(4, '0')}`;
}

export function normalizeSeed(seed: string): string {
  return seed.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40) || 'BRASS-0001';
}
