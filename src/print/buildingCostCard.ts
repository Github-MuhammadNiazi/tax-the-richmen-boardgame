import { COSTS, LIMITS, addCosts, costEntries, formatCost, type Cost } from '../data/costs';
import { PLAYERS, type PlayerColor, type PlayerDef } from '../data/players';
import type { CostKey } from '../data/resources';

/** Trimmed playing-card size. Bleed sits outside this rectangle and is cut away. */
export const CARD_TRIM = { w: 90, h: 128 } as const;
export const CARD_BLEED = 3;
export const CARD_BODY_PT = 9;
export const SHEET = { w: 210, h: 297, gap: 8 } as const;

/** Print accents. Colour is a border and a badge, never a filled background. */
export const CARD_ACCENT: Record<PlayerColor, string> = {
  red: '#6E2A33',
  blue: '#1C3A56',
  green: '#1E4630',
  gold: '#8A6424',
};

export const FRONT_TITLE = 'BUILDING COSTS';
export const BACK_TITLE = 'CONSTRUCTION & PLACEMENT';

export const BUILDING_COST_FILES = [
  {
    file: '/printables/cards/building-cost-cards-a4-duplex.pdf',
    name: 'Building cost cards, duplex',
    note: 'Four 90 × 128 mm cards. Backs are mirrored for a long-edge flip.',
  },
  {
    file: '/printables/cards/building-cost-cards-a4-fronts.pdf',
    name: 'Building cost card fronts',
    note: 'Fronts only, with crop marks and 3 mm bleed.',
  },
  {
    file: '/printables/cards/building-cost-cards-a4-backs.pdf',
    name: 'Building cost card backs',
    note: 'Backs mirrored to match the fronts on a long-edge flip.',
  },
  {
    file: '/printables/cards/building-cost-cards-a4-low-ink.pdf',
    name: 'Building cost cards, low ink',
    note: 'The duplex pair without filled parchment.',
  },
  {
    file: '/printables/cards/building-cost-cards-printing-guide.pdf',
    name: 'Building cost card printing guide',
    note: 'A4, 100% scale, long-edge duplex, and a single-sided alternative.',
  },
] as const;

export function bleedSize() {
  return { w: CARD_TRIM.w + CARD_BLEED * 2, h: CARD_TRIM.h + CARD_BLEED * 2 };
}

/** Top-left of the bleed boxes on the A4 sheet. */
export function sheetOrigin() {
  const box = bleedSize();
  const contentW = box.w * 2 + SHEET.gap;
  const contentH = box.h * 2 + SHEET.gap;
  return {
    x: (SHEET.w - contentW) / 2,
    y: (SHEET.h - contentH) / 2,
    box,
    contentW,
    contentH,
  };
}

export interface CardSlot {
  player: PlayerDef;
  col: number;
  row: number;
}

/** Reading order on the front sheet: Red, Blue, then Green, Gold. */
export function frontSlots(): CardSlot[] {
  return PLAYERS.map((player, i) => ({ player, col: i % 2, row: Math.floor(i / 2) }));
}

/**
 * Long-edge duplex flips a portrait sheet left to right.
 * A back is drawn in the mirrored column so it lands on its own front.
 */
export function backSlots(): CardSlot[] {
  return frontSlots().map((slot) => ({ ...slot, col: 1 - slot.col }));
}

export interface CostChip {
  key: CostKey;
  n: number;
}

export function chipsOf(cost: Cost): CostChip[] {
  return costEntries(cost).map(([key, n]) => ({ key, n }));
}

/** What the card draws. Actions are a footer, not an icon on every row. */
export function picturedCost(cost: Cost): CostChip[] {
  return costEntries(cost, { includeAction: false }).map(([key, n]) => ({ key, n }));
}

export interface CostRow {
  label: string;
  cost: Cost;
  note?: string;
}

export function propertyRows(): CostRow[] {
  return [
    { label: 'City', cost: COSTS.investCity },
    { label: 'Village', cost: COSTS.investVillage },
    { label: 'Mine', cost: COSTS.investMine },
    { label: 'Mountain', cost: COSTS.investMountain },
  ];
}

