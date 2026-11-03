import type { PlayerSymbol as Sym } from '../../data/players';

export function PlayerSymbolShape({ symbol, cx = 0, cy = 0, r = 6, fill, stroke = '#f2e6cf', strokeWidth = 1.5 }: {
  symbol: Sym;
  cx?: number;
  cy?: number;
  r?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const common = { fill, stroke, strokeWidth };
  switch (symbol) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={r} {...common} />;
    case 'square':
      return <rect x={cx - r * 0.85} y={cy - r * 0.85} width={r * 1.7} height={r * 1.7} {...common} />;
    case 'triangle':
      return <polygon points={`${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.7} ${cx - r * 0.95},${cy + r * 0.7}`} {...common} />;
    case 'diamond':
      return <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} {...common} />;
  }
}
