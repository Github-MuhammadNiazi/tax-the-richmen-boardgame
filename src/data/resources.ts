export const RESOURCE_TYPES = ['money', 'wood', 'metal', 'fuel', 'stone'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** Steel is not an ordinary resource: it cannot be traded, stolen, or bank-exchanged. */
export type CostKey = ResourceType | 'steel' | 'action';

export interface ResourceDef {
  id: ResourceType;
  label: string;
  token: string;
  color: string;
  description: string;
}

export const RESOURCES: Record<ResourceType, ResourceDef> = {
  money: {
    id: 'money',
    label: 'Money',
    token: 'Antique brass coin',
    color: '#d6ac65',
    description: 'Produced by Cities. Pays for property investment, Offices, tolls, leases, bids, Markets and Vaults.',
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    token: 'Tied timber bundle',
    color: '#9a6b3f',
    description: 'Produced by Villages. A component of every Road.',
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    token: 'Iron ingot',
    color: '#8d969b',
    description: 'Produced by Mines. Used in Roads, Pipelines and Steel purchase.',
  },
  fuel: {
    id: 'fuel',
    label: 'Fuel',
    token: 'Black oil barrel',
    color: '#3a3a3a',
    description: 'Produced by leased Oil Rigs and connected Pipelines. Used in Roads, Pipelines and Steel purchase.',
  },
  stone: {
    id: 'stone',
    label: 'Stone',
    token: 'Rough granite block',
    color: '#9c9a92',
    description: 'Produced by Mountains. Required for Mountain roads, upgrades, Markets and Vaults.',
  },
};

export const STARTING_RESOURCES: Record<ResourceType, number> = {
  money: 6,
  wood: 4,
  metal: 4,
  fuel: 4,
  stone: 1,
};

export const STARTING_RESOURCE_TOTAL = Object.values(STARTING_RESOURCES).reduce((a, b) => a + b, 0);
