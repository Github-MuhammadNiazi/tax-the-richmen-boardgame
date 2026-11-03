import { dicePips } from '../../data/numbers';
import { PLAYER_BY_ID, type PlayerColor } from '../../data/players';
import { HIDDEN_BACK, TERRAIN, terrainImage, variantFile, type TerrainType } from '../../data/terrain';
import { hexPath } from '../../map/geometry';
import { PlayerSymbolShape } from '../ui/PlayerSymbol';

export const TILE_INSET = 0.965;
const S = Math.sqrt(3) / 4;

export type ImageResolver = (file: string) => string;
export const screenImages: ImageResolver = (file) => terrainImage(file, 'screen');
export const printImages: ImageResolver = (file) => terrainImage(file, 'print');

export const DISPLAY_FONT = "'Cinzel', Georgia, 'Times New Roman', serif";
export const BODY_FONT = "'Inter', 'Segoe UI', Arial, sans-serif";

/** Shared <defs>: one hex clip in bounding-box units plus the printed-tile vignette. */
export function BoardDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <clipPath id={`${prefix}-hex`} clipPathUnits="objectBoundingBox">
        <polygon points={`1,0.5 0.75,${0.5 + S} 0.25,${0.5 + S} 0,0.5 0.25,${0.5 - S} 0.75,${0.5 - S}`} />
      </clipPath>
      <radialGradient id={`${prefix}-vignette`} cx="0.42" cy="0.38" r="0.7">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </radialGradient>
      <linearGradient id={`${prefix}-sheen`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${prefix}-disc`} cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#fbf3e1" />
        <stop offset="1" stopColor="#e0cfa9" />
      </radialGradient>
      <radialGradient id={`${prefix}-portdisc`} cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#3a4a52" />
        <stop offset="1" stopColor="#1d272c" />
      </radialGradient>
      <linearGradient id={`${prefix}-brass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f0d49c" />
        <stop offset="0.5" stopColor="#d6ac65" />
        <stop offset="1" stopColor="#8a6634" />
      </linearGradient>
    </defs>
  );
}

export interface TileFaceProps {
  prefix: string;
  cx: number;
  cy: number;
  radius: number;
  terrain: TerrainType;
  variant: number;
  concealed: boolean;
  imageFor?: ImageResolver;
  /** Marks a face-up concealed tile with a dashed ring so inspectors know it is normally hidden. */
  revealedHidden?: boolean;
}

/** Physical tile: thickness edge, artwork clipped to a flat-top hex, vignette and bevel. */
export function TileFace({ prefix, cx, cy, radius, terrain, variant, concealed, imageFor = screenImages, revealedHidden }: TileFaceProps) {
  const r = radius * TILE_INSET;
  const file = concealed ? HIDDEN_BACK.file : variantFile(terrain, variant);
  const def = TERRAIN[terrain];
  return (
    <g>
      <path d={hexPath(cx, cy + radius * 0.055, r)} fill="#0b0f10" opacity="0.85" />
      <path d={hexPath(cx, cy, r)} fill={concealed ? '#3a3d3c' : def.base} />
      <image
        href={imageFor(file)}
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${prefix}-hex)`}
      />
      <path d={hexPath(cx, cy, r)} fill={`url(#${prefix}-vignette)`} />
      <path d={hexPath(cx, cy, r)} fill={`url(#${prefix}-sheen)`} />
      <path d={hexPath(cx, cy, r)} fill="none" stroke="#0d1112" strokeWidth={radius * 0.03} />
      <path d={hexPath(cx, cy, r * 0.955)} fill="none" stroke="#f2e6cf" strokeOpacity="0.14" strokeWidth={radius * 0.012} />
      {terrain === 'tax' && !concealed && (
        <path d={hexPath(cx, cy, r * 0.9)} fill="none" stroke="#a8423c" strokeOpacity="0.8" strokeWidth={radius * 0.025} strokeDasharray={`${radius * 0.06} ${radius * 0.04}`} />
      )}
      {revealedHidden && (
        <path d={hexPath(cx, cy, r * 0.9)} fill="none" stroke="#d6ac65" strokeOpacity="0.85" strokeWidth={radius * 0.02} strokeDasharray={`${radius * 0.03} ${radius * 0.05}`} />
      )}
    </g>
  );
}

