import { useState } from 'react';
import { LIMITS } from '../../data/costs';
import { PLAYER_BY_ID, type PlayerColor } from '../../data/players';
import { RESOURCES, RESOURCE_TYPES, type ResourceType } from '../../data/resources';
import { TERRAIN } from '../../data/terrain';
import { InspectorToken, OfficeBuilding, OwnershipFlag } from '../board/TileArt';
import { MiniBoard, miniLayout, type MiniCell } from './MiniBoard';

interface DemoCell extends MiniCell {
  owner?: PlayerColor;
  offices?: PlayerColor[];
  lessee?: PlayerColor;
}

const CELLS: DemoCell[] = [
  { id: 'c1', col: 0, row: 0, terrain: 'city', variant: 1, number: 8, owner: 'red', offices: ['blue'] },
  { id: 'v1', col: 0, row: 1, terrain: 'village', variant: 0, number: 4 },
  { id: 'w1', col: 0, row: 2, terrain: 'water', variant: 1 },
  { id: 'h1', col: 1, row: 0, terrain: 'mine', variant: 0, number: 9, concealed: true },
  { id: 'o1', col: 1, row: 1, terrain: 'oil', variant: 2, number: 6, lessee: 'green' },
  { id: 'tx', col: 1, row: 2, terrain: 'tax', variant: 0 },
  { id: 'p1', col: 2, row: 0, terrain: 'port', variant: 0, number: 5, owner: 'blue' },
  { id: 'm1', col: 2, row: 1, terrain: 'mountain', variant: 2, number: 3, owner: 'gold' },
  { id: 'v2', col: 2, row: 2, terrain: 'village', variant: 2, number: 10, owner: 'green', offices: ['red'] },
  { id: 'w2', col: 3, row: 0, terrain: 'water', variant: 3 },
  { id: 'mn', col: 3, row: 1, terrain: 'mine', variant: 3, number: 11, owner: 'red' },
];
const LAYOUT = miniLayout(CELLS, 62);

const HANDS: Record<PlayerColor, Record<ResourceType, number>> = {
  red: { money: 2, wood: 1, metal: 3, fuel: 0, stone: 1 },
  blue: { money: 4, wood: 0, metal: 1, fuel: 2, stone: 0 },
  green: { money: 1, wood: 3, metal: 0, fuel: 1, stone: 2 },
  gold: { money: 0, wood: 2, metal: 2, fuel: 0, stone: 0 },
};

function ineligibleReason(cell: DemoCell, current: string): string | null {
  if (cell.id === current) return 'The Inspector must move to a different hex on every 7.';
  if (cell.terrain === 'water') return 'Water is never an eligible destination.';
  if (cell.terrain === 'tax') return 'The Tax Office can never be targeted.';
  if (cell.concealed) return 'Unrevealed Mine/Mountain tiles cannot receive the Inspector.';
  return null;
}

function effectsFor(cell: DemoCell): string[] {
  const base = ['No new Roads into or out of this hex.', 'No new Office or property purchase here.', 'Existing Roads stay usable.'];
  if (cell.terrain === 'oil') return [...base, 'All Fuel production on this Rig — lease and Pipeline — is suspended. The lease is not cancelled.'];
  if (cell.terrain === 'port') return [...base, 'No Steel Cards, specialized Market trading or Market Steel purchase at this Port.'];
  return base;
}

