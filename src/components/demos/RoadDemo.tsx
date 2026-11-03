import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { COSTS, addCosts, type Cost } from '../../data/costs';
import { TERRAIN } from '../../data/terrain';
import { RoadPiece } from '../board/TileArt';
import { CostBadges } from '../ui/CostBadges';
import { MiniBoard, miniEdges, miniLayout, type MiniCell } from './MiniBoard';

const CELLS: MiniCell[] = [
  { id: 'city', col: 0, row: 0, terrain: 'city', variant: 0, number: 9 },
  { id: 'v1', col: 0, row: 1, terrain: 'village', variant: 1, number: 4 },
  { id: 'w1', col: 0, row: 2, terrain: 'water', variant: 0 },
  { id: 'mtn', col: 1, row: 0, terrain: 'mountain', variant: 0, number: 10 },
  { id: 'w2', col: 1, row: 1, terrain: 'water', variant: 2 },
  { id: 'mine', col: 1, row: 2, terrain: 'mine', variant: 1, number: 5 },
  { id: 'v2', col: 2, row: 0, terrain: 'village', variant: 2, number: 8 },
  { id: 'tax', col: 2, row: 1, terrain: 'tax', variant: 0 },
  { id: 'v3', col: 2, row: 2, terrain: 'village', variant: 3, number: 11 },
  { id: 'port', col: 3, row: 0, terrain: 'port', variant: 1, number: 6 },
  { id: 'oil', col: 3, row: 1, terrain: 'oil', variant: 0, number: 3 },
];

const BY_ID = Object.fromEntries(CELLS.map((c) => [c.id, c]));
const EDGES = miniEdges(CELLS);
const OPEN_EDGES = EDGES.filter(([a, b]) => TERRAIN[BY_ID[a].terrain].accessible && TERRAIN[BY_ID[b].terrain].accessible);
const LAYOUT = miniLayout(CELLS, 64);
const key = (a: string, b: string) => [a, b].sort().join('|');
const NAMES: Record<string, string> = { city: 'your City', port: 'your Port', v1: 'the western Village', v2: 'the northern Village', v3: 'the southern Village' };
const name = (id: string) => NAMES[id] ?? `the ${TERRAIN[BY_ID[id].terrain].label}`;

