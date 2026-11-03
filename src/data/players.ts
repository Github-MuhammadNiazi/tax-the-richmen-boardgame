export type PlayerColor = 'red' | 'blue' | 'green' | 'gold';
export type PlayerSymbol = 'circle' | 'square' | 'triangle' | 'diamond';

export interface PlayerDef {
  id: PlayerColor;
  label: string;
  hex: string;
  symbol: PlayerSymbol;
}

/** Each colour is paired with a symbol so ownership never relies on colour alone. */
export const PLAYERS: PlayerDef[] = [
  { id: 'red', label: 'Red', hex: '#b3403a', symbol: 'circle' },
  { id: 'blue', label: 'Blue', hex: '#3a62a8', symbol: 'square' },
  { id: 'green', label: 'Green', hex: '#3f7d4f', symbol: 'triangle' },
  { id: 'gold', label: 'Gold', hex: '#c99a32', symbol: 'diamond' },
];

export const PLAYER_BY_ID = Object.fromEntries(PLAYERS.map((p) => [p.id, p])) as Record<PlayerColor, PlayerDef>;
