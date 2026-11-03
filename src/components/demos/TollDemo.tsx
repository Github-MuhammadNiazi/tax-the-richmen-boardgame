import { Check, Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { COSTS, LIMITS, formatCost } from '../../data/costs';
import { PLAYER_BY_ID } from '../../data/players';

type Segment = 'own' | 'rival' | 'empty';
type Choice = 'none' | 'toll' | 'build';

const SCENARIOS: { id: string; name: string; segments: Segment[] }[] = [
  { id: 'a', name: 'Two rival Roads, apart', segments: ['own', 'rival', 'empty', 'rival', 'empty'] },
  { id: 'b', name: 'Two rival Roads in a row', segments: ['own', 'rival', 'rival', 'empty', 'own'] },
  { id: 'c', name: 'Three rival Roads', segments: ['rival', 'empty', 'rival', 'empty', 'rival'] },
];

const STOPS = ['City', 'Village', 'Mine', 'Village', 'Mountain', 'Port'];

export function TollDemo() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [choices, setChoices] = useState<Choice[]>(() => SCENARIOS[0].segments.map(() => 'none'));
  const [paidRoads, setPaidRoads] = useState(1);

  const pick = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id)!;
    setScenario(s);
    setChoices(s.segments.map(() => 'none'));
  };

  const toggle = (i: number) => {
    const seg = scenario.segments[i];
    if (seg === 'own') return;
    setChoices((c) => c.map((v, j) => (j === i ? (v === 'none' ? (seg === 'rival' ? 'toll' : 'build') : 'none') : v)));
  };

  const tolls = choices.filter((c) => c === 'toll').length;
  const builtHere = choices.filter((c) => c === 'build').length;
  const paidTotal = paidRoads + builtHere;
  const allowance = paidTotal >= LIMITS.tollThirdUnlockPaidRoads ? LIMITS.tollMaxLifetime : LIMITS.tollBaseAllowance;
  const usable = scenario.segments.map((s, i) => s === 'own' || choices[i] !== 'none');
  const consecutive = choices.some((c, i) => c === 'toll' && choices[i + 1] === 'toll');
  const complete = usable.every(Boolean);

  const problems: string[] = [];
  if (consecutive) problems.push('Two consecutive toll Roads need an intervening Road you built yourself.');
  if (tolls > allowance)
    problems.push(
      allowance < LIMITS.tollMaxLifetime
        ? `Toll allowance is ${allowance}. A third purchase unlocks after ${LIMITS.tollThirdUnlockPaidRoads} paid road segments.`
        : `Lifetime maximum is ${LIMITS.tollMaxLifetime} toll purchases.`,
    );
  const valid = complete && problems.length === 0;

  const red = PLAYER_BY_ID.red.hex;
  const blue = PLAYER_BY_ID.blue.hex;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Toll scenario" className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={scenario.id === s.id} className="btn btn-ghost btn-sm" onClick={() => pick(s.id)}>
            {s.name}
          </button>
        ))}
      </div>

      <ol className="flex flex-wrap items-stretch gap-y-3" aria-label="Route from your City to your Port">
        {STOPS.map((stop, i) => (
          <li key={i} className="flex items-center">
            <span className="rounded-sm border border-rivet bg-coal px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-parchment">{stop}</span>
            {i < scenario.segments.length && (
              <button
                type="button"
                onClick={() => toggle(i)}
                disabled={scenario.segments[i] === 'own'}
                aria-label={
                  scenario.segments[i] === 'own'
                    ? `Segment ${i + 1}: your Road`
                    : scenario.segments[i] === 'rival'
                      ? `Segment ${i + 1}: Blue's Road — ${choices[i] === 'toll' ? 'toll purchased, select to cancel' : 'select to buy toll access'}`
                      : `Segment ${i + 1}: empty — ${choices[i] === 'build' ? 'Road built, select to remove' : 'select to build your own Road'}`
                }
                className="group relative mx-1 flex h-9 w-16 items-center justify-center disabled:cursor-default sm:w-20"
              >
                <span
                  className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-[2px]"
                  style={{
                    background:
                      scenario.segments[i] === 'empty'
                        ? choices[i] === 'build'
                          ? red
                          : 'repeating-linear-gradient(90deg,#4a4f50 0 6px,transparent 6px 10px)'
                        : scenario.segments[i] === 'own'
                          ? red
                          : blue,
                    boxShadow: choices[i] === 'toll' ? `0 0 0 2px #d6ac65` : undefined,
                  }}
                />
                {scenario.segments[i] !== 'own' && (
                  <span className="relative grid h-6 w-6 place-items-center rounded-full border border-brass bg-ink text-brass-light group-hover:bg-coal">
                    {choices[i] === 'none' ? <Plus size={13} aria-hidden /> : <Minus size={13} aria-hidden />}
                  </span>
                )}
                {choices[i] === 'toll' && (
                  <span className="absolute -bottom-4 text-[0.62rem] font-semibold uppercase tracking-wider text-brass-light">toll</span>
                )}
              </button>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-sm" style={{ background: red }} /> Your Roads (Red)</span>
        <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-sm" style={{ background: blue }} /> Blue&apos;s Roads</span>
        <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-sm" style={{ background: 'repeating-linear-gradient(90deg,#4a4f50 0 4px,transparent 4px 7px)' }} /> No Road yet</span>
      </div>

      <div className="grid gap-3 @md:grid-cols-2">
        <div className="plate-flat p-4">
          <label htmlFor="paid-roads" className="label">Paid road segments built earlier</label>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" className="btn btn-ghost btn-sm" aria-label="Fewer paid Roads" onClick={() => setPaidRoads((n) => Math.max(0, n - 1))}>
              <Minus size={14} aria-hidden />
            </button>
            <output id="paid-roads" className="w-8 text-center font-display text-xl text-ivory">{paidRoads}</output>
            <button type="button" className="btn btn-ghost btn-sm" aria-label="More paid Roads" onClick={() => setPaidRoads((n) => Math.min(8, n + 1))}>
              <Plus size={14} aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-xs text-dim">
            Total paid segments {paidTotal} · toll allowance {allowance} · tolls on this route {tolls} ({formatCost(COSTS.toll)} each)
          </p>
        </div>
        <div className={`plate-flat p-4 ${valid ? 'border-verdigris/70' : problems.length ? 'border-ember/60' : ''}`} aria-live="polite">
          <p className="label">Route status</p>
          <p className={`mt-2 flex items-center gap-2 font-display text-lg ${valid ? 'text-verdigris' : problems.length ? 'text-ember-light' : 'text-muted'}`}>
            {valid ? <Check size={18} aria-hidden /> : problems.length ? <X size={18} aria-hidden /> : null}
            {valid ? 'Valid City-to-Port network' : problems.length ? 'Route not permitted' : 'Route incomplete'}
          </p>
          <ul className="mt-1 space-y-1 text-sm text-muted">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
            {!complete && !problems.length && <li>Buy toll access on Blue&apos;s Roads and build on the gaps.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