export function InspectorDemo() {
  const [at, setAt] = useState('v1');
  const [msg, setMsg] = useState('A 7 was rolled. Select a hex to relocate the Tax Inspector.');
  const [stolen, setStolen] = useState<string | null>(null);
  const [ordinary, setOrdinary] = useState(11);
  const [steel, setSteel] = useState(8);
  const [vault, setVault] = useState(false);

  const current = CELLS.find((c) => c.id === at)!;
  const victims = [current.owner, ...(current.offices ?? [])].filter((p): p is PlayerColor => !!p);

  const move = (cell: MiniCell) => {
    const c = cell as DemoCell;
    const reason = ineligibleReason(c, at);
    if (reason) return setMsg(`Not allowed: ${reason}`);
    setAt(c.id);
    setStolen(null);
    setMsg(`The Inspector moves to the ${TERRAIN[c.terrain].label}.`);
  };

  const steal = (p: PlayerColor) => {
    const pool = RESOURCE_TYPES.flatMap((r) => Array.from({ length: HANDS[p][r] }, () => r));
    const r = pool[Math.floor(Math.random() * pool.length)];
    setStolen(`Took 1 random ${RESOURCES[r].label} from ${PLAYER_BY_ID[p].label}. Steel can never be stolen.`);
  };

  const taxLoss = ordinary >= LIMITS.taxThreshold ? Math.floor(ordinary / 2) : 0;
  const steelTaxed = (LIMITS.steelTaxRange as readonly number[]).includes(steel);
  const steelLoss = steelTaxed && !vault ? LIMITS.steelTaxLoss : 0;
  const R = LAYOUT.radius;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 @md:grid-cols-2">
        <div className="plate-flat p-4">
          <p className="label">Step 1 · Ordinary taxation</p>
          <label htmlFor="tax-ord" className="mt-2 block text-sm text-parchment">
            Ordinary resources held: <span className="font-semibold tabular-nums text-ivory">{ordinary}</span>
          </label>
          <input id="tax-ord" type="range" min={0} max={24} value={ordinary} onChange={(e) => setOrdinary(Number(e.target.value))} className="mt-2 w-full accent-[#d6ac65]" />
          <p className={`mt-1 text-sm ${taxLoss ? 'text-ember-light' : 'text-verdigris'}`} aria-live="polite">
            {taxLoss ? `Surrender ${taxLoss} (half, rounded down) → ${ordinary - taxLoss} left.` : `Below ${LIMITS.taxThreshold}: no tax.`}
          </p>
        </div>
        <div className="plate-flat p-4">
          <p className="label">Step 2 · Steel taxation</p>
          <label htmlFor="tax-steel" className="mt-2 block text-sm text-parchment">
            Steel held: <span className="font-semibold tabular-nums text-ivory">{steel}</span>
          </label>
          <input id="tax-steel" type="range" min={0} max={9} value={steel} onChange={(e) => setSteel(Number(e.target.value))} className="mt-2 w-full accent-[#d6ac65]" />
          <label className="mt-1 flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={vault} onChange={(e) => setVault(e.target.checked)} className="accent-[#d6ac65]" /> Active Steel Vault
          </label>
          <p className={`mt-1 text-sm ${steelLoss ? 'text-ember-light' : 'text-verdigris'}`} aria-live="polite">
            {steelLoss ? `Lose ${steelLoss} Steel → ${steel - steelLoss}.` : steelTaxed ? 'The Vault absorbs this Steel-tax event, then expires.' : 'Only 8 or 9 Steel is taxed.'}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-5 @3xl:grid-cols-[1.25fr_1fr]">
        <MiniBoard
          cells={CELLS}
          layout={LAYOUT}
          label="Tax Inspector relocation board"
          onCellClick={move}
          cellLabel={(c) => {
            const reason = ineligibleReason(c as DemoCell, at);
            return `${c.concealed ? 'Concealed tile' : TERRAIN[c.terrain].label}${c.id === at ? ' (Inspector here)' : ''}${reason ? ' — not eligible' : ' — eligible'}`;
          }}
          tone={(c) => (c.id === at ? 'active' : ineligibleReason(c as DemoCell, at) ? 'blocked' : 'eligible')}
          overlay={
            <g pointerEvents="none">
              {CELLS.map((c) => {
                const p = LAYOUT.center[c.id];
                return (
                  <g key={c.id}>
                    {c.owner && <OwnershipFlag cx={p.x - R * 0.55} cy={p.y + R * 0.05} radius={R} color={c.owner} />}
                    {c.offices?.map((o) => <OfficeBuilding key={o} cx={p.x + R * 0.56} cy={p.y + R * 0.1} radius={R} color={o} />)}
                    {c.lessee && <OwnershipFlag cx={p.x - R * 0.55} cy={p.y + R * 0.05} radius={R * 0.8} color={c.lessee} />}
                  </g>
                );
              })}
              <InspectorToken cx={LAYOUT.center[at].x} cy={LAYOUT.center[at].y - R * 0.05} radius={R} />
            </g>
          }
        />
        <div className="space-y-3" aria-live="polite">
          <p className="label">Step 3 · Relocation</p>
          <p className="text-sm text-parchment">{msg}</p>
          <ul className="space-y-1 text-sm text-muted">
            {effectsFor(current).map((e) => (
              <li key={e} className="flex gap-2"><span aria-hidden className="text-brass">—</span>{e}</li>
            ))}
          </ul>
          <p className="label pt-2">Step 4 · Theft</p>
          {victims.length ? (
            <div className="flex flex-wrap gap-2">
              {victims.map((v, i) => (
                <button key={v} type="button" className="btn btn-ghost btn-sm" onClick={() => steal(v)}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLAYER_BY_ID[v].hex }} aria-hidden />
                  Steal from {PLAYER_BY_ID[v].label} ({i === 0 && current.owner ? 'owner' : 'Office'})
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No owner or Office holder on this hex{current.lessee ? ' (a lessee is neither)' : ''}, so there is no one to select.
            </p>
          )}
          {stolen && <p className="text-sm text-ember-light">{stolen}</p>}
        </div>
      </div>
    </div>
  );
}