export function NumberDisc({
  prefix,
  cx,
  cy,
  radius,
  value,
  port = false,
  concealedPreview = false,
  flat = false,
}: {
  prefix: string;
  cx: number;
  cy: number;
  radius: number;
  value: number;
  port?: boolean;
  concealedPreview?: boolean;
  /** Omit the drop shadow (printed token sheets). */
  flat?: boolean;
}) {
  const r = radius * 0.27;
  const pips = dicePips(value);
  const hot = value === 6 || value === 8;
  const ink = port ? '#f2e6cf' : hot ? '#9b2f28' : '#2b2219';
  return (
    <g>
      {!flat && <circle cx={cx} cy={cy + r * 0.12} r={r * 1.04} fill="#000" opacity="0.45" />}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${prefix}-${port ? 'portdisc' : 'disc'})`} stroke={`url(#${prefix}-brass)`} strokeWidth={r * 0.12} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke={port ? '#d6ac65' : '#8a6634'} strokeOpacity="0.55" strokeWidth={r * 0.035} strokeDasharray={concealedPreview ? `${r * 0.12} ${r * 0.1}` : undefined} />
      <text
        x={cx}
        y={cy + r * 0.2}
        textAnchor="middle"
        fontFamily={DISPLAY_FONT}
        fontWeight={700}
        fontSize={r * (value >= 10 ? 0.86 : 1.0)}
        fill={ink}
      >
        {value}
      </text>
      <g fill={port ? '#d6ac65' : ink}>
        {Array.from({ length: pips }, (_, i) => (
          <circle key={i} cx={cx + (i - (pips - 1) / 2) * r * 0.2} cy={cy + r * 0.56} r={r * 0.065} />
        ))}
      </g>
      {port && (
        <text x={cx} y={cy - r * 0.6} textAnchor="middle" fontFamily={BODY_FONT} fontWeight={600} fontSize={r * 0.16} letterSpacing={r * 0.04} fill="#d6ac65">
          STEEL
        </text>
      )}
    </g>
  );
}

export function RoadPiece({ x1, y1, x2, y2, radius, color }: { x1: number; y1: number; x2: number; y2: number; radius: number; color: PlayerColor }) {
  const w = radius * 0.2;
  const hex = PLAYER_BY_ID[color].hex;
  // Shorten so pieces sit between number discs.
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const k = (radius * 0.34) / len;
  const ax = x1 + dx * k;
  const ay = y1 + dy * k;
  const bx = x2 - dx * k;
  const by = y2 - dy * k;
  return (
    <g strokeLinecap="butt">
      <line x1={ax} y1={ay + w * 0.25} x2={bx} y2={by + w * 0.25} stroke="#000" strokeOpacity="0.5" strokeWidth={w * 1.15} />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#8f8c84" strokeWidth={w} />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#6f6c66" strokeWidth={w} strokeDasharray={`${w * 0.35} ${w * 0.18}`} />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={hex} strokeWidth={w * 0.3} />
    </g>
  );
}

export function PipelinePiece({ x1, y1, x2, y2, radius, color }: { x1: number; y1: number; x2: number; y2: number; radius: number; color: PlayerColor }) {
  const w = radius * 0.15;
  const hex = PLAYER_BY_ID[color].hex;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const k = (radius * 0.34) / len;
  const ax = x1 + dx * k;
  const ay = y1 + dy * k;
  const bx = x2 - dx * k;
  const by = y2 - dy * k;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  return (
    <g strokeLinecap="round">
      <line x1={ax} y1={ay + w * 0.3} x2={bx} y2={by + w * 0.3} stroke="#000" strokeOpacity="0.5" strokeWidth={w * 1.2} />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#3c4246" strokeWidth={w} />
      <line x1={ax} y1={ay - w * 0.22} x2={bx} y2={by - w * 0.22} stroke="#7d868b" strokeWidth={w * 0.18} />
      {[ax, bx].map((x, i) => (
        <circle key={i} cx={x} cy={i ? by : ay} r={w * 0.72} fill="#b88d4c" stroke="#5c4320" strokeWidth={w * 0.12} />
      ))}
      <circle cx={mx} cy={my} r={w * 0.62} fill={hex} stroke="#f2e6cf" strokeWidth={w * 0.1} />
    </g>
  );
}

