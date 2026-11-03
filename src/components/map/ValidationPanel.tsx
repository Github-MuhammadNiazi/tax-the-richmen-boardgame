import { AlertTriangle, CheckCircle2, ChevronDown, Crosshair, XCircle } from 'lucide-react';
import { dicePips } from '../../data/numbers';
import { TERRAIN, type TerrainType } from '../../data/terrain';
import { SCORE_LABELS, SCORE_WEIGHTS, type Check, type MapAnalysis, type ScoreBreakdown } from '../../map/analysis';
import { NUMBERED_TERRAIN } from '../../map/numbering';
import type { GenerationReport, MapTile } from '../../map/types';

function grade(score: number, errors: number) {
  if (errors) return { label: 'Invalid', tone: 'text-ember-light' };
  if (score >= 90) return { label: 'Excellent', tone: 'text-verdigris' };
  if (score >= 75) return { label: 'Good', tone: 'text-brass-light' };
  if (score >= 60) return { label: 'Fair', tone: 'text-[#e0a43c]' };
  return { label: 'Weak', tone: 'text-ember-light' };
}

const ICON = {
  error: <XCircle size={16} className="shrink-0 text-ember-light" aria-hidden />,
  warning: <AlertTriangle size={16} className="shrink-0 text-[#e0a43c]" aria-hidden />,
  pass: <CheckCircle2 size={16} className="shrink-0 text-verdigris" aria-hidden />,
};

