import { describe, expect, it } from 'vitest';
import { STEPS } from '../pages/HowToPlayPage';
import { COMPONENTS } from './components';
import { COSTS, LIMITS, formatCost } from './costs';
import { HIGH_NUMBERS, LOW_NUMBERS, NUMBER_DISTRIBUTION, PORT_NUMBERS, numberPool } from './numbers';
import { STARTING_RESOURCES, STARTING_RESOURCE_TOTAL } from './resources';
import { ALL_CLARIFICATIONS, GLOSSARY, RULE_SECTIONS, findRule, ruleText } from './rules';
import { STEEL_DECK, STEEL_DECK_SIZE, steelDeckCards } from './steel';
import { TERRAIN, TOTAL_TILES } from './terrain';

describe('frozen game data', () => {
  it('has the approved terrain quantities (30 tiles)', () => {
    expect(Object.fromEntries(Object.values(TERRAIN).map((t) => [t.id, t.count]))).toEqual({
      city: 4,
      village: 4,
      mine: 4,
      mountain: 4,
      port: 4,
      oil: 4,
      water: 5,
      tax: 1,
    });
    expect(TOTAL_TILES).toBe(30);
  });

  it('only Mines and Mountains are concealed', () => {
    expect(Object.values(TERRAIN).filter((t) => t.concealed).map((t) => t.id).sort()).toEqual(['mine', 'mountain']);
  });

  it('has the approved number token distribution with no 7', () => {
    expect(NUMBER_DISTRIBUTION).toEqual({ 3: 2, 4: 3, 5: 3, 6: 2, 8: 2, 9: 3, 10: 3, 11: 2 });
    expect(numberPool()).toHaveLength(20);
    expect(numberPool()).not.toContain(7);
    expect([...PORT_NUMBERS]).toEqual([5, 6, 8, 9]);
    expect([...HIGH_NUMBERS]).toEqual([5, 6, 8, 9]);
    expect([...LOW_NUMBERS]).toEqual([3, 4, 10, 11]);
  });

  it('has a 20-card Steel deck with values 1–5', () => {
    expect(STEEL_DECK_SIZE).toBe(20);
    expect(steelDeckCards()).toHaveLength(20);
    expect(STEEL_DECK.map((c) => [c.value, c.count])).toEqual([
      [1, 5],
      [2, 5],
      [3, 4],
      [4, 4],
      [5, 2],
    ]);
  });

  it('gives each player 19 starting resources', () => {
    expect(STARTING_RESOURCES).toEqual({ money: 6, wood: 4, metal: 4, fuel: 4, stone: 1 });
    expect(STARTING_RESOURCE_TOTAL).toBe(19);
  });

  it('keeps the key costs and limits', () => {
    expect(formatCost(COSTS.road)).toBe('1 Wood + 1 Metal + 1 Fuel + 1 action');
    expect(COSTS.roadMountainSurcharge).toEqual({ stone: 1 });
    expect(COSTS.toll).toEqual({ money: 2, action: 1 });
    expect(COSTS.steelPurchase).toEqual({ metal: 2, fuel: 1 });
    expect(COSTS.steelVault).toEqual({ money: 3, stone: 2, action: 1 });
    expect(LIMITS.actionsPerTurn).toBe(2);
    expect(LIMITS.taxThreshold).toBe(8);
    expect(LIMITS.steelToWin).toBe(10);
    expect(LIMITS.bankTradeRate).toBe(4);
    expect(LIMITS.marketTradeRate).toBe(2);
  });
});

describe('rules source', () => {
  const items = RULE_SECTIONS.flatMap((s) => s.items);

  it('has unique section and item ids', () => {
    const ids = [...RULE_SECTIONS.map((s) => s.id), ...items.map((i) => i.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only defined cost ids', () => {
    for (const item of items) for (const c of item.costs ?? []) expect(COSTS).toHaveProperty(c.cost);
  });

  it('lists every open clarification and attaches each to at least one rule', () => {
    expect(ALL_CLARIFICATIONS).toHaveLength(12);
    const attached = new Set(items.flatMap((i) => (i.clarifications ?? []).map((c) => c.id)));
    for (const c of ALL_CLARIFICATIONS) expect(attached).toContain(c.id);
  });

  it('resolves every glossary, component and How to Play reference', () => {
    for (const g of GLOSSARY) if (g.ref) expect(findRule(g.ref), g.term).not.toBeNull();
    for (const c of COMPONENTS) expect(findRule(c.rule), c.id).not.toBeNull();
    for (const s of STEPS) for (const id of s.rules) expect(findRule(id), `${s.id}:${id}`).not.toBeNull();
  });

  it('produces searchable plain text for each rule', () => {
    const t = ruleText(findRule('steel-vault')!.item);
    expect(t.toLowerCase()).toContain('vault');
    expect(t).not.toContain('**');
  });
});

describe('How to Play', () => {
  it('has the fourteen required steps in order', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['goal', 'board', 'numbers', 'setup', 'resources', 'turn', 'production', 'trading', 'roads', 'tolls', 'invest', 'oil', 'inspector', 'steel']);
  });
});

describe('components catalogue', () => {
  it('covers at least fifteen components with images, purpose and placement', () => {
    expect(COMPONENTS.length).toBeGreaterThanOrEqual(15);
    for (const c of COMPONENTS) {
      expect(c.image).toMatch(/\.webp$/);
      expect(c.alt.length).toBeGreaterThan(10);
      expect(c.purpose).toBeTruthy();
      expect(c.placement).toBeTruthy();
    }
  });
});
