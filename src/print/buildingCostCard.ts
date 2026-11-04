import { COSTS, LIMITS, addCosts, costEntries, formatCost, type Cost } from '../data/costs';
import { PLAYERS, type PlayerDef } from '../data/players';
import type { CostKey } from '../data/resources';

/** Trimmed playing-card size. Bleed sits outside this rectangle and is cut away. */
export const CARD_TRIM = { w: 90, h: 128 } as const;
export const CARD_BLEED = 3;
export const CARD_BODY_PT = 8.5;
export const SHEET = { w: 210, h: 297, gap: 8 } as const;

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
    {
      label: 'Entering a Mountain',
      cost: addCosts(COSTS.road, COSTS.roadMountainSurcharge),
      note: 'Open: a Road leaving a Mountain may also cost the Stone.',
    },
    { label: 'Pipeline segment', cost: COSTS.pipeline },
    { label: 'Office', cost: COSTS.office },
    { label: 'Toll access', cost: COSTS.toll },
    {
      label: 'Property upgrade',
      cost: COSTS.upgrade,
      note: 'One per player. Open: which properties qualify.',
    },
    {
      label: 'Steel Vault',
      cost: COSTS.steelVault,
      note: 'One active Vault, after the Port is activated.',
    },
  ];
}

export function marketRows(): CostRow[] {
  return [
    { label: 'Wood Market', cost: COSTS.marketWood },
    { label: 'Metal Market', cost: COSTS.marketMetal },
    { label: 'Fuel Market', cost: COSTS.marketFuel },
    { label: 'Stone Market', cost: COSTS.marketStone },
  ];
}

/** Sentences printed on the front, in order. Costs stay in the chip rows. */
export function frontNotes(): string[] {
  return [
    'Starting City and Port: free during setup.',
    'Open: a second City is not decided.',
    'A Rig is leased. Water and the Tax Office are not for sale.',
    'Establishment marks paid ownership. No separate cost.',
    `Opening bid ${formatCost(COSTS.oilBidMinimum)}. Each later bid is at least ${LIMITS.oilBidIncrement} Money above the highest bid.`,
    'Bid money is paid at once and is not refunded.',
    'Open: whether a lease or a bid needs Road access.',
    `Steel exchange: ${chipsOf(COSTS.steelPurchase)
      .map((c) => `${c.n} ${c.key}`)
      .join(' + ')} = 1 Steel.`,
    'Requires a constructed Port Market and an activated Port. It is a trading-phase exchange, not an action.',
    `Every other cost on this card takes 1 of the turn’s ${LIMITS.actionsPerTurn} actions.`,
  ];
}

export function backSections(): { title: string; lines: string[] }[] {
  return [
    {
      title: 'Roads',
      lines: [
        'Centres of adjacent hexes.',
        'One Road per connection.',
        'A Road is not ownership.',
        'No Water or Tax Office.',
        'Entering a Mountain: +1 Stone.',
        'Open: leaving may also pay.',
      ],
    },
    {
      title: 'Owner priority',
      lines: [
        'Keep a way in and a way out.',
        'No one may close every exit.',
        'No edge is reserved in advance.',
      ],
    },
    {
      title: 'Tolls',
      lines: [
        `${formatCost(COSTS.toll)}. Permanent.`,
        'The builder still owns it.',
        `Normally ${LIMITS.tollBaseAllowance}. Third after ${LIMITS.tollThirdUnlockPaidRoads}.`,
        `Lifetime maximum ${LIMITS.tollMaxLifetime}.`,
        'No two tolls in a row.',
        'Your Road sits between them.',
      ],
    },
    {
      title: 'Offices',
      lines: [
        'Expand through a rival’s hex.',
        `${LIMITS.officesPerPlayer} per player. ${LIMITS.officesPerHex} per hex.`,
        'Only one of yours on a hex.',
        'City, Village, Mine, Mountain.',
        'No Port, Rig, Water or Tax.',
        'Not ownership. No production.',
      ],
    },
    {
      title: 'Pipelines',
      lines: [
        'Two owned hexes via a Rig.',
        'Pay the cost on each segment.',
        'A Pipeline cannot buy property.',
        'Not a City-to-Port Road.',
        'Fuel on that Rig’s roll.',
        'Owner and lessee both collect.',
        'Open: its path is not decided.',
      ],
    },
    {
      title: 'Tax Inspector',
      lines: [
        'No new Road in or out.',
        'No purchase and no new Office.',
        'Existing Roads stay usable.',
        'Rig Fuel stops. Lease stays.',
      ],
    },
    {
      title: 'Hidden terrain',
      lines: [
        'Mines and Mountains stay hidden.',
        'Open: nothing states when a tile is revealed.',
      ],
    },
    {
      title: 'Actions',
      lines: [`${LIMITS.actionsPerTurn} actions on a normal turn.`],
    },
  ];
}

/** Every string the cards print, for tests. Chip amounts are included as words. */
export function buildingCostPlainText(): string {
  const chipText = (rows: CostRow[]) => rows.map((row) => `${row.label} ${costEntries(row.cost).map(([k, n]) => `${n} ${k}`).join(' ')} ${row.note ?? ''}`).join('\n');
  return [
    ...PLAYERS.map((p) => `${p.label} ${p.symbol}`),
    chipText(propertyRows()),
    chipText(constructionRows()),
    chipText(marketRows()),
    ...frontNotes(),
    ...backSections().flatMap((section) => [section.title, ...section.lines]),
    `Lease ${costEntries(COSTS.oilLease).map(([k, n]) => `${n} ${k}`).join(' ')}`,
  ].join('\n');
}