function CheckRow({ check, focused, onFocus }: { check: Check; focused: boolean; onFocus: (id: string | null) => void }) {
  const hasSlots = !!check.slots?.length;
  return (
    <li className={`rounded-md border p-3 ${focused ? 'border-brass bg-brass/10' : 'border-rivet bg-coal/50'}`} data-check={check.id} data-severity={check.severity}>
      <div className="flex items-start gap-2.5">
        {ICON[check.severity]}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ivory">{check.label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{check.detail}</p>
          {hasSlots && (
            <p className="mt-1 text-xs text-dim">
              Hex {check.slots!.slice(0, 12).map((s) => s + 1).join(', ')}
              {check.slots!.length > 12 ? '…' : ''}
            </p>
          )}
        </div>
        {hasSlots && (
          <button type="button" className="btn btn-ghost btn-sm shrink-0 px-2" aria-pressed={focused} aria-label={`${focused ? 'Stop showing' : 'Show'} ${check.label} on the board`} onClick={() => onFocus(focused ? null : check.id)}>
            <Crosshair size={14} aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

export function ScoreSummary({ analysis }: { analysis: MapAnalysis }) {
  const g = grade(analysis.score, analysis.errors.length);
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center">
        <svg viewBox="0 0 80 80" className="absolute inset-0" aria-hidden>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#2b3437" strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={analysis.errors.length ? '#d0574e' : '#d6ac65'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(analysis.score / 100) * 213.6} 213.6`}
            transform="rotate(-90 40 40)"
          />
        </svg>
        <span className="font-display text-2xl text-ivory" data-testid="map-score">
          {analysis.score}
        </span>
      </div>
      <div>
        <p className={`font-display text-xl ${g.tone}`}>{g.label}</p>
        <p className="text-xs text-muted">
          {analysis.errors.length} error{analysis.errors.length === 1 ? '' : 's'} · {analysis.warnings.length} warning{analysis.warnings.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}

function DiceChart({ tiles }: { tiles: MapTile[] }) {
  const sums = Array.from({ length: 11 }, (_, i) => i + 2);
  const byNumber = new Map<number, MapTile[]>();
  for (const t of tiles) if (t.number != null) byNumber.set(t.number, [...(byNumber.get(t.number) ?? []), t]);
  return (
    <div>
      <div className="grid grid-cols-11 items-end gap-1" style={{ height: 120 }} aria-hidden>
        {sums.map((n) => (
          <div key={n} className="flex h-full flex-col justify-end gap-0.5">
            {(byNumber.get(n) ?? []).map((t) => (
              <span key={t.slot} className="h-2 rounded-[1px]" style={{ background: TERRAIN[t.terrain].accent }} title={`Hex ${t.slot + 1}`} />
            ))}
            <span className={`rounded-t-sm ${n === 7 ? 'bg-ember/60' : 'bg-steel-2'}`} style={{ height: `${(dicePips(n) / 6) * 55}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-11 gap-1 text-center text-[0.65rem] tabular-nums text-muted" aria-hidden>
        {sums.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      {/* Tables ignore sr-only's 1px width, so the wrapper does the clipping. */}
      <div className="sr-only">
        <table>
          <caption>Hexes per dice total</caption>
          <tbody>
            {sums.map((n) => (
              <tr key={n}>
                <th scope="row">{n}</th>
                <td>
                  {dicePips(n)} of 36; {(byNumber.get(n) ?? []).map((t) => `hex ${t.slot + 1} ${TERRAIN[t.terrain].label}`).join(', ') || 'no hexes'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-dim">Grey bars show how often each total rolls; coloured blocks are the hexes that produce on it.</p>
    </div>
  );
}

export function ValidationPanel({
  analysis,
  tiles,
  report,
  focusCheck,
  onFocusCheck,
}: {
  analysis: MapAnalysis;
  tiles: MapTile[];
  report: GenerationReport | null;
  focusCheck: string | null;
  onFocusCheck: (id: string | null) => void;
}) {
  const passed = analysis.checks.filter((c) => c.severity === 'pass');
  return (
    <div className="space-y-6">
      <section aria-labelledby="score-title" className="plate-flat space-y-4 p-4">
        <h3 id="score-title" className="label">
          Balance score
        </h3>
        <ScoreSummary analysis={analysis} />
        <ul className="space-y-2">
          {(Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[]).map((k) => (
            <li key={k}>
              <div className="flex justify-between text-xs">
                <span className="text-parchment">
                  {SCORE_LABELS[k]} <span className="text-dim">· weight {Math.round(SCORE_WEIGHTS[k] * 100)}%</span>
                </span>
                <span className="tabular-nums text-ivory">{Math.round(analysis.breakdown[k])}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-rivet">
                <div className="h-full rounded-full bg-gradient-to-r from-brass-dark to-brass-light" style={{ width: `${analysis.breakdown[k]}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-dim">
          A transparent heuristic: each factor is scored 0–100 and weighted as shown. Any hard error caps the score at 40. It estimates fairness; it does not replace playtesting.
        </p>
        {report && (
          <p className="border-t border-rivet pt-3 text-xs text-muted">
            Generator evaluated {report.candidatesTried} candidates ({report.candidatesValid} valid), keeping the best at {report.bestScore}.
            {report.fallback && <span className="text-ember-light"> No candidate passed every hard check; the closest one is shown.</span>}
          </p>
        )}
      </section>

      {analysis.errors.length > 0 && (
        <section aria-labelledby="errors-title">
          <h3 id="errors-title" className="label text-ember-light">
            Hard errors · must be fixed
          </h3>
          <ul className="space-y-2">
            {analysis.errors.map((c) => (
              <CheckRow key={c.id} check={c} focused={focusCheck === c.id} onFocus={onFocusCheck} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="warnings-title">
        <h3 id="warnings-title" className="label">
          Soft warnings · balance advice
        </h3>
        {analysis.warnings.length ? (
          <ul className="space-y-2">
            {analysis.warnings.map((c) => (
              <CheckRow key={c.id} check={c} focused={focusCheck === c.id} onFocus={onFocusCheck} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No balance warnings.</p>
        )}
      </section>

      <details className="group">
        <summary className="label flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          Passed checks ({passed.length})
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="mt-2 space-y-2">
          {passed.map((c) => (
            <CheckRow key={c.id} check={c} focused={focusCheck === c.id} onFocus={onFocusCheck} />
          ))}
        </ul>
      </details>

      <section aria-labelledby="dice-title" className="plate-flat p-4">
        <h3 id="dice-title" className="label">
          Dice probability
        </h3>
        <DiceChart tiles={tiles} />
        <table className="mt-4 w-full text-xs">
          <caption className="sr-only">Expected production per category</caption>
          <thead>
            <tr className="text-left text-dim">
              <th scope="col" className="pb-1 font-normal">Category</th>
              <th scope="col" className="pb-1 text-right font-normal">Rolls / 36</th>
              <th scope="col" className="pb-1 text-right font-normal">High · Low</th>
            </tr>
          </thead>
          <tbody>
            {NUMBERED_TERRAIN.map((cat) => {
              const p = analysis.categoryPips[cat];
              const ok = p && p.high === 2 && p.low === 2;
              return (
                <tr key={cat} className="border-t border-rivet/50">
                  <th scope="row" className="py-1.5 text-left font-normal text-parchment">
                    {TERRAIN[cat as TerrainType].plural}
                  </th>
                  <td className="py-1.5 text-right tabular-nums text-ivory">{p?.pips ?? 0}</td>
                  <td className={`py-1.5 text-right tabular-nums ${ok ? 'text-muted' : 'text-ember-light'}`}>
                    {p?.high ?? 0} · {p?.low ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
