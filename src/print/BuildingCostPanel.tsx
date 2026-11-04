import { PLAYERS } from '../data/players';
import { BUILDING_COST_FILES, CARD_TRIM } from './buildingCostCard';

const PREVIEW = '/printables/cards/previews';

/** Downloads and previews for the four double-sided building-cost cards. */
export function BuildingCostPanel() {
  return (
    <section id="building-cost-cards" aria-labelledby="building-cost-heading" className="mt-14">
      <div className="max-w-3xl">
        <h2 id="building-cost-heading" className="font-display text-2xl font-semibold tracking-[0.04em] text-ivory">
          Building cost cards
        </h2>
        <p className="mt-2 text-sm text-muted">
          Four double-sided cards, {CARD_TRIM.w} × {CARD_TRIM.h} mm after trimming. The pictures are the costs. Colour and symbol mark the player. Unresolved rules stay in the rulebook.
        </p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <figure className="overflow-hidden rounded-sm border border-rivet bg-coal/40 p-3">
          <img src={`${PREVIEW}/front-red.png`} alt="Building cost card front for the red player, circle symbol, 90 by 128 millimetres" className="mx-auto max-h-[28rem] w-auto" />
          <figcaption className="mt-2 text-center text-xs text-dim">Front · building costs</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-sm border border-rivet bg-coal/40 p-3">
          <img src={`${PREVIEW}/back-red.png`} alt="Building cost card back for the red player, construction and placement rules" className="mx-auto max-h-[28rem] w-auto" />
          <figcaption className="mt-2 text-center text-xs text-dim">Back · construction and placement</figcaption>
        </figure>
      </div>
      <figure className="mt-4 overflow-hidden rounded-sm border border-rivet bg-coal/40 p-3">
        <img src={`${PREVIEW}/sheet-1.png`} alt="A4 sheet with four building-cost card fronts, crop marks and 3 millimetre bleed" className="mx-auto max-h-[36rem] w-auto" />
        <figcaption className="mt-2 text-center text-xs text-dim">A4 front sheet · 2 × 2 · crop marks outside a 3 mm bleed</figcaption>
      </figure>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Player colours">
        {PLAYERS.map((player) => (
          <li key={player.id} className="inline-flex items-center gap-2 rounded-sm border border-rivet px-2.5 py-1 text-xs text-parchment">
            <span aria-hidden className="h-3 w-3 rounded-sm border border-ivory/30" style={{ background: player.hex }} />
            {player.label} · {player.symbol}
          </li>
        ))}
      </ul>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {BUILDING_COST_FILES.map((card) => (
          <li key={card.file} className="rounded-sm border border-rivet p-4">
            <a className="font-display text-ivory hover:text-brass" href={card.file} download>
              {card.name}
            </a>
            <p className="mt-1 text-xs text-muted">{card.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
