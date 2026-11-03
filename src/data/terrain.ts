import type { CostId } from './costs';
import type { ResourceType } from './resources';

export const TERRAIN_TYPES = ['city', 'village', 'mine', 'mountain', 'port', 'oil', 'water', 'tax'] as const;
export type TerrainType = (typeof TERRAIN_TYPES)[number];

export interface TerrainVariant {
  id: string;
  name: string;
  file: string;
}

export interface TerrainDef {
  id: TerrainType;
  label: string;
  plural: string;
  count: number;
  produces: ResourceType | 'steel' | null;
  /** Receives a production number from the 20-number pool. */
  numbered: boolean;
  /** Mine and Mountain tiles are placed face-down. */
  concealed: boolean;
  /** Roads may enter the hex. */
  accessible: boolean;
  officeAllowed: boolean;
  investCost: CostId | null;
  base: string;
  accent: string;
  short: string;
  description: string;
  variants: TerrainVariant[];
}

const v = (type: string, n: number, name: string): TerrainVariant => ({
  id: `${type}-${n}`,
  name,
  file: `terrain-${type}-${n}`,
});

export const TERRAIN: Record<TerrainType, TerrainDef> = {
  city: {
    id: 'city',
    label: 'City',
    plural: 'Cities',
    count: 4,
    produces: 'money',
    numbered: true,
    concealed: false,
    accessible: true,
    officeAllowed: true,
    investCost: 'investCity',
    base: '#6b4a3a',
    accent: '#b7735a',
    short: 'Produces Money',
    description:
      'Brick, rail and finance. Every player begins with one City, and each City is the starting point of a network that must reach the sea.',
    variants: [
      v('city', 1, 'Industrial Metropolis'),
      v('city', 2, 'Financial District'),
      v('city', 3, 'Railway City'),
      v('city', 4, 'Brick Factory District'),
    ],
  },
  village: {
    id: 'village',
    label: 'Village',
    plural: 'Villages',
    count: 4,
    produces: 'wood',
    numbered: true,
    concealed: false,
    accessible: true,
    officeAllowed: true,
    investCost: 'investVillage',
    base: '#5b6b3e',
    accent: '#a5a35a',
    short: 'Produces Wood',
    description: 'Farms, forests and sawmills supply the timber that every Road requires.',
    variants: [
      v('village', 1, 'Farming Settlement'),
      v('village', 2, 'Lumber Village'),
      v('village', 3, 'Hillside Hamlet'),
      v('village', 4, 'Sawmill Settlement'),
    ],
  },
  mine: {
    id: 'mine',
    label: 'Mine',
    plural: 'Mines',
    count: 4,
    produces: 'metal',
    numbered: true,
    concealed: true,
    accessible: true,
    officeAllowed: true,
    investCost: 'investMine',
    base: '#4a4642',
    accent: '#8d7b63',
    short: 'Produces Metal',
    description:
      'Shafts and excavations yield the Metal for Roads, Pipelines and Steel. Mines begin face-down, indistinguishable from Mountains.',
    variants: [
      v('mine', 1, 'Deep Mining Shaft'),
      v('mine', 2, 'Iron Excavation'),
      v('mine', 3, 'Ore-Cart Railway'),
      v('mine', 4, 'Underground Mining Complex'),
    ],
  },
  mountain: {
    id: 'mountain',
    label: 'Mountain',
    plural: 'Mountains',
    count: 4,
    produces: 'stone',
    numbered: true,
    concealed: true,
    accessible: true,
    officeAllowed: true,
    investCost: 'investMountain',
    base: '#6a6a66',
    accent: '#b3b0a6',
    short: 'Produces Stone',
    description:
      'Granite ridges provide Stone. Roads entering a Mountain cost an extra Stone. Mountains begin face-down, indistinguishable from Mines.',
    variants: [
      v('mountain', 1, 'Granite Ridge'),
      v('mountain', 2, 'Snowcapped Mountain'),
      v('mountain', 3, 'Rocky Mountain Pass'),
      v('mountain', 4, 'Steep Cliffs'),
    ],
  },
  port: {
    id: 'port',
    label: 'Port',
    plural: 'Ports',
    count: 4,
    produces: 'steel',
    numbered: false,
    concealed: false,
    accessible: true,
    officeAllowed: false,
    investCost: null,
    base: '#3e5560',
    accent: '#7d9aa3',
    short: 'Steel Cards once activated',
    description:
      'Each player starts with one Port and a permanent specialization. Connect it to your City to activate Steel production.',
    variants: [
      v('port', 1, 'Cargo Harbor'),
      v('port', 2, 'Steamship Terminal'),
      v('port', 3, 'Lighthouse Dock'),
      v('port', 4, 'Industrial Dry Dock'),
    ],
  },
  oil: {
    id: 'oil',
    label: 'Oil Rig',
    plural: 'Oil Rigs',
    count: 4,
    produces: 'fuel',
    numbered: true,
    concealed: false,
    accessible: true,
    officeAllowed: false,
    investCost: null,
    base: '#5a4a33',
    accent: '#a18556',
    short: 'Produces Fuel by lease or Pipeline',
    description:
      'Oil Rigs are never owned. Their Fuel is claimed through one-cycle leases, advance bidding, and permanent Pipelines.',
    variants: [
      v('oil', 1, 'Wooden Oil Derrick'),
      v('oil', 2, 'Steel Drilling Tower'),
      v('oil', 3, 'Pumpjack Field'),
      v('oil', 4, 'Industrial Extraction Station'),
    ],
  },
  water: {
    id: 'water',
    label: 'Water',
    plural: 'Water',
    count: 5,
    produces: null,
    numbered: false,
    concealed: false,
    accessible: false,
    officeAllowed: false,
    investCost: null,
    base: '#23414a',
    accent: '#3f6a74',
    short: 'Inaccessible',
    description: 'Open water shapes the board. No Road, Office or Inspector may enter it.',
    variants: [
      v('water', 1, 'Deep Water'),
      v('water', 2, 'Coastal Waves'),
      v('water', 3, 'Rocky Shallows'),
      v('water', 4, 'Tranquil Bay'),
      v('water', 5, 'Open Sea'),
    ],
  },
  tax: {
    id: 'tax',
    label: 'Tax Office',
    plural: 'Tax Office',
    count: 1,
    produces: null,
    numbered: false,
    concealed: false,
    accessible: false,
    officeAllowed: false,
    investCost: null,
    base: '#6e6a5e',
    accent: '#d6ac65',
    short: 'Permanently inaccessible',
    description:
      'The seat of the Treasury. Behind iron gates it can never be entered, built upon or targeted by the Inspector.',
    variants: [v('tax', 1, 'Grand Treasury')],
  },
};

export const TERRAIN_LIST = TERRAIN_TYPES.map((t) => TERRAIN[t]);

export const TOTAL_TILES = TERRAIN_LIST.reduce((a, t) => a + t.count, 0);

export const HIDDEN_BACK = { name: 'Concealed Tile Back', file: 'tile-back-hidden' };

export function terrainImage(file: string, quality: 'screen' | 'print' = 'screen'): string {
  return quality === 'screen' ? `/assets/terrain/${file}.webp` : `/assets/print/${file}.jpg`;
}

export function variantFile(terrain: TerrainType, variant: number): string {
  const vs = TERRAIN[terrain].variants;
  return vs[((variant % vs.length) + vs.length) % vs.length].file;
}

export const PORT_SPECIALIZATIONS = ['wood', 'metal', 'fuel', 'stone'] as const;
export type PortSpecialization = (typeof PORT_SPECIALIZATIONS)[number];