export function InspectorToken({ cx, cy, radius }: { cx: number; cy: number; radius: number }) {
  const r = radius * 0.3;
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.85} rx={r * 1.05} ry={r * 0.38} fill="#000" opacity="0.45" />
      <ellipse cx={cx} cy={cy + r * 0.62} rx={r} ry={r * 0.36} fill="#7d2a25" stroke="#d6ac65" strokeWidth={r * 0.08} />
      <rect x={cx - r * 0.34} y={cy - r * 0.75} width={r * 0.68} height={r * 1.35} rx={r * 0.18} fill="#23262a" />
      <circle cx={cx} cy={cy - r * 0.95} r={r * 0.25} fill="#c9a183" />
      <ellipse cx={cx} cy={cy - r * 1.12} rx={r * 0.42} ry={r * 0.09} fill="#111" />
      <path d={`M${cx - r * 0.24},${cy - r * 1.12} a${r * 0.24},${r * 0.24} 0 0 1 ${r * 0.48},0z`} fill="#111" />
      <rect x={cx + r * 0.32} y={cy - r * 0.05} width={r * 0.36} height={r * 0.28} rx={r * 0.04} fill="#6b3e22" />
    </g>
  );
}

export function OwnershipFlag({ cx, cy, radius, color }: { cx: number; cy: number; radius: number; color: PlayerColor }) {
  const r = radius * 0.11;
  const p = PLAYER_BY_ID[color];
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 1.5} rx={r * 1.2} ry={r * 0.45} fill="#a17a42" stroke="#5c4320" strokeWidth={r * 0.15} />
      <line x1={cx} y1={cy + r * 1.4} x2={cx} y2={cy - r * 2.2} stroke="#d6ac65" strokeWidth={r * 0.25} />
      <path d={`M${cx},${cy - r * 2.2} h${r * 2.2} l-${r * 0.6},${r * 0.8} l${r * 0.6},${r * 0.8} h-${r * 2.2}z`} fill={p.hex} stroke="#f2e6cf" strokeWidth={r * 0.12} />
      <PlayerSymbolShape symbol={p.symbol} cx={cx + r * 0.85} cy={cy - r * 1.4} r={r * 0.42} fill="none" strokeWidth={r * 0.14} />
    </g>
  );
}

export function OfficeBuilding({ cx, cy, radius, color }: { cx: number; cy: number; radius: number; color: PlayerColor }) {
  const r = radius * 0.12;
  const p = PLAYER_BY_ID[color];
  return (
    <g>
      <rect x={cx - r} y={cy - r * 0.7} width={r * 2} height={r * 1.9} fill="#cfc2a6" stroke="#4c4236" strokeWidth={r * 0.1} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((c) => <rect key={`${row}${c}`} x={cx - r * 0.7 + c * r * 0.55} y={cy - r * 0.45 + row * r * 0.5} width={r * 0.3} height={r * 0.3} fill="#3a2e22" />),
      )}
      <path d={`M${cx - r * 1.1},${cy - r * 0.7} h${r * 2.2} l-${r * 0.3},-${r * 0.35} h-${r * 1.6}z`} fill={p.hex} stroke="#2a1e15" strokeWidth={r * 0.08} />
      <rect x={cx - r * 0.5} y={cy - r * 1.35} width={r} height={r * 0.32} fill={p.hex} />
    </g>
  );
}
