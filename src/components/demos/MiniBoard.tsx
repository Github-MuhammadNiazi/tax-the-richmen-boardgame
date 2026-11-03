import { useId, type ReactNode } from 'react';
import type { TerrainType } from '../../data/terrain';
import { TERRAIN } from '../../data/terrain';
import { SQRT3, hexPath } from '../../map/geometry';
import { BoardDefs, NumberDisc, TileFace } from '../board/TileArt';

export interface MiniCell {
  id: string;
  /** Column and row in an "odd columns shifted down" flat-top layout. */
  col: number;
  row: number;
  terrain: TerrainType;
  variant?: number;
  number?: number;
  concealed?: boolean;
}

export interface MiniLayout {
  width: number;
  height: number;
  radius: number;
  center: Record<string, { x: number; y: number }>;
}

export function miniLayout(cells: MiniCell[], radius = 60, padding = 12): MiniLayout {
  const raw = cells.map((c) => ({ id: c.id, x: 1.5 * c.col, y: SQRT3 * (c.row + (c.col % 2 ? 0.5 : 0)) }));
  const minX = Math.min(...raw.map((p) => p.x)) - 1;
  const maxX = Math.max(...raw.map((p) => p.x)) + 1;
  const minY = Math.min(...raw.map((p) => p.y)) - SQRT3 / 2;
  const maxY = Math.max(...raw.map((p) => p.y)) + SQRT3 / 2;
  const center: MiniLayout['center'] = {};
  for (const p of raw) center[p.id] = { x: (p.x - minX) * radius + padding, y: (p.y - minY) * radius + padding };
  return { width: (maxX - minX) * radius + padding * 2, height: (maxY - minY) * radius + padding * 2, radius, center };
}

/** Pairs of cells whose centres are exactly one hex apart. */
export function miniEdges(cells: MiniCell[]): [string, string][] {
  const out: [string, string][] = [];
  const pos = cells.map((c) => ({ id: c.id, x: 1.5 * c.col, y: SQRT3 * (c.row + (c.col % 2 ? 0.5 : 0)) }));
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++) {
      const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y);
      if (Math.abs(d - SQRT3) < 1e-6) out.push([pos[i].id, pos[j].id]);
    }
  return out;
}

export type CellTone = 'eligible' | 'blocked' | 'active' | 'muted' | undefined;

/**
 * A small decorative-but-accurate cluster of board tiles for tutorials.
 * `overlay` renders above the tiles in the same coordinate space.
 */
export function MiniBoard({
  cells,
  layout,
  label,
  tone,
  onCellClick,
  cellLabel,
  overlay,
  showNumbers = true,
  className = '',
}: {
  cells: MiniCell[];
  layout: MiniLayout;
  label: string;
  tone?: (cell: MiniCell) => CellTone;
  onCellClick?: (cell: MiniCell) => void;
  cellLabel?: (cell: MiniCell) => string;
  overlay?: ReactNode;
  showNumbers?: boolean;
  className?: string;
}) {
  const prefix = `mb${useId().replace(/:/g, '')}`;
  const R = layout.radius;
  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={label} className={`h-auto w-full select-none ${className}`}>
      <BoardDefs prefix={prefix} />
      {cells.map((cell) => {
        const c = layout.center[cell.id];
        const t = tone?.(cell);
        const interactive = !!onCellClick;
        return (
          <g
            key={cell.id}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? (cellLabel?.(cell) ?? TERRAIN[cell.terrain].label) : undefined}
            onClick={interactive ? () => onCellClick(cell) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onCellClick(cell);
                    }
                  }
                : undefined
            }
            className={interactive ? 'cursor-pointer outline-none [&:focus-visible>path.focus]:opacity-100' : undefined}
            opacity={t === 'muted' ? 0.45 : 1}
          >
            <TileFace prefix={prefix} cx={c.x} cy={c.y} radius={R} terrain={cell.terrain} variant={cell.variant ?? 0} concealed={!!cell.concealed} />
            {showNumbers && cell.number != null && !cell.concealed && (
              <NumberDisc prefix={prefix} cx={c.x} cy={c.y} radius={R} value={cell.number} port={cell.terrain === 'port'} />
            )}
            {t === 'eligible' && <path d={hexPath(c.x, c.y, R * 0.86)} fill="none" stroke="#d6ac65" strokeWidth={R * 0.05} strokeDasharray={`${R * 0.1} ${R * 0.07}`} />}
            {t === 'active' && <path d={hexPath(c.x, c.y, R * 0.9)} fill="#d6ac65" fillOpacity="0.12" stroke="#f0d49c" strokeWidth={R * 0.07} />}
            {t === 'blocked' && <path d={hexPath(c.x, c.y, R * 0.9)} fill="#000" fillOpacity="0.35" stroke="#a8423c" strokeWidth={R * 0.04} />}
            <path className="focus" d={hexPath(c.x, c.y, R * 0.94)} fill="none" stroke="#f2e6cf" strokeWidth={R * 0.05} opacity="0" />
          </g>
        );
      })}
      {overlay}
    </svg>
  );
}
