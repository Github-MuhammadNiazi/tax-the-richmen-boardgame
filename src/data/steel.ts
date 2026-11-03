export const STEEL_DECK: { value: number; count: number }[] = [
  { value: 1, count: 5 },
  { value: 2, count: 5 },
  { value: 3, count: 4 },
  { value: 4, count: 4 },
  { value: 5, count: 2 },
];

export const STEEL_DECK_SIZE = STEEL_DECK.reduce((a, c) => a + c.count, 0);
export const STEEL_DECK_TOTAL_VALUE = STEEL_DECK.reduce((a, c) => a + c.value * c.count, 0);
export const STEEL_CARD_AVERAGE = STEEL_DECK_TOTAL_VALUE / STEEL_DECK_SIZE;

export function steelDeckCards(): number[] {
  return STEEL_DECK.flatMap((c) => Array.from({ length: c.count }, () => c.value));
}
