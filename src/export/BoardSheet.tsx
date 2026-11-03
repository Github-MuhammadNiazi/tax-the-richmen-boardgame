import { BoardArt, boardSize } from '../components/board/BoardArt';
import { BODY_FONT, DISPLAY_FONT, printImages, type ImageResolver } from '../components/board/TileArt';
import { NUMBER_DISTRIBUTION } from '../data/numbers';
import { TERRAIN, TERRAIN_LIST } from '../data/terrain';
import { countTerrain } from '../map/analysis';
import type { BoardMap } from '../map/types';

const MODE_LABEL = { classic: 'Classic layout', balanced: 'Balanced random', custom: 'Custom layout' } as const;

const BOARD = boardSize(100, 24);
const MARGIN = 56;
const LEGEND = 400;
export const SHEET_WIDTH = MARGIN * 2 + BOARD.width + LEGEND;
export const SHEET_HEIGHT = MARGIN * 2 + BOARD.height;

export interface BoardSheetProps {
  map: BoardMap;
  imageFor?: ImageResolver;
  revealAll?: boolean;
  showNumbers?: boolean;
  fontCss?: string;
  /** Fixed pixel size for standalone files; omitted for responsive print/preview. */
  standalone?: boolean;
}

/** A complete board plate: walnut surround, the 30-hex board and a legend cartouche. Used for SVG, PNG, PDF and print. */
export function BoardSheet({ map, imageFor = printImages, revealAll = false, showNumbers = true, fontCss, standalone = false }: BoardSheetProps) {
  const counts = countTerrain(map.tiles);
  const concealed = map.tiles.filter((t) => TERRAIN[t.terrain].concealed && !t.revealed && !revealAll).length;
  const lx = MARGIN * 1.5 + BOARD.width;
  const W = SHEET_WIDTH;
  const H = SHEET_HEIGHT;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      {...(standalone ? { width: W, height: H } : { width: '100%' })}
      role="img"
      aria-label={`${map.name} — printable board`}
      style={{ display: 'block' }}
    >
      {fontCss && <style>{fontCss}</style>}
      <defs>
        <linearGradient id="sheet-walnut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2b21" />
          <stop offset="1" stopColor="#21180f" />
        </linearGradient>
        <pattern id="sheet-grain" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(2)">
          <rect width="2" height="9" fill="#000" opacity="0.08" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#sheet-walnut)" />
      <rect width={W} height={H} fill="url(#sheet-grain)" />
      <rect x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke="#b88d4c" strokeOpacity="0.6" strokeWidth={2} />
      <rect x={22} y={22} width={W - 44} height={H - 44} fill="none" stroke="#b88d4c" strokeOpacity="0.3" strokeWidth={1} />

      <g transform={`translate(${MARGIN} ${MARGIN})`}>
        <BoardArt tiles={map.tiles} prefix="sheet" revealAll={revealAll} showNumbers={showNumbers} imageFor={imageFor} asGroup />
      </g>

      <g transform={`translate(${lx} ${MARGIN + 10})`} fontFamily={BODY_FONT}>
        <rect x={-20} y={-10} width={LEGEND - 30} height={BOARD.height - 20} rx={6} fill="#151b1d" fillOpacity="0.82" stroke="#b88d4c" strokeOpacity="0.45" />
        <text x={0} y={28} fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={16} letterSpacing={4} fill="#d6ac65">
          TAX THE RICHMEN
        </text>
        <text x={0} y={70} fontFamily={DISPLAY_FONT} fontWeight={700} fontSize={map.name.length > 22 ? 22 : 28} fill="#f2e6cf">
          {map.name.slice(0, 34)}
        </text>
        <text x={0} y={100} fontSize={14} fill="#b7ada0">
          {MODE_LABEL[map.mode]} · Seed {map.seed}
        </text>
        <line x1={0} x2={LEGEND - 70} y1={124} y2={124} stroke="#b88d4c" strokeOpacity="0.5" />
        <text x={0} y={156} fontSize={11} fontWeight={600} letterSpacing={2.5} fill="#8f877c">
          TERRAIN
        </text>
        {TERRAIN_LIST.map((t, i) => (
          <g key={t.id} transform={`translate(0 ${176 + i * 30})`}>
            <rect width={18} height={18} rx={3} fill={t.base} stroke={t.accent} />
            <text x={30} y={14} fontSize={15} fill="#f2e6cf">
              {t.plural}
            </text>
            <text x={LEGEND - 70} y={14} fontSize={15} textAnchor="end" fill={counts[t.id] === t.count ? '#b7ada0' : '#e0a43c'}>
              ×{counts[t.id]}
            </text>
          </g>
        ))}
        <line x1={0} x2={LEGEND - 70} y1={430} y2={430} stroke="#b88d4c" strokeOpacity="0.5" />
        <text x={0} y={462} fontSize={11} fontWeight={600} letterSpacing={2.5} fill="#8f877c">
          NUMBER TOKENS
        </text>
        <text x={0} y={490} fontSize={14} fill="#f2e6cf">
          {Object.entries(NUMBER_DISTRIBUTION)
            .map(([n, c]) => `${n}×${c}`)
            .join('  ')}
        </text>
        <text x={0} y={516} fontSize={14} fill="#b7ada0">
          Ports: 5, 6, 8, 9 · No 7 on the board
        </text>
        {concealed > 0 && (
          <text x={0} y={560} fontSize={14} fill="#b7ada0">
            {concealed} concealed Mine/Mountain tile{concealed === 1 ? '' : 's'} shown face-down.
          </text>
        )}
        <text x={0} y={BOARD.height - 50} fontSize={11} fill="#8f877c">
          Prototype board sheet · generated in the browser
        </text>
      </g>
    </svg>
  );
}
