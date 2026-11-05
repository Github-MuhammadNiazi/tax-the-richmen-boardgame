import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  BUNDLE_LINKS,
  CARD_FILES,
  FILAMENTS,
  HIDDEN_COVER_COPIES,
  NUMBER_CHIP_TOTAL,
  PLAYER_FILAMENTS,
  PRINT_CATEGORIES,
  PRINT_MODELS,
  PRINTER_PROFILES,
  UNIQUE_MODEL_COUNT,
  modelFiles,
  type PrintCategory,
} from '../data/modelCatalog';
import { usePageMeta } from '../lib/usePageMeta';
import { BuildingCostPanel } from '../print/BuildingCostPanel';

const SWATCHES = [...FILAMENTS, ...PLAYER_FILAMENTS];

function TintedPreview({ src, alt, tint }: { src: string; alt: string; tint: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(img, 0, 0);
    };
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src, tint]);
  return <canvas ref={ref} role="img" aria-label={alt} className="h-44 w-full" />;
}

export default function Print3dPage() {
  usePageMeta(
    '3D printing',
    'Download printable STL and 3MF files for Tax the Richmen: hex bases, terrain toppers, roads, pipelines, offices, markets, the Tax Inspector, coins and A4 Steel Cards. Slice them in Bambu Studio.',
  );
  const [category, setCategory] = useState<PrintCategory | 'All'>('All');
  const [profile, setProfile] = useState<(typeof PRINTER_PROFILES)[number]['id']>('compact');
  const [filament, setFilament] = useState<string | null>(null);
  const [showAlt, setShowAlt] = useState(false);
  const selected = SWATCHES.find((s) => s.id === filament);
  const printer = PRINTER_PROFILES.find((p) => p.id === profile) ?? PRINTER_PROFILES[0];
  const shown = useMemo(
    () => PRINT_MODELS.filter((m) => (category === 'All' || m.category === category) && (showAlt || !m.alternative)),
    [category, showAlt],
  );
  const bom = PRINT_MODELS.filter((m) => showAlt || !m.alternative);

  return (
    <div className="container-page pb-24 pt-12 md:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-brass-dark" />
          3D printing
        </p>
        <h1 className="display-lg text-ivory">Print the pieces.</h1>
        <p className="lede mt-5">
          {UNIQUE_MODEL_COUNT} unique models for Bambu Lab and other FDM printers. Open the STL or 3MF in Bambu Studio, choose your printer and filament, and slice there. These files contain no G-code and no Bambu Studio project settings.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link to="/components" className="text-brass hover:text-brass-light">
          Component guide
        </Link>
        <Link to="/print-export" className="text-brass hover:text-brass-light">
          Paper print and export
        </Link>
      </div>

      <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-labelledby="printer-heading">
        <div className="rounded-sm border border-rivet bg-coal/40 p-5">
          <h2 id="printer-heading" className="font-display text-lg text-ivory">
            Printer profile
          </h2>
          <p className="mt-2 text-sm text-muted">Every part fits the compact bed. A larger bed only lets you arrange more copies on one plate. The geometry does not change.</p>
          <div role="radiogroup" aria-label="Printer profile" className="mt-4 flex flex-wrap gap-2">
            {PRINTER_PROFILES.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={profile === p.id} className="btn btn-ghost btn-sm" onClick={() => setProfile(p.id)}>
                {p.name} {p.bed} mm
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-parchment" role="status">
            {printer.detail}
          </p>
        </div>
        <div className="rounded-sm border border-rivet bg-coal/40 p-5">
          <h2 className="font-display text-lg text-ivory">Filament preview</h2>
          <p className="mt-2 text-sm text-muted">A colour preview only. It does not change the STL. Assign filament in the slicer. One file is printed in any player colour.</p>
          <div role="radiogroup" aria-label="Filament colour" className="mt-4 flex flex-wrap gap-2">
            <button type="button" role="radio" aria-checked={filament === null} className="btn btn-ghost btn-sm" onClick={() => setFilament(null)}>
              Suggested
            </button>
            {SWATCHES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={filament === s.id}
                aria-label={s.name}
                title={s.name}
                onClick={() => setFilament(s.id)}
                className="h-8 w-8 rounded-full border border-ivory/30"
                style={{ background: s.hex, outline: filament === s.id ? '2px solid #e4d3b0' : undefined, outlineOffset: 2 }}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-parchment" role="status">
            {selected ? `Previewing ${selected.name} on every part.` : 'Each part is shown in its suggested filament.'}
          </p>
        </div>
      </section>

      <div role="radiogroup" aria-label="Filter by category" className="mt-10 flex flex-wrap gap-2">
        {(['All', ...PRINT_CATEGORIES] as const).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)} className="btn btn-ghost btn-sm">
            {c}
          </button>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={showAlt} onChange={(e) => setShowAlt(e.target.checked)} />
        Show sculpted relief toppers (an alternative to the printed-artwork toppers)
      </label>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {shown.map((model) => {
          const files = modelFiles(model.id);
          const tint = (selected ?? SWATCHES.find((s) => s.id === model.filament))?.hex ?? '#c6a15b';
          return (
            <article key={model.id} id={model.id} data-model={model.id} className="flex flex-col rounded-sm border border-rivet bg-ink-2/40">
              <div className="grid grid-cols-2 gap-2 bg-coal/50 p-3">
                <TintedPreview src={files.iso} alt={`${model.name}, isometric preview`} tint={tint} />
                <img src={files.top} alt={`${model.name}, top view`} className="h-44 w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brass">{model.category}</p>
                  <h2 className="font-display text-xl text-ivory">{model.name}</h2>
                  <p className="mt-2 text-sm text-parchment">{model.summary}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-dim">Print</dt>
                    <dd className="text-ivory">
                      {model.copies}
                      {model.supplyOnly ? ' (supply)' : ''}
                      {model.alternative ? ' (alternative)' : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-dim">Material</dt>
                    <dd className="text-ivory">{model.material}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Suggested filament</dt>
                    <dd className="text-ivory">{SWATCHES.find((s) => s.id === model.filament)?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Orientation</dt>
                    <dd className="text-ivory">{model.orientation}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Supports</dt>
                    <dd className="text-ivory">{model.supports}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Settings</dt>
                    <dd className="text-ivory">{model.settings}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted">{model.quantityNote}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <a className="btn btn-primary btn-sm" href={files.stl} download>
                    STL
                  </a>
                  <a className="btn btn-secondary btn-sm" href={files.threeMf} download>
                    3MF
                  </a>
                  <a className="btn btn-ghost btn-sm" href="/printables/cad/kit.scad" download>
                    kit.scad
                  </a>
                  <a className="btn btn-ghost btn-sm" href="/printables/cad/lib.scad" download>
                    lib.scad
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-16" aria-labelledby="bom-heading">
        <h2 id="bom-heading" className="display-lg text-ivory">
          Print quantities
        </h2>
        <p className="lede mt-4 max-w-3xl">
          One file, printed the number of times below. Player colour is the filament you load. A “supply” count is a practical pile, not a rule. Relief toppers replace artwork toppers; they are not extra hexes.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-dim">
              <tr>
                <th className="py-2 pr-4 font-medium">Part</th>
                <th className="py-2 pr-4 font-medium">Copies</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {bom.map((m) => (
                <tr key={m.id} className="border-t border-rivet/70">
                  <td className="py-2 pr-4 text-ivory">{m.name}</td>
                  <td className="py-2 pr-4 tabular-nums text-brass">{m.copies}</td>
                  <td className="py-2 text-muted">{m.quantityNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16" aria-labelledby="zip-heading">
        <h2 id="zip-heading" className="display-lg text-ivory">
          Download packs
        </h2>
        <p className="mt-4 max-w-3xl text-sm text-muted">Each archive holds one copy of each unique STL and 3MF, plus the OpenSCAD source. It does not repeat a file once per printed copy.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {BUNDLE_LINKS.map((b) => (
            <li key={b.id}>
              <a className="btn btn-secondary w-full" href={b.file} download>
                {b.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="assembly-heading">
        <h2 id="assembly-heading" className="display-lg text-ivory">
          Assembly
        </h2>
        <ol className="mt-6 max-w-3xl list-decimal space-y-3 pl-5 text-sm text-parchment">
          <li>Print the fit bar first. The production peg should seat in the middle hole (0.30 mm diametral clearance). If it is tight, raise `hole_clearance` in the OpenSCAD source and export again.</li>
          <li>Print {PRINT_MODELS.find((m) => m.id === 'hex_base')?.copies} universal bases. The keyed peg stops a topper from rotating.</li>
          <li>Press an artwork topper onto each base, or the matching relief topper. The paper insert is the 62 mm hex template, cut from the terrain artwork.</li>
          <li>Seat number chips in the round recess. That recess sits off the road corridors. There are {NUMBER_CHIP_TOTAL} chips and no 7.</li>
          <li>Hide each Mine and Mountain with a cover, {HIDDEN_COVER_COPIES} identical lids. Lift the cover by the finger scoop when the tile is revealed. The cover hides the topper and the chip.</li>
          <li>Lay a Road on each connection you build. The segment runs from centre toward centre and stops 13 mm short of each, leaving room for the chip and the Inspector ring.</li>
          <li>Lay Pipelines the same way, beside a Road if you use both. Whether the rules allow both on one connection is still a playtest clarification.</li>
          <li>Put Establishments on owned properties and Offices on the flat wedges. Two Offices fit on one hex with the chip and the roads. Flags press into the sockets.</li>
          <li>Mark a bid by stacking Money coins in the bid tray. Each coin is 1 Money.</li>
          <li>Press the bowler hat onto the Inspector. The ring marks the hex the Inspector occupies.</li>
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="cards-heading">
        <h2 id="cards-heading" className="display-lg text-ivory">
          A4 cards
        </h2>
        <p className="mt-4 max-w-3xl text-sm text-muted">
          Steel Cards are 60 × 85 mm, a prototype size. The building-cost cards are a separate 90 × 128 mm set. Print at 100% scale and cut on the crop marks. For duplex, flip on the long edge: the back sheet is already mirrored so the fronts and backs meet. Unresolved rules stay in the rulebook, not on these cards.
        </p>
        <BuildingCostPanel />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {CARD_FILES.filter((c) => !c.file.includes('building-cost')).map((c) => (
            <li key={c.file} className="rounded-sm border border-rivet p-4">
              <a className="font-display text-ivory hover:text-brass" href={c.file} download>
                {c.name}
              </a>
              <p className="mt-1 text-xs text-muted">{c.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
