import { ArrowRight, Check, Compass, Hammer, Landmark, Ship, Shuffle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BoardArt } from '../components/board/BoardArt';
import { CostBadges } from '../components/ui/CostBadges';
import { HexImage, Reveal, SectionHeading } from '../components/ui/Section';
import { COMPONENTS, thumb } from '../data/components';
import { COSTS, LIMITS, formatCost } from '../data/costs';
import { diceProbability } from '../data/numbers';
import { TERRAIN_LIST, terrainImage } from '../data/terrain';
import { usePageMeta } from '../lib/usePageMeta';
import { analyzeMap } from '../map/analysis';
import { generateClassic } from '../map/classic';
import { generateBalanced } from '../map/generator';

const PILLARS = [
  {
    key: 'BUILD',
    icon: Hammer,
    text: 'Construct Roads and Pipelines.',
    detail: `Every Road costs ${formatCost(COSTS.road, { includeAction: false })}. Pipelines tap Oil Rigs permanently.`,
    image: '/assets/components/comp-road-sm.webp',
    alt: 'Sculpted cobblestone road pieces with player-coloured stripes',
  },
  {
    key: 'INVEST',
    icon: Landmark,
    text: 'Acquire properties and improve production.',
    detail: 'Buy a City, Village, Mine or Mountain, then Upgrade one property to double its output.',
    image: '/assets/components/comp-ownership-marker-sm.webp',
    alt: 'Brass ownership flag markers in four player colours',
  },
  {
    key: 'COMPETE',
    icon: Compass,
    text: 'Trade, bid for Oil Rigs, and navigate taxation.',
    detail: 'Leases last a single cycle. Advance bids are paid up front and never refunded.',
    image: '/assets/components/comp-lease-bid-sm.webp',
    alt: 'Brass oil lease token beside a copper bid marker',
  },
  {
    key: 'SAIL',
    icon: Ship,
    text: 'Complete your network and accumulate Steel.',
    detail: 'Link City to Port, draw Steel Cards, and launch your ship at 10 Steel.',
    image: '/assets/components/comp-winning-ship-sm.webp',
    alt: 'Dark-hulled 1930s cargo steamship miniature',
  },
];

const SHOWCASE_IDS = ['steel-coins', 'steel-cards', 'oil-lease', 'road', 'pipeline', 'markets', 'tax-inspector', 'winning-ship'];

