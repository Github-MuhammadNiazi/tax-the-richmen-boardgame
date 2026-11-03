import { BookOpen, Expand, Ruler } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CostBadges } from '../components/ui/CostBadges';
import { Lightbox, type LightboxImage } from '../components/ui/Lightbox';
import { COMPONENTS, MARKET_IMAGES, thumb, type ComponentDef } from '../data/components';
import { COST_LABEL } from '../data/costs';
import { findRule, ruleHref } from '../data/rules';
import { HIDDEN_BACK, TERRAIN_LIST, terrainImage } from '../data/terrain';
import { usePageMeta } from '../lib/usePageMeta';

const CATEGORIES = ['All', ...Array.from(new Set(COMPONENTS.map((c) => c.category)))] as const;

const COST_TITLES: Record<string, string> = {
  road: 'Road',
  roadMountainSurcharge: 'Mountain surcharge',
  investCity: 'City',
  investVillage: 'Village',
  investMine: 'Mine',
  investMountain: 'Mountain',
  marketWood: 'Wood Market',
  marketMetal: 'Metal Market',
  marketFuel: 'Fuel Market',
  marketStone: 'Stone Market',
  oilBidMinimum: 'Minimum bid',
  steelPurchase: '1 Steel Coin',
};

function galleryFor(c: ComponentDef): LightboxImage[] {
  if (c.id === 'terrain-tiles')
    return [
      ...TERRAIN_LIST.flatMap((t) => t.variants.map((v) => ({ src: terrainImage(v.file), alt: `${t.label} tile artwork: ${v.name}`, caption: `${t.label} — ${v.name}` }))),
      { src: terrainImage(HIDDEN_BACK.file), alt: 'Engraved back shared by all concealed Mine and Mountain tiles', caption: HIDDEN_BACK.name },
    ];
  if (c.id === 'markets') return MARKET_IMAGES.map((m) => ({ src: m.image, alt: m.alt, caption: `${m.name} · ${COST_LABEL[m.resource]} Market` }));
  return [{ src: c.image, alt: c.alt }];
}

function ComponentCard({ c, onOpen }: { c: ComponentDef; onOpen: () => void }) {
  const rule = findRule(c.rule);
  const gallery = galleryFor(c);
  return (
    <article id={c.id} className="group plate flex scroll-mt-28 flex-col overflow-hidden" aria-labelledby={`${c.id}-name`}>
      <button type="button" onClick={onOpen} className="relative block aspect-[4/3] overflow-hidden bg-coal" aria-label={`Enlarge ${c.name}${gallery.length > 1 ? ` (${gallery.length} images)` : ''}`}>
        <img src={thumb(c.image)} alt={c.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-rivet bg-ink/80 text-parchment opacity-80 group-hover:opacity-100" aria-hidden>
          <Expand size={14} />
        </span>
        {gallery.length > 1 && <span className="absolute bottom-3 right-3 rounded-sm bg-ink/85 px-2 py-0.5 text-xs text-parchment">{gallery.length} images</span>}
        <span className="absolute left-3 top-3 rounded-sm bg-ink/85 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brass">{c.category}</span>
      </button>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h2 id={`${c.id}-name`} className="font-display text-xl font-semibold tracking-[0.04em] text-ivory">
            {c.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="label">Purpose</dt>
            <dd className="text-parchment">{c.purpose}</dd>
          </div>
          <div>
            <dt className="label">Cost</dt>
            <dd>
              {c.costs?.length ? (
                <ul className="space-y-1.5">
                  {c.costs.map((id) => (
                    <li key={id} className="flex flex-wrap items-center justify-between gap-2">
                      {c.costs!.length > 1 && <span className="text-xs text-muted">{COST_TITLES[id] ?? ''}</span>}
                      <CostBadges cost={id} size="sm" />
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">No cost — supplied with the game.</span>
              )}
              {c.costNote && <p className="mt-1.5 text-xs text-dim">{c.costNote}</p>}
            </dd>
          </div>
          <div>
            <dt className="label">Placement</dt>
            <dd className="text-parchment">{c.placement}</dd>
          </div>
        </dl>
        {c.prototype && (
          <p className="flex items-start gap-2 rounded-sm border border-dashed border-rivet px-3 py-2 text-xs text-muted">
            <Ruler size={13} className="mt-0.5 shrink-0 text-brass" aria-hidden />
            {c.prototype} Not a final manufacturing specification.
          </p>
        )}
        <Link to={ruleHref(c.rule)} className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brass hover:text-brass-light">
          <BookOpen size={13} aria-hidden /> Rule: {rule?.item.title ?? 'Rulebook'}
        </Link>
      </div>
    </article>
  );
}

export default function ComponentsPage() {
  usePageMeta('Components', 'Every Tax the Richmen component: terrain tiles, Roads, Pipelines, Offices, Port Markets, Steel Cards and Coins, the Tax Inspector and the winning ship.');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [open, setOpen] = useState<{ id: string; index: number } | null>(null);
  const shown = useMemo(() => (category === 'All' ? COMPONENTS : COMPONENTS.filter((c) => c.category === category)), [category]);
  const openComponent = open ? COMPONENTS.find((c) => c.id === open.id) : undefined;

  return (
    <div className="container-page pb-24 pt-12 md:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-brass-dark" />
          Components
        </p>
        <h1 className="display-lg text-ivory">Built to be held.</h1>
        <p className="lede mt-5">
          Sculpted miniatures, embossed coins and engraved certificates. The images are concept renders of the prototype set; dimensions, where given, are proposals rather than final specifications.
        </p>
      </header>

      <div role="radiogroup" aria-label="Filter by category" className="mt-10 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className="btn btn-ghost btn-sm">
            {c}
            <span className="text-dim">{c === 'All' ? COMPONENTS.length : COMPONENTS.filter((x) => x.category === c).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => (
          <ComponentCard key={c.id} c={c} onOpen={() => setOpen({ id: c.id, index: 0 })} />
        ))}
      </div>

      <Lightbox
        title={openComponent?.name ?? 'Component'}
        images={openComponent ? galleryFor(openComponent) : []}
        index={open?.index ?? null}
        onIndex={(index) => setOpen((o) => (o ? { ...o, index } : o))}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
