import type { TerrainType } from '../data/terrain';

export type MapMode = 'classic' | 'balanced' | 'custom';

export interface MapTile {
  slot: number;
  terrain: TerrainType;
  variant: number;
  number: number | null;
  /** Only meaningful for concealed terrain (Mine/Mountain): shown face-up when true. */
  revealed: boolean;
  locked: boolean;
}

export interface BoardMap {
  version: 1;
  name: string;
  mode: MapMode;
  seed: string;
  tiles: MapTile[];
}

export interface GenerationReport {
  candidatesTried: number;
  candidatesValid: number;
  bestScore: number;
  /** True when no candidate passed every hard check and the best available map was returned. */
  fallback: boolean;
}