export function constructionRows(): CostRow[] {
  return [
    { label: 'Road', cost: COSTS.road },
    { label: 'Mountain entry', cost: addCosts(COSTS.road, COSTS.roadMountainSurcharge) },
    { label: 'Pipeline', cost: COSTS.pipeline },
    { label: 'Office', cost: COSTS.office },
    { label: 'Toll', cost: COSTS.toll },
  ];
}

export function improvementRows(): CostRow[] {
  return [
    { label: 'Upgrade', cost: COSTS.upgrade },
    { label: 'Steel Vault', cost: COSTS.steelVault },
  ];
}

export function marketRows(): CostRow[] {
  return [
    { label: 'Wood', cost: COSTS.marketWood },
    { label: 'Metal', cost: COSTS.marketMetal },
    { label: 'Fuel', cost: COSTS.marketFuel },
    { label: 'Stone', cost: COSTS.marketStone },
  ];
}

/** Short marks that are printed. Unresolved rules stay in the rulebook. */
export function cardMarks() {
  const toll = formatCost(COSTS.toll, { includeAction: false });
  return {
    pipeline: 'each',
    bid: 'min',
    raise: `+${LIMITS.oilBidIncrement}`,
    steel: 'Trade',
    steelNote: 'Port Market',
    footer: 'Construction & investments: 1 action',
    backFooter: `${LIMITS.actionsPerTurn} actions each turn. See the rulebook.`,
    tollPay: `Pay ${toll} for permanent access.`,
  };
}

export function backCards(): { title: string; lines: string[] }[] {
  const marks = cardMarks();
  return [
    { title: 'ROADS', lines: ['Connect adjacent hex centers.', 'Not on water or the Tax Office.'] },
    { title: 'MOUNTAINS', lines: ['Extra Stone to enter.'] },
    {
      title: 'OFFICES',
      lines: ['Foothold on a rival hex.', `Max ${LIMITS.officesPerPlayer} per player / ${LIMITS.officesPerHex} per hex.`],
    },
    { title: 'TOLLS', lines: [marks.tollPay, 'No consecutive tolls.'] },
    { title: 'PIPELINES', lines: ['Connect 2 owned hexes', 'through an Oil Rig.', 'Fuel, not a victory road.'] },
    { title: 'INSPECTOR', lines: ['No new construction or purchases.', 'Existing Roads remain usable.'] },
    { title: 'ACCESS', lines: ['Owners retain access', 'in and out.'] },
    { title: 'OFFICE SITES', lines: ['Allowed', 'Not allowed'] },
  ];
}

export const OFFICE_ALLOWED = ['City', 'Village', 'Mine', 'Mountain'] as const;
export const OFFICE_BARRED = ['Port', 'Rig', 'Water', 'Tax'] as const;

/** Every string the cards print. Amounts are the pictured resources, without an action chip. */
export function buildingCostPlainText(): string {
  const chipText = (rows: CostRow[]) =>
    rows.map((row) => `${row.label} ${picturedCost(row.cost).map((chip) => `${chip.n} ${chip.key}`).join(' ')}`).join('\n');
  const marks = cardMarks();
  const steel = picturedCost(COSTS.steelPurchase)
    .map((chip) => `${chip.n} ${chip.key}`)
    .join(' ');
  return [
    FRONT_TITLE,
    BACK_TITLE,
    ...PLAYERS.map((player) => `${player.label} ${player.symbol}`),
    chipText(propertyRows()),
    chipText(constructionRows()),
    chipText(improvementRows()),
    chipText(marketRows()),
    `Lease ${picturedCost(COSTS.oilLease).map((chip) => `${chip.n} ${chip.key}`).join(' ')}`,
    `Bid ${picturedCost(COSTS.oilBidMinimum).map((chip) => `${chip.n} ${chip.key}`).join(' ')} ${marks.bid} ${marks.raise}`,
    `Steel ${steel} = 1 steel ${marks.steel} ${marks.steelNote}`,
    marks.pipeline,
    marks.footer,
    ...backCards().flatMap((card) => [card.title, ...card.lines]),
    ...OFFICE_ALLOWED,
    ...OFFICE_BARRED,
    marks.backFooter,
  ].join('\n');
}
