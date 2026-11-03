import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { PlayerColor } from '../../data/players';
import { TERRAIN } from '../../data/terrain';
import { boardLayout, hexPath, SLOTS } from '../../map/geometry';
import type { MapTile } from '../../map/types';
import {
  BoardDefs,
  BODY_FONT,
  DISPLAY_FONT,
  InspectorToken,
  NumberDisc,
  OfficeBuilding,
  OwnershipFlag,
  PipelinePiece,
  RoadPiece,
  TILE_INSET,
  TileFace,
  screenImages,
  type ImageResolver,
} from './TileArt';

export type HighlightTone = 'error' | 'warning' | 'focus' | 'route';

export interface BoardPieces {
  roads?: { a: number; b: number; color: PlayerColor }[];
  pipelines?: { a: number; b: number; color: PlayerColor }[];
  owners?: { slot: number; color: PlayerColor }[];
  offices?: { slot: number; color: PlayerColor }[];
  inspector?: number | null;
}

export interface BoardInteraction {
  focusSlot?: number | null;
  onTileClick?: (slot: number) => void;
  onTilePointerDown?: (slot: number, e: PointerEvent<SVGGElement>) => void;
  onTileEnter?: (slot: number) => void;
  onTileLeave?: (slot: number) => void;
  onTileKeyDown?: (slot: number, e: KeyboardEvent<SVGGElement>) => void;
  onTileFocus?: (slot: number) => void;
  describe?: (tile: MapTile) => string;
}

export interface BoardArtProps {
  tiles: MapTile[];
  prefix: string;
  radius?: number;
  padding?: number;
  revealAll?: boolean;
  showNumbers?: boolean;
  showSlotLabels?: boolean;
  imageFor?: ImageResolver;
  selected?: number | null;
  hovered?: number | null;
  swapSource?: number | null;
  dropTarget?: number | null;
  highlights?: Map<number, HighlightTone>;
  dim?: Set<number>;
  pieces?: BoardPieces;
  interaction?: BoardInteraction;
  children?: ReactNode;
  /** When true, wraps output in a <g> only (for nesting inside a larger SVG sheet). */
  asGroup?: boolean;
  title?: string;
}

const TONE: Record<HighlightTone, string> = {
  error: '#d0574e',
  warning: '#e0a43c',
  focus: '#d6ac65',
  route: '#8fc79b',
};

export function boardSize(radius = 100, padding = 24) {
  const l = boardLayout(radius, padding);
  return { width: l.width, height: l.height };
}

