import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { BoardArt } from '../components/board/BoardArt';
import { DiceDemo } from '../components/demos/DiceDemo';
import { InspectorDemo } from '../components/demos/InspectorDemo';
import { MarketDemo } from '../components/demos/MarketDemo';
import { RoadDemo } from '../components/demos/RoadDemo';
import { SteelDemo } from '../components/demos/SteelDemo';
import { TollDemo } from '../components/demos/TollDemo';
import { ClarificationNote } from '../components/ui/Clarification';
import { CostBadges } from '../components/ui/CostBadges';
import { PlayerSymbolShape } from '../components/ui/PlayerSymbol';
import { ResourceIcon } from '../components/ui/ResourceIcon';
import { RichText } from '../components/ui/RichText';
import { LIMITS } from '../data/costs';
import { HIGH_NUMBERS, NUMBER_DISTRIBUTION, PORT_NUMBERS, diceProbability } from '../data/numbers';
import { PLAYERS } from '../data/players';
import { RESOURCES, RESOURCE_TYPES, STARTING_RESOURCES, STARTING_RESOURCE_TOTAL } from '../data/resources';
import { findRule, ruleHref, type Clarification } from '../data/rules';
import { PORT_SPECIALIZATIONS } from '../data/terrain';
import { usePageMeta } from '../lib/usePageMeta';
import { generateClassic } from '../map/classic';

interface Step {
  id: string;
  title: string;
  lede: string;
  rules: string[];
  demoTitle?: string;
  demo: () => ReactNode;
}

function BoardStep() {
  const map = useMemo(() => generateClassic('BRASS-0001'), []);
  const [reveal, setReveal] = useState(false);
  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm mb-3" aria-pressed={reveal} onClick={() => setReveal((r) => !r)}>
        {reveal ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
        {reveal ? 'Hide concealed tiles' : 'Reveal concealed tiles'}
      </button>
      <BoardArt tiles={map.tiles} prefix="htp-board" revealAll={reveal} title="Classic board layout" />
      <p className="mt-2 text-xs text-dim">Classic layout, seed BRASS-0001. Columns of 3, 4, 5, 6, 5, 4 and 3 hexes.</p>
    </div>
  );
}

