import type { ReactNode } from 'react';
import { BODY_FONT, BoardDefs, DISPLAY_FONT, NumberDisc, printImages, type ImageResolver } from '../components/board/TileArt';
import { NUMBER_DISTRIBUTION, PORT_NUMBERS } from '../data/numbers';
import { STEEL_DECK_SIZE, steelDeckCards } from '../data/steel';
import { HIDDEN_BACK, TERRAIN } from '../data/terrain';
import { hexPath, SQRT3 } from '../map/geometry';

/** Prototype proposals only (see components data); printed sheets label them as such. */
export const PROTO = {
  hexFlat: 76,
  tokenDiameter: 28,
  card: { w: 63, h: 88 },
} as const;

export interface SheetOptions {
  imageFor?: ImageResolver;
  fontCss?: string;
  /** Fixed physical size (mm) on the root svg; preview mode uses 100% width. */
  physical?: boolean;
  /** Pixels per millimetre for standalone rasterization (overrides `physical`). */
  pxPerMm?: number;
}

function rootSize(opts: SheetOptions, w: number, h: number) {
  if (opts.pxPerMm) return { width: Math.round(w * opts.pxPerMm), height: Math.round(h * opts.pxPerMm) };
  if (opts.physical) return { width: `${w}mm`, height: `${h}mm` };
  return { width: '100%' };
}

const A4 = { w: 210, h: 297 };
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five'];

function A4Page({ title, note, children, opts, prefix }: { title: string; note: string; children: ReactNode; opts: SheetOptions; prefix: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${A4.w} ${A4.h}`}
      {...rootSize(opts, A4.w, A4.h)}
      role="img"
      aria-label={title}
      style={{ display: 'block', background: '#fff' }}
    >
      {opts.fontCss && <style>{opts.fontCss}</style>}
      <BoardDefs prefix={prefix} />
      <rect width={A4.w} height={A4.h} fill="#fff" />
      <text x={10} y={9} fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={4.2} fill="#2a2016">
        Tax the Richmen · {title}
      </text>
      <text x={A4.w - 10} y={9} textAnchor="end" fontFamily={BODY_FONT} fontSize={2.6} fill="#6b5d49">
        Print at 100% scale (no “fit to page”)
      </text>
      {children}
      <text x={10} y={A4.h - 6} fontFamily={BODY_FONT} fontSize={2.5} fill="#6b5d49">
        {note}
      </text>
    </svg>
  );
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/* ------------------------------------------------------------ Tile backs */

const HEX_R = PROTO.hexFlat / SQRT3;

function PrintHex({ cx, cy, href, prefix }: { cx: number; cy: number; href: string; prefix: string }) {
  return (
    <g>
      <path d={hexPath(cx, cy, HEX_R)} fill="#3a3d3c" />
      <image href={href} x={cx - HEX_R} y={cy - HEX_R} width={HEX_R * 2} height={HEX_R * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${prefix}-hex)`} />
      <path d={hexPath(cx, cy, HEX_R)} fill="none" stroke="#111" strokeWidth={0.25} />
    </g>
  );
}

export function tileBackPages(opts: SheetOptions = {}): ReactNode[] {
  const imageFor = opts.imageFor ?? printImages;
  const count = TERRAIN.mine.count + TERRAIN.mountain.count;
  const per = 6;
  const gap = 6;
  const w = HEX_R * 2;
  const h = PROTO.hexFlat;
  const x0 = (A4.w - (2 * w + gap)) / 2 + HEX_R;
  const y0 = 20 + h / 2;
  return chunk(
    Array.from({ length: count }, (_, i) => i),
    per,
  ).map((items, page, pages) => (
    <A4Page
      key={page}
      prefix={`tb${page}`}
      opts={opts}
      title={`Concealed tile backs (${page + 1}/${pages.length})`}
      note={`${count} identical backs for the Mine and Mountain tiles. Prototype proposal: ${PROTO.hexFlat} mm flat-to-flat hexes. Cut along the outline.`}
    >
      {items.map((_, i) => (
        <PrintHex key={i} prefix={`tb${page}`} cx={x0 + (i % 2) * (w + gap)} cy={y0 + Math.floor(i / 2) * (h + gap)} href={imageFor(HIDDEN_BACK.file)} />
      ))}
    </A4Page>
  ));
}