export function BoardArt({
  tiles,
  prefix,
  radius = 100,
  padding = 24,
  revealAll = false,
  showNumbers = true,
  showSlotLabels = false,
  imageFor = screenImages,
  selected = null,
  hovered = null,
  swapSource = null,
  dropTarget = null,
  highlights,
  dim,
  pieces,
  interaction,
  children,
  asGroup = false,
  title,
}: BoardArtProps) {
  const layout = boardLayout(radius, padding);
  const c = layout.centers;
  const sorted = [...tiles].sort((a, b) => a.slot - b.slot);
  const interactive = !!interaction;

  const body = (
    <>
      <BoardDefs prefix={prefix} />
      {sorted.map((t) => {
        const { x, y } = c[t.slot];
        const def = TERRAIN[t.terrain];
        const faceDown = def.concealed && !t.revealed && !revealAll;
        const label = interaction?.describe?.(t) ?? `Hex ${t.slot + 1}`;
        const focused = interaction?.focusSlot === t.slot;
        return (
          <g
            key={t.slot}
            data-slot={t.slot}
            data-terrain={faceDown ? 'concealed' : t.terrain}
            opacity={dim?.has(t.slot) ? 0.35 : 1}
            {...(interactive
              ? {
                  role: 'button',
                  tabIndex: focused ? 0 : -1,
                  'aria-label': label,
                  'aria-pressed': selected === t.slot,
                  style: { cursor: 'pointer', outline: 'none' },
                  onClick: () => interaction!.onTileClick?.(t.slot),
                  onPointerDown: (e: PointerEvent<SVGGElement>) => interaction!.onTilePointerDown?.(t.slot, e),
                  onPointerEnter: () => interaction!.onTileEnter?.(t.slot),
                  onPointerLeave: () => interaction!.onTileLeave?.(t.slot),
                  onKeyDown: (e: KeyboardEvent<SVGGElement>) => interaction!.onTileKeyDown?.(t.slot, e),
                  onFocus: () => interaction!.onTileFocus?.(t.slot),
                }
              : {})}
          >
            <TileFace
              prefix={prefix}
              cx={x}
              cy={y}
              radius={radius}
              terrain={t.terrain}
              variant={t.variant}
              concealed={faceDown}
              imageFor={imageFor}
              revealedHidden={def.concealed && !faceDown}
            />
            {hovered === t.slot && <path d={hexPath(x, y, radius * TILE_INSET)} fill="#f2e6cf" fillOpacity="0.12" />}
          </g>
        );
      })}

      {/* Problem and route highlights */}
      {highlights &&
        [...highlights.entries()].map(([slot, tone]) => (
          <path
            key={`h${slot}`}
            d={hexPath(c[slot].x, c[slot].y, radius * TILE_INSET * 0.93)}
            fill={TONE[tone]}
            fillOpacity={tone === 'route' ? 0.12 : 0.16}
            stroke={TONE[tone]}
            strokeWidth={radius * 0.05}
            strokeDasharray={tone === 'warning' ? `${radius * 0.1} ${radius * 0.06}` : undefined}
            pointerEvents="none"
          />
        ))}

      {/* Pieces */}
      {pieces?.roads?.map((r, i) => (
        <RoadPiece key={`r${i}`} x1={c[r.a].x} y1={c[r.a].y} x2={c[r.b].x} y2={c[r.b].y} radius={radius} color={r.color} />
      ))}
      {pieces?.pipelines?.map((r, i) => (
        <PipelinePiece key={`p${i}`} x1={c[r.a].x} y1={c[r.a].y} x2={c[r.b].x} y2={c[r.b].y} radius={radius} color={r.color} />
      ))}

      {/* Number tokens */}
      {showNumbers &&
        sorted.map((t) => {
          if (t.number == null) return null;
          const def = TERRAIN[t.terrain];
          const faceDown = def.concealed && !t.revealed && !revealAll;
          if (faceDown) return null;
          return (
            <g key={`n${t.slot}`} pointerEvents="none">
              <NumberDisc
                prefix={prefix}
                cx={c[t.slot].x}
                cy={c[t.slot].y}
                radius={radius}
                value={t.number}
                port={t.terrain === 'port'}
                concealedPreview={def.concealed}
              />
            </g>
          );
        })}

      {pieces?.owners?.map((o, i) => (
        <OwnershipFlag key={`o${i}`} cx={c[o.slot].x - radius * 0.55} cy={c[o.slot].y} radius={radius} color={o.color} />
      ))}
      {pieces?.offices?.map((o, i) => (
        <OfficeBuilding key={`f${i}`} cx={c[o.slot].x + radius * 0.56} cy={c[o.slot].y + radius * 0.05} radius={radius} color={o.color} />
      ))}
      {pieces?.inspector != null && <InspectorToken cx={c[pieces.inspector].x} cy={c[pieces.inspector].y - radius * 0.05} radius={radius} />}

      {/* Selection */}
      {[
        [swapSource, '#8fc79b'],
        [dropTarget, '#e8c98e'],
        [selected, '#e8c98e'],
      ].map(([slot, color], i) =>
        slot == null ? null : (
          <g key={`s${i}`} pointerEvents="none">
            <path d={hexPath(c[slot as number].x, c[slot as number].y, radius * TILE_INSET)} fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth={radius * 0.1} />
            <path
              d={hexPath(c[slot as number].x, c[slot as number].y, radius * TILE_INSET)}
              fill="none"
              stroke={color as string}
              strokeWidth={radius * 0.055}
              strokeDasharray={i === 0 ? `${radius * 0.12} ${radius * 0.06}` : undefined}
            />
          </g>
        ),
      )}
      {interaction?.focusSlot != null && (
        <path
          className="board-focus-ring"
          d={hexPath(c[interaction.focusSlot].x, c[interaction.focusSlot].y, radius * TILE_INSET * 0.86)}
          fill="none"
          stroke="#f2e6cf"
          strokeWidth={radius * 0.025}
          pointerEvents="none"
        />
      )}

      {showSlotLabels &&
        SLOTS.map((s) => (
          <g key={`l${s.index}`} pointerEvents="none">
            <rect x={c[s.index].x - radius * 0.17} y={c[s.index].y - radius * 0.8} width={radius * 0.34} height={radius * 0.2} rx={radius * 0.04} fill="#151b1d" fillOpacity="0.78" />
            <text x={c[s.index].x} y={c[s.index].y - radius * 0.65} textAnchor="middle" fontFamily={BODY_FONT} fontWeight={600} fontSize={radius * 0.14} fill="#f2e6cf">
              {s.index + 1}
            </text>
          </g>
        ))}
      {children}
    </>
  );

  if (asGroup) return <g>{body}</g>;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width="100%"
      role={interactive ? 'group' : 'img'}
      aria-label={title ?? 'Tax the Richmen 30-hex board'}
      style={{ fontFamily: DISPLAY_FONT, display: 'block' }}
    >
      {title && <title>{title}</title>}
      {body}
    </svg>
  );
}
