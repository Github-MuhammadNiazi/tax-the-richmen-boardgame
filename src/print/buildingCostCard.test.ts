import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { COSTS, costEntries } from '../data/costs';
import { PLAYERS } from '../data/players';
import {
  BUILDING_COST_FILES,
  CARD_BLEED,
  CARD_BODY_PT,
  CARD_TRIM,
  backSlots,
  buildingCostPlainText,
  chipsOf,
  frontSlots,
  picturedCost,
  sheetOrigin,
} from './buildingCostCard';

const root = resolve(__dirname, '../..');

function pdfText(name: string) {
  return readFileSync(resolve(root, 'public/printables/cards', name));
}

function pageCount(bytes: Buffer) {
  const text = bytes.toString('latin1');
  const pages = text.match(/\/Type \/Page(?!s)/g);
  return pages?.length ?? 0;
}

describe('building cost cards', () => {
  it('keeps one 90 × 128 mm card and mirrors the back for a long-edge flip', () => {
    expect(CARD_TRIM).toEqual({ w: 90, h: 128 });
    expect(CARD_BLEED).toBe(3);
    expect(CARD_BODY_PT).toBeGreaterThanOrEqual(8.5);
    const origin = sheetOrigin();
    expect(origin.x).toBe(5);
    expect(origin.y).toBe(10.5);
    expect(origin.box).toEqual({ w: 96, h: 134 });
    expect(frontSlots().map((slot) => slot.player.id)).toEqual(['red', 'blue', 'green', 'gold']);
    for (const front of frontSlots()) {
      const back = backSlots().find((slot) => slot.player.id === front.player.id);
      expect(back).toMatchObject({ col: 1 - front.col, row: front.row });
    }
    expect(new Set(PLAYERS.map((player) => player.symbol)).size).toBe(4);
  });

  it('reads approved costs and keeps unresolved rules off the card', () => {
    const text = buildingCostPlainText();
    expect(text).toContain('City 4 money');
    expect(text).toContain('Village 2 money');
    expect(text).toContain('Mine 3 money');
    expect(text).toContain('Mountain 2 money');
    expect(text).toContain('Mountain entry 1 wood 1 metal 1 fuel 1 stone');
    expect(text).toContain('Steel 2 metal 1 fuel = 1 steel');
    expect(text).toContain('Construction & investments: 1 action');
    expect(picturedCost(COSTS.road).some((chip) => chip.key === 'action')).toBe(false);
    expect(picturedCost(COSTS.steelPurchase).some((chip) => chip.key === 'action')).toBe(false);
    expect(chipsOf(COSTS.road)).toEqual(costEntries(COSTS.road).map(([key, n]) => ({ key, n })));
    expect(chipsOf(COSTS.pipeline).map((chip) => chip.key)).toEqual(['metal', 'fuel', 'action']);
    expect(text).not.toMatch(/Open:/);
    expect(text).not.toMatch(/before construction|reveal occurs before/i);
  });

  it('writes A4 duplex, single-sided, low-ink and instruction sheets', () => {
    const expected = [
      ['building-cost-cards-a4-duplex.pdf', 2],
      ['building-cost-cards-a4-fronts.pdf', 1],
      ['building-cost-cards-a4-backs.pdf', 1],
      ['building-cost-cards-a4-low-ink.pdf', 2],
      ['building-cost-cards-printing-guide.pdf', 1],
    ] as const;
    expect(BUILDING_COST_FILES).toHaveLength(expected.length);
    for (const [name, pages] of expected) {
      const bytes = pdfText(name);
      const text = bytes.toString('latin1');
      expect(text.startsWith('%PDF'), name).toBe(true);
      expect(text.includes('595.28') || text.includes('595.27'), name).toBe(true);
      expect(text.includes('841.89') || text.includes('841.88'), name).toBe(true);
      expect(pageCount(bytes), name).toBe(pages);
      if (name !== 'building-cost-cards-printing-guide.pdf') {
        if (name !== 'building-cost-cards-a4-backs.pdf') expect(text).toContain('BUILDING COSTS');
        if (name !== 'building-cost-cards-a4-fronts.pdf') expect(text).toContain('CONSTRUCTION');
        expect(text).not.toContain('Open:');
        expect(text).toContain('RED');
        expect(text).toContain('BLUE');
        expect(text).toContain('GREEN');
        expect(text).toContain('GOLD');
      }
    }
    const guide = pdfText('building-cost-cards-printing-guide.pdf').toString('latin1');
    expect(guide).toContain('100%');
    expect(guide).toContain('long edge');
    expect(guide).toContain('No physical paper test');
  });

  it('adds each new sheet to the complete-game archive once', () => {
    const zip = resolve(root, 'public/printables/bundles/complete-game.zip');
    const script = [
      'import zipfile, sys',
      'z = zipfile.ZipFile(sys.argv[1])',
      'names = z.namelist()',
      'wanted = ["cards/building-cost-cards-a4-duplex.pdf", "cards/building-cost-cards-a4-fronts.pdf", "cards/building-cost-cards-a4-backs.pdf", "cards/building-cost-cards-a4-low-ink.pdf", "cards/building-cost-cards-printing-guide.pdf"]',
      'bad = [n for n in wanted if names.count(n) != 1]',
      'print("\\n".join(bad))',
    ].join('\n');
    const out = execFileSync('py', ['-3', '-c', script, zip], { encoding: 'utf8' });
    expect(out.trim()).toBe('');
  });
});
