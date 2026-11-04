import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NUMBER_DISTRIBUTION, PORT_NUMBERS } from './numbers';
import { STEEL_DECK, STEEL_DECK_SIZE } from './steel';
import { TOTAL_TILES } from './terrain';
import { NUMBER_CHIP_TOTAL, NUMBER_CHIP_VALUES, PRINT_MODELS, UNIQUE_MODEL_COUNT, numberChipCopies } from './modelCatalog';
import { referenceCards, steelCardValues } from '../print/tableCards';
import { COSTS, formatCost } from './costs';

const root = resolve(__dirname, '../..');

describe('printable catalog', () => {
  it('has one geometry per part, not one per player colour', () => {
    const ids = PRINT_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some((id) => /_(red|blue|green|gold|yellow)$/.test(id))).toBe(false);
    expect(UNIQUE_MODEL_COUNT).toBe(ids.length);
  });

  it('counts hexes, hidden covers and number chips from the frozen rules', () => {
    expect(PRINT_MODELS.find((m) => m.id === 'hex_base')?.copies).toBe(TOTAL_TILES);
    expect(PRINT_MODELS.find((m) => m.id === 'hidden_cover')?.copies).toBe(8);
    expect(NUMBER_CHIP_VALUES).not.toContain(7);
    const fromRules = Object.entries(NUMBER_DISTRIBUTION).reduce((sum, [n, count]) => sum + count + PORT_NUMBERS.filter((p) => p === Number(n)).length, 0);
    expect(NUMBER_CHIP_TOTAL).toBe(fromRules);
    expect(NUMBER_CHIP_TOTAL).toBe(24);
    expect(numberChipCopies(5)).toBe(4);
    expect(numberChipCopies(7)).toBe(0);
  });

  it('keeps MODEL_CATALOG.md in step with the catalog', () => {
    const md = readFileSync(resolve(root, 'MODEL_CATALOG.md'), 'utf8');
    for (const model of PRINT_MODELS) expect(md, model.id).toContain(model.name);
  });

  it('ships a file for every catalog model', () => {
    for (const model of PRINT_MODELS) {
      for (const ext of ['stl', '3mf']) {
        const file = resolve(root, 'public/printables/models', `${model.id}.${ext}`);
        expect(existsSync(file), file).toBe(true);
        expect(readFileSync(file).byteLength).toBeGreaterThan(200);
      }
      expect(existsSync(resolve(root, 'public/printables/renders', `${model.id}-iso.png`))).toBe(true);
    }
    expect(existsSync(resolve(root, 'public/printables/cad/lib.scad'))).toBe(true);
    expect(existsSync(resolve(root, 'public/printables/cad/kit.scad'))).toBe(true);
  });

  it('records a passing mesh validation', () => {
    const report = JSON.parse(readFileSync(resolve(root, 'public/printables/validation.json'), 'utf8'));
    expect(report.failed).toBe(0);
    expect(report.fitProblems).toEqual([]);
    expect(report.models).toHaveLength(PRINT_MODELS.length);
    for (const model of report.models) {
      expect(model.ok, model.id).toBe(true);
      expect(model.watertight, model.id).toBe(true);
      expect(model.bodies, model.id).toBe(1);
      expect(model.fitsCompact, model.id).toBe(true);
    }
  });

  it('packs zip archives that pass a CRC test', () => {
    const zips = ['base-and-terrain', 'roads-and-pipelines', 'buildings-and-markers', 'currency-and-tokens', 'complete-game'];
    const script = [
      'import zipfile, sys',
      'bad = []',
      'for name in sys.argv[1:]:',
      '    z = zipfile.ZipFile(name)',
      '    if z.testzip() is not None: bad.append(name)',
      '    names = z.namelist()',
      '    if not any(n.endswith(".stl") for n in names): bad.append(name + " stl")',
      '    if not any(n.endswith("lib.scad") for n in names): bad.append(name + " scad")',
      'print("\\n".join(bad))',
    ].join('\n');
    const args = zips.map((z) => resolve(root, 'public/printables/bundles', `${z}.zip`));
    const out = execFileSync('py', ['-3', '-c', script, ...args], { encoding: 'utf8' });
    expect(out.trim()).toBe('');
  });
});

describe('A4 cards', () => {
  it('prints the approved Steel deck and no extra values', () => {
    const values = steelCardValues();
    expect(values).toHaveLength(STEEL_DECK_SIZE);
    for (const card of STEEL_DECK) expect(values.filter((v) => v === card.value)).toHaveLength(card.count);
    expect(values).not.toContain(7);
  });

  it('quotes approved costs and does not invent a clarification', () => {
    const text = referenceCards().flatMap((c) => c.lines).join(' ');
    expect(text).toContain(formatCost(COSTS.road));
    expect(text).toContain(formatCost(COSTS.pipeline));
    expect(text).toContain(formatCost(COSTS.office));
    expect(text).toContain(formatCost(COSTS.steelVault));
    expect(text).not.toMatch(/playtest clarification required/i);
  });

  it('writes A4 PDFs', () => {
    for (const name of ['steel-cards-duplex.pdf', 'steel-cards-fronts.pdf', 'player-reference.pdf', 'quick-start.pdf', 'hex-insert-template.pdf', 'steel-cards-low-ink.pdf']) {
      const bytes = readFileSync(resolve(root, 'public/printables/cards', name));
      const text = bytes.toString('latin1');
      expect(text.startsWith('%PDF'), name).toBe(true);
      expect(text.includes('595.28') || text.includes('595.27'), name).toBe(true);
      expect(text.includes('841.89') || text.includes('841.88'), name).toBe(true);
    }
  });
});

describe('mesh checks', () => {
  it('detects a solid, an open triangle and two shells', () => {
    execFileSync('py', ['-3', 'scripts/meshcheck.py', '--self-test'], { cwd: root, stdio: 'pipe' });
  });
});