function NumbersStep() {
  const max = Math.max(...Object.values(NUMBER_DISTRIBUTION));
  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-8 items-end gap-2" style={{ height: 160 }} aria-label="Number token counts">
        {Object.entries(NUMBER_DISTRIBUTION).map(([n, count]) => {
          const high = (HIGH_NUMBERS as readonly number[]).includes(Number(n));
          return (
            <li key={n} className="flex h-full flex-col items-center justify-end gap-1.5" aria-label={`${count} tokens of ${n}`}>
              <span className="text-xs tabular-nums text-muted">×{count}</span>
              <span className={`w-full rounded-t-sm border ${high ? 'border-brass-light bg-brass/80' : 'border-rivet bg-steel-2'}`} style={{ height: `${(count / max) * 70}%` }} />
              <span className={`font-display text-sm ${Number(n) === 6 || Number(n) === 8 ? 'text-ember-light' : 'text-ivory'}`}>{n}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brass/80" /> High: {HIGH_NUMBERS.join(', ')}</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-steel-2" /> Low: 3, 4, 10, 11</span>
      </div>
      <div className="plate-flat p-4 text-sm text-parchment">
        <p>
          Ports always carry <strong className="text-ivory">{PORT_NUMBERS.join(', ')}</strong> — one each — and produce Steel Cards rather than resources.
        </p>
        <p className="mt-2 text-muted">
          A 6 or 8 rolls {(diceProbability(6) * 100).toFixed(1)}% of the time; a 3 or 11 only {(diceProbability(3) * 100).toFixed(1)}%. No tile carries a 7.
        </p>
      </div>
    </div>
  );
}

function SetupStep() {
  const order = PLAYERS.map((p, i) => ({ ...p, seat: i + 1 }));
  const Row = ({ label, seats, note }: { label: string; seats: typeof order; note: string }) => (
    <div className="plate-flat p-4">
      <p className="label">{label}</p>
      <ol className="mt-3 flex flex-wrap items-center gap-2">
        {seats.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-sm border border-rivet bg-coal px-2.5 py-1.5 text-sm text-ivory">
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <PlayerSymbolShape symbol={p.symbol} cx={10} cy={10} r={7} fill={p.hex} strokeWidth={1.5} />
              </svg>
              {p.label}
            </span>
            {i < seats.length - 1 && <ArrowRight size={14} className="text-dim" aria-hidden />}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">{note}</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <Row label="First pass · clockwise" seats={order} note="Claim a City or a Port, then place one free road segment." />
      <Row label="Second pass · reversed" seats={[...order].reverse()} note="Claim your remaining location, then place one more free road segment." />
      <p className="text-xs text-dim">Seat order shown for illustration; it follows the starting-order roll.</p>
    </div>
  );
}

function ResourcesStep() {
  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-5 gap-2" aria-label="Starting resources">
        {RESOURCE_TYPES.map((r) => (
          <li key={r} className="plate-flat flex flex-col items-center gap-1 py-4">
            <ResourceIcon type={r} size={26} />
            <span className="font-display text-2xl text-ivory">{STARTING_RESOURCES[r]}</span>
            <span className="text-[0.65rem] uppercase tracking-wider text-muted">{RESOURCES[r].label}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-parchment">
        {STARTING_RESOURCE_TOTAL} ordinary resources — already above the {LIMITS.taxThreshold}-resource tax threshold from the very first roll.
      </p>
      <div className="plate-flat p-4">
        <p className="label">Port specializations · one each, permanent</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PORT_SPECIALIZATIONS.map((s) => (
            <li key={s} className="chip">
              <ResourceIcon type={s} size={14} /> {RESOURCES[s].label} Market
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TurnStep() {
  const r = findRule('actions')!.item;
  return (
    <div className="space-y-4">
      <ol className="grid gap-2 sm:grid-cols-5">
        {['Roll', 'Resolve', 'Trade', `${LIMITS.actionsPerTurn} actions`, 'End'].map((s, i) => (
          <li key={s} className="plate-flat px-3 py-3 text-center">
            <span className="block font-display text-xs text-brass">{String(i + 1).padStart(2, '0')}</span>
            <span className="mt-1 block text-sm font-semibold text-ivory">{s}</span>
          </li>
        ))}
      </ol>
      <div className="plate-flat max-h-80 overflow-y-auto p-1 scrollbar-thin">
        <table className="w-full text-sm">
          <caption className="sr-only">Action costs</caption>
          <tbody>
            {r.costs!.map((c) => (
              <tr key={c.label} className="border-b border-rivet/60 last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-normal text-parchment">{c.label}</th>
                <td className="px-3 py-2 text-right"><CostBadges cost={c.cost} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvestStep() {
  const inv = findRule('investment')!.item;
  const sharing = findRule('office-sharing')!.item;
  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-2">
        {inv.costs!.map((c) => (
          <li key={c.label} className="plate-flat flex items-center justify-between gap-2 p-3">
            <span className="font-display text-sm text-ivory">{c.label}</span>
            <CostBadges cost={c.cost} size="sm" />
          </li>
        ))}
      </ul>
      <div className="plate-flat flex items-center justify-between gap-2 p-3">
        <span className="font-display text-sm text-ivory">Office</span>
        <CostBadges cost="office" size="sm" />
      </div>
      <div className="parchment rounded-md p-4 text-sm text-[#2b2219]">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7a5a2c]">Worked example · Office sharing</p>
        <p className="mt-2 leading-relaxed">{sharing.example}</p>
      </div>
    </div>
  );
}

function OilStep() {
  const cycle = PLAYERS.map((p) => p.label);
  return (
    <div className="space-y-4">
      <div className="plate-flat p-4">
        <p className="label">One lease = one complete cycle</p>
        <ol className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
          {[...cycle, cycle[0]].map((name, i) => (
            <li key={i} className={`rounded-sm border px-1 py-2 ${i === 0 ? 'border-brass bg-brass/15 text-brass-light' : i === 4 ? 'border-ember/60 text-ember-light' : 'border-rivet text-parchment'}`}>
              <span className="block font-semibold">{name}</span>
              <span className="text-dim">{i === 0 ? 'leases' : i === 4 ? 'expires' : 'Fuel on roll'}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">Red leases on its turn; the lease ends when Red&apos;s next turn begins.</p>
      </div>
      <div className="plate-flat p-4">
        <p className="label">Advance bidding on an occupied Rig</p>
        <ul className="mt-3 space-y-2 text-sm text-parchment">
          <li className="flex items-center justify-between gap-2">Blue opens <CostBadges cost={{ money: 2, action: 1 }} size="sm" /></li>
          <li className="flex items-center justify-between gap-2">Green raises <CostBadges cost={{ money: 3, action: 1 }} size="sm" /></li>
          <li className="text-muted">Blue&apos;s 2 Money is not refunded. When Red&apos;s lease expires, Green leases at the start of Green&apos;s next turn.</li>
        </ul>
      </div>
      <div className="plate-flat flex items-center justify-between gap-2 p-3">
        <span className="font-display text-sm text-ivory">Pipeline segment</span>
        <CostBadges cost="pipeline" size="sm" />
      </div>
    </div>
  );
}

function VictoryStep() {
  return (
    <figure className="overflow-hidden rounded-md border border-rivet">
      <img src="/assets/components/comp-winning-ship.webp" alt="Sculpted cargo ship miniature on a walnut table" className="aspect-[16/10] w-full object-cover" />
      <figcaption className="grid grid-cols-3 divide-x divide-rivet border-t border-rivet bg-coal text-center text-xs">
        {['Connect City to Port', 'Draw Steel Cards', `Hold ${LIMITS.steelToWin} Steel`].map((s, i) => (
          <span key={s} className="px-2 py-3 text-parchment">
            <span className="block font-display text-brass">{['I', 'II', 'III'][i]}</span>
            {s}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export const STEPS: Step[] = [
  { id: 'goal', title: 'The goal', lede: 'Every rival races to the same finish: a working City-to-Port network and ten Steel in the vault.', rules: ['objective', 'victory'], demo: () => <VictoryStep /> },
  { id: 'board', title: 'Read the board', lede: 'Thirty hexes in seven columns. Eight of them — the Mines and Mountains — begin face-down.', rules: ['board'], demoTitle: 'The Classic layout', demo: () => <BoardStep /> },
  { id: 'numbers', title: 'Number tokens', lede: 'Each producing hex carries a number. When the dice match it, that hex produces.', rules: ['numbers'], demo: () => <NumbersStep /> },
  { id: 'setup', title: 'Claim your City and Port', lede: 'Two setup passes — clockwise, then reversed — give every player one City, one Port and two free road segments.', rules: ['starting-order', 'setup-passes'], demo: () => <SetupStep /> },
  { id: 'resources', title: 'Specialize and stock up', lede: 'Roll for a permanent Port specialization, then take the standard starting hand.', rules: ['port-specialization', 'starting-resources', 'regular-order'], demo: () => <ResourcesStep /> },
  { id: 'turn', title: 'Your turn', lede: 'Roll, resolve, trade — then spend up to two actions. Every action has a fixed cost.', rules: ['turn-sequence', 'actions', 'unused-actions'], demo: () => <TurnStep /> },
  { id: 'production', title: 'Roll and produce', lede: 'Production happens on every player’s roll, not just your own. Choose a total to see what it pays.', rules: ['production', 'upgrade', 'storage'], demoTitle: 'Dice probability', demo: () => <DiceDemo /> },
  { id: 'trading', title: 'Trade at the bank and the Market', lede: 'Trade freely with the bank at 4:1, once per turn at your Market at 2:1, and buy Steel once your network is complete.', rules: ['bank-trading', 'player-trading', 'market-trading', 'steel-purchase'], demoTitle: 'Market exchange', demo: () => <MarketDemo /> },
  { id: 'roads', title: 'Build Roads', lede: 'Roads join the centres of adjacent hexes. Connect your City to your Port to activate it.', rules: ['road-building', 'owner-priority'], demoTitle: 'Road connection', demo: () => <RoadDemo /> },
  { id: 'tolls', title: 'Pay the toll', lede: 'Buy permanent access to a rival’s Road — but never two in a row, and never more than your allowance.', rules: ['toll-access'], demoTitle: 'Toll access', demo: () => <TollDemo /> },
  { id: 'invest', title: 'Invest and open Offices', lede: 'Own one property of each type. Plant Offices on rivals’ properties to share their surplus.', rules: ['investment', 'offices', 'office-sharing'], demo: () => <InvestStep /> },
  { id: 'oil', title: 'Lease, bid and pipe Oil', lede: 'Oil Rigs are never owned. Lease them for a cycle, bid for the next lease, or tap them permanently with a Pipeline.', rules: ['standard-lease', 'advance-bidding', 'pipeline-building', 'pipeline-production'], demo: () => <OilStep /> },
  { id: 'inspector', title: 'Survive the Tax Inspector', lede: 'A 7 produces nothing. Instead: taxation, Steel tax, relocation and theft — in that order.', rules: ['seven-steps', 'eligible-hexes', 'inspector-effects'], demoTitle: 'Inspector relocation', demo: () => <InspectorDemo /> },
  { id: 'steel', title: 'Draw Steel and launch', lede: 'An activated Port draws a Steel Card each time its number is rolled. Ten Steel wins instantly.', rules: ['activation', 'steel-production', 'steel-deck', 'steel-vault', 'victory'], demoTitle: 'Steel Card conversion', demo: () => <SteelDemo /> },
];

function stepFromParam(v: string | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= STEPS.length ? n - 1 : 0;
}

export default function HowToPlayPage() {
  usePageMeta('How to Play', 'Learn Tax the Richmen in fourteen illustrated steps with interactive demos of dice, Roads, tolls, Markets, the Tax Inspector and Steel.');
  const [params, setParams] = useSearchParams();
  const index = stepFromParam(params.get('step'));
  const step = STEPS[index];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    setParams(next === 0 ? {} : { step: String(next + 1) }, { replace: false });
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    const top = document.getElementById('htp-stage')?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 96 });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof Element && e.target.closest('input, select, textarea, [role="radiogroup"], svg')) return;
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rules = step.rules.map((id) => findRule(id)).filter((r): r is NonNullable<typeof r> => !!r);
  const clarifications = Array.from(new Map(rules.flatMap((r) => r.item.clarifications ?? []).map((c) => [c.id, c] as [string, Clarification])).values());

  return (
    <div className="container-page pb-24 pt-12 md:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3"><span aria-hidden className="h-px w-8 bg-brass-dark" />How to play</p>
        <h1 className="display-lg text-ivory">Learn the game in fourteen steps.</h1>
        <p className="lede mt-5">Each step pairs the approved rules with a working demonstration. Use the arrow keys or the controls below to move between steps.</p>
      </header>

      <div className="mt-10" aria-label="Progress">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
          <span>
            Step <span className="text-ivory">{String(index + 1).padStart(2, '0')}</span> of {STEPS.length}
          </span>
          <span className="hidden sm:inline">{step.title}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-rivet" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label={`Step ${index + 1} of ${STEPS.length}`}>
          <div className="h-full bg-gradient-to-r from-brass-dark to-brass-light transition-[width] duration-500" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr] xl:gap-12">
        <nav aria-label="Steps" className="lg:sticky lg:top-24 lg:self-start">
          <label htmlFor="step-select" className="sr-only">Jump to step</label>
          <select id="step-select" className="field lg:hidden" value={index} onChange={(e) => go(Number(e.target.value))}>
            {STEPS.map((s, i) => (
              <option key={s.id} value={i}>{`${i + 1}. ${s.title}`}</option>
            ))}
          </select>
          <ol className="hidden space-y-0.5 lg:block">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  className={`flex w-full items-baseline gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                    i === index ? 'bg-steel text-ivory' : i < index ? 'text-parchment hover:bg-coal' : 'text-muted hover:bg-coal hover:text-parchment'
                  }`}
                >
                  <span className={`font-display text-xs tabular-nums ${i === index ? 'text-brass-light' : 'text-dim'}`}>{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section id="htp-stage" aria-labelledby="step-title" className="min-w-0">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0">
              <p className="font-display text-sm text-brass">Step {String(index + 1).padStart(2, '0')}</p>
              <h2 id="step-title" ref={headingRef} tabIndex={-1} className="display-md mt-2 text-ivory outline-none">
                {step.title}
              </h2>
              <p className="lede mt-4">{step.lede}</p>
              <ul className="mt-6 space-y-4">
                {rules.map(({ item }) => (
                  <li key={item.id} className="border-l-2 border-brass-dark/70 pl-4">
                    <p className="font-semibold text-ivory">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-parchment">{item.summary}</p>
                    {item.bullets && item.bullets.length <= 6 && (
                      <ul className="mt-2 space-y-1 text-sm text-muted">
                        {item.bullets.map((b) => (
                          <li key={b} className="flex gap-2"><span aria-hidden className="text-brass-dark">·</span><span>{b}</span></li>
                        ))}
                      </ul>
                    )}
                    {item.body && item.body.length <= 2 && (
                      <div className="mt-2 space-y-1.5 text-sm text-muted">
                        {item.body.map((b) => (
                          <p key={b}><RichText text={b} /></p>
                        ))}
                      </div>
                    )}
                    <Link to={ruleHref(item.id)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brass hover:text-brass-light">
                      <BookOpen size={12} aria-hidden /> Full rule
                    </Link>
                  </li>
                ))}
              </ul>
              {clarifications.length > 0 && (
                <div className="mt-6 space-y-3">
                  {clarifications.map((c) => (
                    <ClarificationNote key={c.id} item={c} compact />
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="plate @container p-4 sm:p-6">
                {step.demoTitle && <p className="label mb-4">Interactive · {step.demoTitle}</p>}
                <div key={step.id}>{step.demo()}</div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-rivet pt-6">
            <button type="button" className="btn btn-secondary" onClick={() => go(index - 1)} disabled={index === 0}>
              <ArrowLeft size={16} aria-hidden /> Previous
            </button>
            {index < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => go(index + 1)}>
                Next<span className="hidden sm:inline">: {STEPS[index + 1].title}</span> <ArrowRight size={16} aria-hidden />
              </button>
            ) : (
              <Link to="/map-generator" className="btn btn-primary">
                Generate a map <ArrowRight size={16} aria-hidden />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