function connected(roads: Set<string>, from: string, to: string): boolean {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) return true;
    for (const [a, b] of EDGES) {
      if (!roads.has(key(a, b))) continue;
      const next = a === cur ? b : b === cur ? a : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

export function RoadDemo() {
  const [roads, setRoads] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('Select a connection point between two hexes to build a Road.');

  const explainHex = (cell: MiniCell) =>
    setMessage(
      TERRAIN[cell.terrain].accessible
        ? 'Roads run between hexes — select a brass connection point on an edge.'
        : `Not allowed: ${TERRAIN[cell.terrain].label === 'Water' ? 'Water' : 'the Tax Office'} can never be entered by a Road, so it has no connection points.`,
    );

  const toggle = (a: string, b: string) => {
    const A = BY_ID[a];
    const B = BY_ID[b];
    const k = key(a, b);
    const removing = roads.has(k);
    const mountain = A.terrain === 'mountain' || B.terrain === 'mountain';
    setRoads((prev) => {
      const next = new Set(prev);
      if (removing) next.delete(k);
      else next.add(k);
      return next;
    });
    setMessage(
      removing
        ? `Removed the Road between ${name(a)} and ${name(b)}.`
        : `Built a Road between ${name(a)} and ${name(b)}${mountain ? ' — Mountain surcharge applies' : ''}.`,
    );
  };

  const { total, mountainRoads } = useMemo(() => {
    let cost: Cost = {};
    let mountain = 0;
    for (const [a, b] of EDGES) {
      if (!roads.has(key(a, b))) continue;
      cost = addCosts(cost, COSTS.road);
      if (BY_ID[a].terrain === 'mountain' || BY_ID[b].terrain === 'mountain') {
        cost = addCosts(cost, COSTS.roadMountainSurcharge);
        mountain++;
      }
    }
    return { total: cost, mountainRoads: mountain };
  }, [roads]);

  const linked = connected(roads, 'city', 'port');
  const R = LAYOUT.radius;

  return (
    <div className="space-y-4">
      <MiniBoard
        cells={CELLS}
        layout={LAYOUT}
        label="Road building practice board"
        onCellClick={explainHex}
        cellLabel={(c) => `${name(c.id).replace(/^the /, '')}${TERRAIN[c.terrain].accessible ? '' : ' — Roads cannot enter'}`}
        overlay={
          <g>
            {EDGES.map(([a, b]) => {
              const k = key(a, b);
              const p = LAYOUT.center[a];
              const q = LAYOUT.center[b];
              return roads.has(k) ? <RoadPiece key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} radius={R} color="red" /> : null;
            })}
            {OPEN_EDGES.map(([a, b]) => {
              const k = key(a, b);
              const p = LAYOUT.center[a];
              const q = LAYOUT.center[b];
              const mx = (p.x + q.x) / 2;
              const my = (p.y + q.y) / 2;
              const built = roads.has(k);
              return (
                <g
                  key={`h-${k}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={built}
                  aria-label={`${built ? 'Remove' : 'Build'} Road between ${name(a)} and ${name(b)}`}
                  className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-ivory"
                  onClick={() => toggle(a, b)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(a, b);
                    }
                  }}
                >
                  <circle cx={mx} cy={my} r={R * 0.16} fill={built ? 'transparent' : '#1d2427'} stroke="#d6ac65" strokeWidth={R * 0.035} strokeOpacity={built ? 0 : 1} />
                  {!built && <path d={`M${mx - R * 0.07},${my}h${R * 0.14}M${mx},${my - R * 0.07}v${R * 0.14}`} stroke="#f0d49c" strokeWidth={R * 0.035} />}
                </g>
              );
            })}
            {(['city', 'port'] as const).map((id) => (
              <text key={id} x={LAYOUT.center[id].x} y={LAYOUT.center[id].y - R * 0.5} textAnchor="middle" fontSize={R * 0.17} fontWeight={600} fill="#f2e6cf" stroke="#0b0f10" strokeWidth={R * 0.05} paintOrder="stroke" letterSpacing={R * 0.02}>
                {id === 'city' ? 'YOUR CITY' : 'YOUR PORT'}
              </text>
            ))}
          </g>
        }
      />

      <p className="text-sm text-muted" aria-live="polite">
        {message}
      </p>

      <div className="grid gap-3 @md:grid-cols-2">
        <div className="plate-flat p-4">
          <p className="label">Construction cost</p>
          <div className="mt-2 min-h-7">{roads.size ? <CostBadges cost={total} /> : <span className="text-sm text-dim">No Roads yet</span>}</div>
          <p className="mt-2 text-xs text-dim">
            {roads.size} Road{roads.size === 1 ? '' : 's'} · {mountainRoads} with a Mountain endpoint · at least {Math.ceil(roads.size / 2)} turn
            {Math.ceil(roads.size / 2) === 1 ? '' : 's'} of actions
          </p>
        </div>
        <div className={`plate-flat p-4 ${linked ? 'border-verdigris/70' : ''}`}>
          <p className="label">City-to-Port network</p>
          <p className={`mt-2 font-display text-lg ${linked ? 'text-verdigris' : 'text-muted'}`}>{linked ? 'Connected — Port activated' : 'Not yet connected'}</p>
          <button type="button" className="btn btn-ghost btn-sm mt-2 -ml-2" onClick={() => (setRoads(new Set()), setMessage('Board cleared.'))}>
            <RotateCcw aria-hidden size={14} /> Clear Roads
          </button>
        </div>
      </div>
    </div>
  );
}
