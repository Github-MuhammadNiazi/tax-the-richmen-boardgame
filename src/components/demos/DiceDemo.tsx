import { Dices } from 'lucide-react';
import { useMemo, useState } from 'react';
import { diceProbability, dicePips } from '../../data/numbers';
import { TERRAIN, type TerrainType } from '../../data/terrain';
import { generateClassic } from '../../map/classic';

const DEMO_SEED = 'BRASS-0001';
const FACES = [1, 2, 3, 4, 5, 6];

function Die({ value }: { value: number }) {
  const spots: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  return (
    <svg viewBox="0 0 60 60" className="h-14 w-14" aria-hidden>
      <rect x="3" y="5" width="54" height="54" rx="10" fill="#000" opacity="0.4" />
      <rect x="3" y="2" width="54" height="54" rx="10" fill="#efe6d2" stroke="#8a6634" strokeWidth="2" />
      {spots[value].map(([x, y], i) => (
        <circle key={i} cx={15 + x * 15} cy={14 + y * 15} r="4.6" fill={value === 1 ? '#9b2f28' : '#1d1a16'} />
      ))}
    </svg>
  );
}

/** Two-dice probability chart linked to the Classic board's real number placement. */
export function DiceDemo() {
  const map = useMemo(() => generateClassic(DEMO_SEED), []);
  const [selected, setSelected] = useState(8);
  const [dice, setDice] = useState<[number, number] | null>(null);

  const producers = useMemo(() => {
    const out: Partial<Record<TerrainType | 'concealed', number>> = {};
    for (const t of map.tiles) {
      if (t.number !== selected) continue;
      const key = TERRAIN[t.terrain].concealed ? 'concealed' : t.terrain;
      out[key] = (out[key] ?? 0) + 1;
    }
    return out;
  }, [map, selected]);

  const roll = () => {
    const a = FACES[Math.floor(Math.random() * 6)];
    const b = FACES[Math.floor(Math.random() * 6)];
    setDice([a, b]);
    setSelected(a + b);
  };

  const sums = Array.from({ length: 11 }, (_, i) => i + 2);
  const pct = (n: number) => `${(diceProbability(n) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-primary btn-sm" onClick={roll}>
          <Dices aria-hidden size={16} /> Roll two dice
        </button>
        {dice && (
          <div className="flex items-center gap-2" aria-hidden>
            <Die value={dice[0]} />
            <Die value={dice[1]} />
          </div>
        )}
      </div>

      <div role="radiogroup" aria-label="Choose a dice total" className="grid grid-cols-11 items-end gap-1.5" style={{ height: 150 }}>
        {sums.map((n) => {
          const isSel = n === selected;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={isSel}
              aria-label={`${n}: ${dicePips(n)} of 36 combinations, ${pct(n)}`}
              onClick={() => setSelected(n)}
              className="group flex h-full flex-col items-center justify-end gap-1.5"
            >
              <span
                className={`w-full rounded-t-sm border transition-colors ${
                  n === 7
                    ? isSel
                      ? 'border-ember-light bg-ember'
                      : 'border-ember/50 bg-ember/40 group-hover:bg-ember/60'
                    : isSel
                      ? 'border-brass-light bg-brass'
                      : 'border-rivet bg-steel-2 group-hover:bg-steel'
                }`}
                style={{ height: `${(dicePips(n) / 6) * 100}%` }}
              />
              <span className={`text-xs tabular-nums ${isSel ? 'font-semibold text-ivory' : 'text-muted'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="plate-flat p-4" aria-live="polite">
        <p className="font-display text-lg text-ivory">
          {dice ? `Rolled ${dice[0]} + ${dice[1]} = ${selected}` : `Total ${selected}`}
          <span className="ml-3 text-sm font-normal text-muted">
            {dicePips(selected)}/36 · {pct(selected)}
          </span>
        </p>
        {selected === 7 ? (
          <p className="mt-2 text-sm leading-relaxed text-ember-light">
            Nothing produces. The Tax Inspector resolves taxation, Steel tax, relocation and theft.
          </p>
        ) : Object.keys(producers).length ? (
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {Object.entries(producers).map(([k, count]) => (
              <li key={k} className="chip">
                {count}× {k === 'concealed' ? 'concealed Mine/Mountain' : TERRAIN[k as TerrainType].label}
                {k === 'port' && ' (Steel Card if activated)'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No tile carries {selected}; the roll produces nothing.</p>
        )}
        <p className="mt-3 text-xs text-dim">Production shown for the Classic board, seed {DEMO_SEED}.</p>
      </div>
    </div>
  );
}