/* ------------------------------------------------------------ Number tokens */

export function numberTokenPages(opts: SheetOptions = {}): ReactNode[] {
  const values = Object.entries(NUMBER_DISTRIBUTION).flatMap(([n, c]) => Array.from({ length: c }, () => Number(n)));
  const tokens = [...values.map((v) => ({ v, port: false })), ...PORT_NUMBERS.map((v) => ({ v, port: true }))];
  const d = PROTO.tokenDiameter;
  const pitch = d + 4;
  const cols = 5;
  const x0 = (A4.w - (cols * pitch - 4)) / 2 + d / 2;
  const y0 = 22 + d / 2;
  /* NumberDisc draws its disc at radius × 0.27 (+6% brass ring). */
  const radius = d / 2 / 0.27 / 1.06;
  return [
    <A4Page
      key="tokens"
      prefix="nt"
      opts={opts}
      title="Number tokens"
      note={`${values.length} production tokens (no 7) and ${PORT_NUMBERS.length} dark Port tokens. Prototype proposal: ${d} mm discs. Cut along the outer circle.`}
    >
      {tokens.map((t, i) => {
        const cx = x0 + (i % cols) * pitch;
        const cy = y0 + Math.floor(i / cols) * pitch;
        return (
          <g key={i}>
            <NumberDisc prefix="nt" cx={cx} cy={cy} radius={radius} value={t.v} port={t.port} flat />
            <circle cx={cx} cy={cy} r={d / 2} fill="none" stroke="#111" strokeWidth={0.2} />
          </g>
        );
      })}
      <text x={10} y={y0 + 5 * pitch - 6} fontFamily={BODY_FONT} fontSize={3} fill="#2a2016">
        Production: {Object.entries(NUMBER_DISTRIBUTION)
          .map(([n, c]) => `${n}×${c}`)
          .join('  ')}
        {'   ·   '}Ports: {PORT_NUMBERS.join(', ')}
      </text>
    </A4Page>,
  ];
}

/* ------------------------------------------------------------ Steel cards */

/** Steel-mill silhouette: sheds, a gabled hall and chimneys, standing on a baseline, at most 9 mm tall. */
const MILL: [width: number, height: number][] = [
  [5, 3.5], [1.2, 8.5], [5, 4.5], [7, 6], [1.2, 9], [1, 2], [1.2, 7.5], [6, 4], [8, 5.5], [1.2, 8], [6.4, 3],
];
function skylinePath(x0: number, base: number, width: number): string {
  const total = MILL.reduce((a, [w]) => a + w, 0);
  const k = width / total;
  let d = `M${x0} ${base}`;
  let x = x0;
  for (const [w, h] of MILL) {
    d += ` V${base - h} H${x + w * k}`;
    x += w * k;
  }
  return `${d} V${base} Z`;
}

