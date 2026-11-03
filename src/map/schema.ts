import { z } from 'zod';
import { TERRAIN_TYPES } from '../data/terrain';
import { SLOT_COUNT } from './geometry';
import type { BoardMap } from './types';

const ALLOWED_NUMBERS = [3, 4, 5, 6, 8, 9, 10, 11];

export const tileSchema = z.object({
  slot: z.number().int().min(0).max(SLOT_COUNT - 1),
  terrain: z.enum(TERRAIN_TYPES),
  variant: z.number().int().min(0).max(4),
  number: z
    .number()
    .int()
    .refine((n) => ALLOWED_NUMBERS.includes(n), { message: 'Numbers must be 3–6 or 8–11' })
    .nullable(),
  revealed: z.boolean(),
  locked: z.boolean(),
});

export const boardMapSchema = z
  .object({
    version: z.literal(1),
    name: z.string().trim().min(1).max(80),
    mode: z.enum(['classic', 'balanced', 'custom']),
    seed: z.string().min(1).max(64),
    tiles: z.array(tileSchema).length(SLOT_COUNT),
  })
  .superRefine((map, ctx) => {
    const slots = new Set(map.tiles.map((t) => t.slot));
    if (slots.size !== SLOT_COUNT) {
      ctx.addIssue({ code: 'custom', message: 'Each of the 30 board positions must appear exactly once', path: ['tiles'] });
    }
  });

/** The envelope written by JSON export. */
export const exportFileSchema = z.object({
  format: z.literal('tax-the-richmen-map'),
  exportedAt: z.string().optional(),
  map: boardMapSchema,
});

export type ImportResult = { ok: true; map: BoardMap } | { ok: false; errors: string[] };

export function parseMapJson(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  const isEnvelope = typeof raw === 'object' && raw !== null && 'format' in raw;
  const result = isEnvelope ? exportFileSchema.safeParse(raw) : boardMapSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues
        .slice(0, 8)
        .map((i) => `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`),
    };
  }
  const map = ('map' in result.data ? result.data.map : result.data) as BoardMap;
  return { ok: true, map: { ...map, tiles: [...map.tiles].sort((a, b) => a.slot - b.slot) } };
}

export function serializeMap(map: BoardMap): string {
  return JSON.stringify(
    {
      format: 'tax-the-richmen-map',
      exportedAt: new Date().toISOString(),
      map: { ...map, tiles: [...map.tiles].sort((a, b) => a.slot - b.slot) },
    },
    null,
    2,
  );
}
