import { ArrowLeftRight, Eye, EyeOff, Hash, Lock, LockOpen, RefreshCw, Wrench } from 'lucide-react';
import { NUMBER_DISTRIBUTION, PORT_NUMBERS } from '../../data/numbers';
import { TERRAIN, TERRAIN_LIST, TERRAIN_TYPES, type TerrainType } from '../../data/terrain';
import { countTerrain } from '../../map/analysis';
import { useMapStore } from '../../store/mapStore';

const ALL_NUMBERS = [3, 4, 5, 6, 8, 9, 10, 11];

function useCounts() {
  const tiles = useMapStore((s) => s.map.tiles);
  const terrain = countTerrain(tiles);
  const numbers: Record<number, number> = {};
  const portNumbers: Record<number, number> = {};
  for (const t of tiles) {
    if (t.number == null) continue;
    if (t.terrain === 'port') portNumbers[t.number] = (portNumbers[t.number] ?? 0) + 1;
    else numbers[t.number] = (numbers[t.number] ?? 0) + 1;
  }
  return { terrain, numbers, portNumbers };
}

export function EditorPanel() {
  const map = useMapStore((s) => s.map);
  const selected = useMapStore((s) => s.selected);
  const swapMode = useMapStore((s) => s.swapMode);
  const revealAll = useMapStore((s) => s.revealAll);
  const actions = useMapStore.getState();
  const tile = selected != null ? map.tiles.find((t) => t.slot === selected) : undefined;
  const counts = useCounts();
  const lockedCount = map.tiles.filter((t) => t.locked).length;
  const concealedTiles = map.tiles.filter((t) => TERRAIN[t.terrain].concealed);
  const allRevealed = concealedTiles.length > 0 && concealedTiles.every((t) => t.revealed);

  const startSwap = (mode: 'tile' | 'number') => {
    actions.setSwapMode(mode);
    if (selected != null) useMapStore.setState({ swapSource: selected });
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="sel-title" className="plate-flat p-4">
        <h3 id="sel-title" className="label">
          Selected hex
        </h3>
        {!tile ? (
          <p className="text-sm text-muted">Select a hex on the board (click, tap, or press Enter on a focused hex) to edit it.</p>
        ) : (
          <div className="space-y-4">
            <p className="font-display text-lg text-ivory">
              Hex {tile.slot + 1} · {TERRAIN[tile.terrain].label}
              {tile.locked && <span className="ml-2 align-middle text-xs font-sans uppercase tracking-wider text-brass">Locked</span>}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ed-terrain" className="label">
                  Terrain
                </label>
                <select id="ed-terrain" className="field" value={tile.terrain} disabled={tile.locked} onChange={(e) => actions.setTerrain(tile.slot, e.target.value as TerrainType)}>
                  {TERRAIN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TERRAIN[t].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ed-variant" className="label">
                  Artwork
                </label>
                <select id="ed-variant" className="field" value={tile.variant % TERRAIN[tile.terrain].variants.length} disabled={tile.locked} onChange={(e) => actions.setVariant(tile.slot, Number(e.target.value))}>
                  {TERRAIN[tile.terrain].variants.map((v, i) => (
                    <option key={v.id} value={i}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label htmlFor="ed-number" className="label">
                  Number token
                </label>
                <select
                  id="ed-number"
                  className="field"
                  value={tile.number ?? ''}
                  disabled={tile.locked || (!TERRAIN[tile.terrain].numbered && tile.terrain !== 'port')}
                  onChange={(e) => actions.setNumber(tile.slot, e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">No number</option>
                  {(tile.terrain === 'port' ? [...PORT_NUMBERS] : ALL_NUMBERS).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {!TERRAIN[tile.terrain].numbered && tile.terrain !== 'port' && <p className="mt-1 text-xs text-dim">{TERRAIN[tile.terrain].label} never carries a number.</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost btn-sm" aria-pressed={tile.locked} onClick={() => actions.toggleLock(tile.slot)}>
                {tile.locked ? <LockOpen size={14} aria-hidden /> : <Lock size={14} aria-hidden />}
                {tile.locked ? 'Unlock' : 'Lock'}
              </button>
              {TERRAIN[tile.terrain].concealed && (
                <button type="button" className="btn btn-ghost btn-sm" aria-pressed={tile.revealed} onClick={() => actions.toggleReveal(tile.slot)} disabled={revealAll}>
                  {tile.revealed ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
                  {tile.revealed ? 'Hide' : 'Reveal'}
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-sm" aria-pressed={swapMode === 'tile'} disabled={tile.locked} onClick={() => startSwap('tile')}>
                <ArrowLeftRight size={14} aria-hidden /> Swap tile
              </button>
              <button type="button" className="btn btn-ghost btn-sm" aria-pressed={swapMode === 'number'} disabled={tile.locked} onClick={() => startSwap('number')}>
                <Hash size={14} aria-hidden /> Swap number
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="board-tools" className="plate-flat space-y-3 p-4">
        <h3 id="board-tools" className="label">
          Whole board
        </h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.setAllLocks(lockedCount < map.tiles.length)}>
            {lockedCount < map.tiles.length ? <Lock size={14} aria-hidden /> : <LockOpen size={14} aria-hidden />}
            {lockedCount < map.tiles.length ? 'Lock all' : 'Unlock all'}
          </button>
          {lockedCount > 0 && lockedCount < map.tiles.length && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.setAllLocks(false)}>
              <LockOpen size={14} aria-hidden /> Unlock all
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.setAllRevealed(!allRevealed)}>
            {allRevealed ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
            {allRevealed ? 'Hide concealed tiles' : 'Reveal concealed tiles'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.regenerateUnlocked()} title="Generate a balanced board that keeps every locked tile in place">
            <RefreshCw size={14} aria-hidden /> Regenerate unlocked
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.repairCounts()} title="Convert surplus terrain on unlocked hexes into missing terrain and re-deal numbers">
            <Wrench size={14} aria-hidden /> Repair counts
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.repairNumbers()} title="Re-deal number tokens on unlocked hexes">
            <Hash size={14} aria-hidden /> Re-deal numbers
          </button>
        </div>
        <p className="text-xs text-dim">
          {lockedCount} of {map.tiles.length} hexes locked. Locked hexes are kept by regenerate, repair, swap and drag.
        </p>
      </section>

      <section aria-labelledby="count-title" className="plate-flat p-4">
        <h3 id="count-title" className="label">
          Component counts
        </h3>
        <table className="w-full text-sm">
          <caption className="sr-only">Terrain counts on this board compared with the required counts</caption>
          <thead>
            <tr className="text-left text-xs text-dim">
              <th scope="col" className="pb-1 font-normal">Terrain</th>
              <th scope="col" className="pb-1 text-right font-normal">Board</th>
              <th scope="col" className="pb-1 text-right font-normal">Required</th>
            </tr>
          </thead>
          <tbody>
            {TERRAIN_LIST.map((t) => {
              const n = counts.terrain[t.id];
              const off = n !== t.count;
              return (
                <tr key={t.id} className="border-t border-rivet/50">
                  <th scope="row" className="py-1.5 text-left font-normal text-parchment">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: t.base, outline: `1px solid ${t.accent}` }} aria-hidden />
                    {t.plural}
                  </th>
                  <td className={`py-1.5 text-right tabular-nums ${off ? 'font-semibold text-ember-light' : 'text-ivory'}`}>{n}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted">{t.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-dim">Number tokens on producing hexes (board / required)</p>
        <ul className="mt-2 grid grid-cols-4 gap-1.5 text-xs">
          {Object.entries(NUMBER_DISTRIBUTION).map(([n, req]) => {
            const have = counts.numbers[Number(n)] ?? 0;
            return (
              <li key={n} className={`rounded-sm border px-2 py-1 text-center tabular-nums ${have === req ? 'border-rivet text-parchment' : 'border-ember/60 text-ember-light'}`}>
                <span className="font-display text-sm">{n}</span> · {have}/{req}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-dim">
          Port numbers: {PORT_NUMBERS.map((n) => `${n}×${counts.portNumbers[n] ?? 0}`).join(', ')} (each required once)
        </p>
      </section>
    </div>
  );
}