function SteelCardFace({ x, y, value }: { x: number; y: number; value: number }) {
  const { w, h } = PROTO.card;
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#efe4c8" />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke="#8a6a32" strokeWidth={0.6} />
      <rect x={x + 4.4} y={y + 4.4} width={w - 8.8} height={h - 8.8} fill="none" stroke="#8a6a32" strokeWidth={0.2} />
      <text x={cx} y={y + 14} textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={3.2} letterSpacing={0.5} fill="#3a2b1d">
        STEEL CERTIFICATE
      </text>
      <line x1={x + 12} x2={x + w - 12} y1={y + 16.5} y2={y + 16.5} stroke="#8a6a32" strokeWidth={0.25} />
      <circle cx={cx} cy={y + 38} r={14} fill="#1f2a2e" stroke="#b88d4c" strokeWidth={1.1} />
      <circle cx={cx} cy={y + 38} r={11.6} fill="none" stroke="#d6ac65" strokeOpacity={0.6} strokeWidth={0.3} />
      <text x={cx} y={y + 44} textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={17} fill="#e9c98a">
        {value}
      </text>
      <text x={cx} y={y + 60} textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={4.4} letterSpacing={0.5} fill="#2a2016">
        {WORDS[value].toUpperCase()} STEEL
      </text>
      <text x={cx} y={y + 65} textAnchor="middle" fontFamily={BODY_FONT} fontSize={2.4} fill="#5b4d3b">
        Take {value} Steel Coin{value > 1 ? 's' : ''}, then discard this card.
      </text>
      <path d={skylinePath(x + 9, y + 80, w - 22)} fill="#8a6a32" fillOpacity={0.55} />
      <line x1={x + 9} x2={x + w - 13} y1={y + 80.2} y2={y + 80.2} stroke="#8a6a32" strokeWidth={0.35} />
      <text x={x + 7} y={y + 10.5} fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={3.6} fill="#3a2b1d">
        {value}
      </text>
      <text x={x + w - 7} y={y + h - 7} textAnchor="end" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={3.6} fill="#3a2b1d">
        {value}
      </text>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#999" strokeWidth={0.15} />
    </g>
  );
}

function SteelCardBack({ x, y }: { x: number; y: number }) {
  const { w, h } = PROTO.card;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#1f3a33" />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke="#c49a55" strokeWidth={0.6} />
      <rect x={x + 4.4} y={y + 4.4} width={w - 8.8} height={h - 8.8} fill="none" stroke="#c49a55" strokeOpacity={0.5} strokeWidth={0.2} />
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos((i * Math.PI) / 4) * 20}
          y2={cy + Math.sin((i * Math.PI) / 4) * 20}
          stroke="#c49a55"
          strokeOpacity={0.35}
          strokeWidth={0.3}
        />
      ))}
      <circle cx={cx} cy={cy} r={15} fill="#1f3a33" stroke="#c49a55" strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={12.5} fill="none" stroke="#c49a55" strokeOpacity={0.6} strokeWidth={0.25} />
      <text x={cx} y={cy - 1} textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={4.2} letterSpacing={0.4} fill="#e9c98a">
        TAX THE
      </text>
      <text x={cx} y={cy + 4.5} textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={4.2} letterSpacing={0.4} fill="#e9c98a">
        RICHMEN
      </text>
      <text x={cx} y={y + h - 9} textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={600} fontSize={2.8} letterSpacing={0.8} fill="#c49a55">
        STEEL
      </text>
    </g>
  );
}

export function steelCardPages(opts: SheetOptions = {}): ReactNode[] {
  const { w, h } = PROTO.card;
  const cols = 3;
  const x0 = (A4.w - cols * w) / 2;
  const y0 = 16;
  const at = (i: number) => ({ x: x0 + (i % cols) * w, y: y0 + Math.floor(i / cols) * h });
  const note = `Prototype proposal: ${w} × ${h} mm cards. Cut along the grey lines.`;
  const faces = chunk(steelDeckCards(), 9).map((cards, page, pages) => (
    <A4Page key={`f${page}`} prefix={`sc${page}`} opts={opts} title={`Steel Cards — faces (${page + 1}/${pages.length})`} note={`${STEEL_DECK_SIZE}-card deck. ${note}`}>
      {cards.map((v, i) => (
        <SteelCardFace key={i} {...at(i)} value={v} />
      ))}
    </A4Page>
  ));
  const backs = (
    <A4Page key="backs" prefix="scb" opts={opts} title="Steel Cards — backs" note={`Print once per face sheet on the reverse (flip on the long edge) or glue to the faces. ${note}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <SteelCardBack key={i} {...at(i)} />
      ))}
    </A4Page>
  );
  return [...faces, backs];
}