export function HomePage() {
  usePageMeta(
    '',
    'Build roads, control resources, outbid your rivals, and connect your City to your Port. The official companion to the Tax the Richmen board game.',
  );
  return (
    <>
      <Hero />
      <Pillars />
      <TerrainShowcase />
      <Victory />
      <Inspector />
      <GeneratorPreview />
      <ComponentShowcase />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative -mt-[4.5rem] flex min-h-[100svh] items-end overflow-hidden pt-[4.5rem]" aria-labelledby="hero-title">
      <picture>
        <source media="(max-width: 768px)" srcSet="/assets/hero/hero-board-sm.webp" />
        <img
          src="/assets/hero/hero-board.webp"
          alt="Tax the Richmen board on a walnut table: printed hex terrain, a sculpted Tax Inspector, pipelines, steamships and brass coins"
          className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
          fetchPriority="high"
        />
      </picture>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
      <div className="container-page relative pb-16 sm:pb-24">
        <div className="max-w-3xl animate-rise">
          <p className="eyebrow mb-6 flex items-center gap-3">
            <span aria-hidden className="h-px w-10 bg-brass" />
            An economic strategy board game
          </p>
          <h1 id="hero-title" className="display-xl text-ivory">
            Build your empire.
            <br />
            <span className="text-brass">Tax your rivals.</span>
          </h1>
          <p className="lede mt-7 max-w-xl text-lg text-ivory/85">
            Build roads, control resources, outbid your rivals, and connect your City to your Port. The first to launch their ship wins.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/how-to-play" className="btn btn-primary">
              Explore the Game <ArrowRight size={16} aria-hidden />
            </Link>
            <Link to="/map-generator" className="btn btn-secondary">
              Generate a Map
            </Link>
          </div>
        </div>
        <dl className="mt-16 grid max-w-2xl grid-cols-3 border-t border-brass-dark/40 pt-6">
          {[
            ['30', 'Hex tiles'],
            ['2–4', 'Players'],
            [String(LIMITS.steelToWin), 'Steel to win'],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="block font-display text-3xl font-bold text-ivory sm:text-4xl">{v}</span>
                <span className="mt-1 block text-xs tracking-[0.2em] text-muted uppercase">{l}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="section" aria-labelledby="pillars-title">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <SectionHeading
            id="pillars-title"
            eyebrow="The strategy"
            title={
              <>
                Fortunes are built.
                <br />
                Empires are taxed.
              </>
            }
          />
          <p className="lede lg:pb-2">
            Every turn you roll, trade, and take two actions. Production flows to every owner on every roll — but hoard more than seven
            resources and the Treasury will take half when a seven appears.
          </p>
        </div>
        <ol className="mt-16 grid gap-px overflow-hidden rounded-md border border-rivet bg-rivet md:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((p, i) => (
            <li key={p.key} className="group relative bg-coal">
              <Reveal delay={i * 90} className="flex h-full flex-col">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.alt}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-coal to-transparent" />
                  <span className="absolute top-4 left-5 font-display text-sm text-brass">0{i + 1}</span>
                </div>
                <div className="flex flex-1 flex-col p-6 pt-2">
                  <p.icon className="text-brass" size={22} aria-hidden />
                  <h3 className="mt-4 font-display text-2xl font-bold tracking-[0.12em] text-ivory">{p.key}</h3>
                  <p className="mt-2 font-medium text-ivory/90">{p.text}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{p.detail}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TerrainShowcase() {
  return (
    <section className="section walnut grain relative border-y border-rivet" aria-labelledby="terrain-title">
      <div className="container-page relative">
        <SectionHeading
          id="terrain-title"
          eyebrow="The board"
          align="center"
          title={
            <>
              Thirty hexes.
              <br />
              Countless strategies.
            </>
          }
          lede="Eight terrain types, each printed from top-down vintage industrial artwork. Eight Mine and Mountain tiles begin face-down — no one knows where the ore and granite lie."
        />
        <ul className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {TERRAIN_LIST.map((t, i) => (
            <li key={t.id}>
              <Reveal delay={(i % 4) * 80}>
                <div className="relative mx-auto max-w-[240px] transition-transform duration-500 hover:-translate-y-1">
                  <HexImage src={terrainImage(t.variants[0].file)} alt={`${t.label} terrain tile: ${t.variants[0].name}`} />
                  <span className="absolute -top-2 -right-1 flex h-12 w-12 items-center justify-center rounded-full border border-brass bg-ink font-display text-lg font-bold text-brass shadow-lg">
                    ×{t.count}
                  </span>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-display text-xl font-bold tracking-[0.1em] text-ivory">{t.count > 1 ? t.plural : t.label}</h3>
                  <p className="mt-1 text-xs tracking-[0.18em] text-brass uppercase">{t.short}</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">{t.description}</p>
                  <p className="mt-3 text-xs text-dim">{t.variants.map((v) => v.name).join(' · ')}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Victory() {
  const stages = [
    { n: 'I', title: 'Build your City-to-Port network', text: 'A continuous chain of your own Roads and legally purchased toll Roads.' },
    { n: 'II', title: 'Activate your Port', text: 'Each roll of your Port’s number draws a Steel Card worth 1 to 5 Steel. Build a Market to buy more.' },
    { n: 'III', title: 'Accumulate 10 Steel and win', text: 'The moment you hold ten, your cargo ship launches. No further action required.' },
  ];
  return (
    <section className="section overflow-hidden" aria-labelledby="victory-title">
      <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading id="victory-title" eyebrow="The path to victory" title="Your port is only the beginning." />
          <ol className="mt-12 space-y-0">
            {stages.map((s, i) => (
              <li key={s.n} className="relative flex gap-6 pb-10 last:pb-0">
                {i < stages.length - 1 && <span aria-hidden className="absolute top-14 left-7 h-[calc(100%-3.5rem)] w-px bg-gradient-to-b from-brass-dark to-transparent" />}
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brass/60 font-display text-lg font-bold text-brass">
                  {s.n}
                </span>
                <div className="pt-2">
                  <h3 className="font-display text-xl font-semibold text-ivory">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <Reveal className="relative">
          <div className="engraved-frame">
            <img
              src="/assets/components/comp-winning-ship.webp"
              alt="The winning ship: a sculpted 1930s cargo steamship with brass fittings"
              loading="lazy"
              className="w-full"
            />
          </div>
          <div className="plate absolute -bottom-6 left-6 flex items-center gap-4 px-5 py-4 sm:left-auto sm:-right-4">
            <img src="/assets/components/comp-steel-coins-sm.webp" alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-display text-2xl font-bold text-ivory">10 Steel</p>
              <p className="text-xs tracking-[0.18em] text-muted uppercase">Immediate victory</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Inspector() {
  const steps = [
    ['Taxation', `Anyone holding ${LIMITS.taxThreshold}+ ordinary resources surrenders half, rounded down.`],
    ['Steel tax', 'Players holding 8 or 9 Steel lose one — unless a Steel Vault protects them.'],
    ['Relocation', 'The active player moves the Inspector to a different revealed land hex.'],
    ['Theft', 'One random ordinary resource is taken from an owner or Office holder there.'],
  ];
  const sevenPct = Math.round(diceProbability(7) * 1000) / 10;
  return (
    <section className="section relative overflow-hidden border-y border-rivet bg-ink-2" aria-labelledby="inspector-title">
      <div aria-hidden className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-ember/10 blur-3xl" />
      <div className="container-page relative grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal className="order-2 lg:order-1">
          <div className="engraved-frame mx-auto max-w-md">
            <img
              src="/assets/components/comp-tax-inspector.webp"
              alt="The Tax Inspector miniature: a 1930s official in a pinstripe suit and bowler hat with briefcase and ledger on a red base"
              loading="lazy"
              className="w-full"
            />
          </div>
        </Reveal>
        <div className="order-1 lg:order-2">
          <SectionHeading
            id="inspector-title"
            eyebrow="The signature figure"
            title={
              <>
                When seven rolls,
                <br />
                <span className="text-ember-light">fortunes change.</span>
              </>
            }
            lede={`Seven is the most likely roll — ${sevenPct}% of the time. It produces nothing. Instead, the Tax Inspector arrives in four strict steps.`}
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {steps.map(([t, d], i) => (
              <li key={t} className="plate-flat p-5">
                <span className="font-display text-sm text-ember-light">Step {i + 1}</span>
                <h3 className="mt-1 font-display text-lg font-semibold text-ivory">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">
            While he stands on a hex: no new Roads in or out, no new Offices or purchases. On an Oil Rig, Fuel stops. On a Port, Steel and
            Market trading stop.
          </p>
        </div>
      </div>
    </section>
  );
}

function GeneratorPreview() {
  const [mode, setMode] = useState<'classic' | 'balanced'>('classic');
  const [n, setN] = useState(1);
  const map = useMemo(
    () => (mode === 'classic' ? generateClassic(`PREVIEW-${n}`) : generateBalanced(`PREVIEW-${n}`).map),
    [mode, n],
  );
  const analysis = useMemo(() => analyzeMap(map.tiles), [map]);
  const features = [
    ['Classic Layout', 'The approved seven-column arrangement, with Mines and Mountains shuffled beneath identical backs.'],
    ['Balanced Random', 'Hundreds of seeded candidates scored for access, chokepoints and number spread.'],
    ['Custom Editing', 'Swap, drag, lock and re-number tiles with undo and redo.'],
    ['Validation', 'Hard errors and soft balance warnings, explained hex by hex.'],
    ['Export', 'PNG, SVG, JSON, print-ready PDF and shareable links.'],
  ];
  return (
    <section className="section" aria-labelledby="preview-title">
      <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <SectionHeading
            id="preview-title"
            eyebrow="Map generator"
            title="Every map tells a different story."
            lede="Shown here is the real generator and renderer — the same engine that powers the full editor."
          />
          <ul className="mt-10 space-y-4">
            {features.map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <Check className="mt-1 shrink-0 text-brass" size={18} aria-hidden />
                <p>
                  <span className="font-semibold text-ivory">{t}.</span> <span className="text-muted">{d}</span>
                </p>
              </li>
            ))}
          </ul>
          <Link to="/map-generator" className="btn btn-primary mt-10">
            Generate Map <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="plate walnut overflow-hidden p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div role="radiogroup" aria-label="Preview layout" className="flex gap-2">
              {(['classic', 'balanced'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} className="btn btn-ghost btn-sm" onClick={() => setMode(m)}>
                  {m === 'classic' ? 'Classic' : 'Balanced Random'}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setN((x) => x + 1)}>
              <Shuffle size={15} aria-hidden /> New seed
            </button>
          </div>
          <BoardArt tiles={map.tiles} prefix="home-preview" title={`${mode === 'classic' ? 'Classic' : 'Balanced random'} board preview`} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              Seed <span className="font-mono text-ivory">PREVIEW-{n}</span>
            </span>
            <span>
              Estimated balance <span className="font-semibold text-brass">{analysis.score}/100</span> · {analysis.errors.length} errors ·{' '}
              {analysis.warnings.length} warnings
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentShowcase() {
  const items = SHOWCASE_IDS.map((id) => COMPONENTS.find((c) => c.id === id)!);
  const labels: Record<string, string> = { 'oil-lease': 'Oil Rigs', markets: 'Port Markets', road: 'Roads', pipeline: 'Pipelines' };
  return (
    <section className="section border-t border-rivet bg-ink-2" aria-labelledby="components-title">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="components-title"
            eyebrow="Components"
            title="Built to be held."
            lede="Sculpted miniatures, embossed metal coins and engraved certificates — designed as a collectible set."
          />
          <Link to="/components" className="btn btn-secondary">
            View all components
          </Link>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((c, i) => {
            const big = i === 0 || i === 6;
            const wide = i === 5 || i === 7;
            return (
            <li
              key={c.id}
              className={big ? `md:col-span-2 md:row-span-2 ${i === 6 ? 'md:col-start-3 md:row-start-3' : ''}` : wide ? 'md:col-span-2 md:col-start-1' : ''}
            >
              <Link to={`/components#${c.id}`} className="group hover-lift relative block h-full overflow-hidden rounded-md border border-rivet bg-coal">
                <img
                  src={big || wide ? c.image : thumb(c.image)}
                  alt={c.alt}
                  loading="lazy"
                  className={`aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${wide ? 'md:aspect-[8/3]' : ''} ${big ? 'md:absolute md:inset-0 md:aspect-auto' : ''}`}
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-base font-semibold tracking-[0.08em] text-ivory sm:text-lg">{labels[c.id] ?? c.name}</h3>
                  {c.costs?.[0] && (
                    <div className="mt-2 hidden sm:block">
                      <CostBadges cost={c.costs[0]} size="sm" />
                    </div>
                  )}
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="final-title">
      <img src="/assets/hero/hero-board-sm.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" loading="lazy" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink" />
      <div className="container-page section relative text-center">
        <p className="eyebrow">The table awaits</p>
        <h2 id="final-title" className="display-lg mx-auto mt-5 max-w-3xl text-ivory">
          The board is set.
          <br />
          <span className="text-brass">Your empire awaits.</span>
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/rulebook" className="btn btn-secondary">
            Discover the Rules
          </Link>
          <Link to="/map-generator" className="btn btn-primary">
            Generate Your Map
          </Link>
        </div>
      </div>
    </section>
  );
}
