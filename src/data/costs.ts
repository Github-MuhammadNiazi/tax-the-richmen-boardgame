import type { CostKey, ResourceType } from './resources';
import { RESOURCES } from './resources';

/** A cost is an ordered list of [resource, amount] pairs. 'action' denotes one of the turn's two actions. */
export type Cost = Partial<Record<CostKey, number>>;

const ORDER: CostKey[] = ['money', 'wood', 'metal', 'fuel', 'stone', 'steel', 'action'];

export const COSTS = {
  road: { wood: 1, metal: 1, fuel: 1, action: 1 },
  roadMountainSurcharge: { stone: 1 },
  pipeline: { metal: 1, fuel: 1, action: 1 },
  toll: { money: 2, action: 1 },
  office: { money: 1, action: 1 },
  upgrade: { money: 3, stone: 1, action: 1 },
  oilLease: { money: 1, action: 1 },
  oilBidMinimum: { money: 2, action: 1 },
  steelVault: { money: 3, stone: 2, action: 1 },
  steelPurchase: { metal: 2, fuel: 1 },
  investCity: { money: 4, action: 1 },
  investVillage: { money: 2, action: 1 },
  investMine: { money: 3, action: 1 },
  investMountain: { money: 2, action: 1 },
  marketWood: { money: 2, metal: 1, fuel: 1, action: 1 },
  marketMetal: { money: 2, fuel: 1, stone: 1, action: 1 },
  marketFuel: { money: 2, stone: 1, wood: 1, action: 1 },
  marketStone: { money: 2, wood: 1, metal: 1, action: 1 },
} satisfies Record<string, Cost>;

export type CostId = keyof typeof COSTS;

export const LIMITS = {
  actionsPerTurn: 2,
  idleTurnBonusMoney: 1,
  tollBaseAllowance: 2,
  tollMaxLifetime: 3,
  tollThirdUnlockPaidRoads: 4,
  officesPerPlayer: 2,
  officesPerHex: 2,
  officesPerPlayerPerHex: 1,
  upgradesPerPlayer: 1,
  oilBidIncrement: 1,
  pendingBidsPerPlayer: 1,
  bankTradeRate: 4,
  marketTradeRate: 2,
  marketTradesPerTurn: 1,
  taxThreshold: 8,
  officeSharingThreshold: 8,
  officeSharingTarget: 7,
  steelTaxRange: [8, 9] as const,
  steelTaxLoss: 1,
  steelToWin: 10,
  vaultsActivePerPlayer: 1,
} as const;

export const COST_LABEL: Record<CostKey, string> = {
  money: RESOURCES.money.label,
  wood: RESOURCES.wood.label,
  metal: RESOURCES.metal.label,
  fuel: RESOURCES.fuel.label,
  stone: RESOURCES.stone.label,
  steel: 'Steel',
  action: 'Action',
};

export function costEntries(cost: Cost, opts: { includeAction?: boolean } = {}): [CostKey, number][] {
  const includeAction = opts.includeAction ?? true;
  return ORDER.filter((k) => (cost[k] ?? 0) > 0 && (includeAction || k !== 'action')).map((k) => [k, cost[k]!]);
}

/** "1 Wood + 1 Metal + 1 Fuel + 1 action" */
export function formatCost(cost: Cost, opts: { includeAction?: boolean } = {}): string {
  return costEntries(cost, opts)
    .map(([k, n]) => (k === 'action' ? `${n} action${n > 1 ? 's' : ''}` : `${n} ${COST_LABEL[k]}`))
    .join(' + ');
}

export function addCosts(a: Cost, b: Cost): Cost {
  const out: Cost = { ...a };
  for (const [k, v] of Object.entries(b) as [CostKey, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
}

export const MARKET_COST_BY_RESOURCE: Record<Exclude<ResourceType, 'money'>, CostId> = {
  wood: 'marketWood',
  metal: 'marketMetal',
  fuel: 'marketFuel',
  stone: 'marketStone',
};
