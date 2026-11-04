import { Download, Eye, Loader2, Map as MapIcon, Printer, X } from 'lucide-react';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { screenImages } from '../components/board/TileArt';
import { BoardSheet } from '../export/BoardSheet';
import { exportBoardPdf, printBoard } from '../export/board';
import { usePageMeta } from '../lib/usePageMeta';
import { generateClassic } from '../map/classic';
import type { BoardMap } from '../map/types';
import { DocView } from '../print/DocView';
import { inspectorDoc, oilBiddingDoc, playerReferenceDoc, portMarketDoc, quickStartDoc, roadPipelineDoc, rulebookDoc, type PrintDoc } from '../print/docs';
import { BuildingCostPanel } from '../print/BuildingCostPanel';
import { downloadDocPdf } from '../print/pdfDoc';
import { printPages } from '../print/PrintHost';
import { exportSheetPdf } from '../print/sheetExport';
import { numberTokenPages, steelCardPages, tileBackPages, type SheetOptions } from '../print/sheets';
import { useMapStore } from '../store/mapStore';

type Group = 'Boards' | 'Pieces' | 'Reference cards' | 'Documents';

type Kind = { kind: 'board'; map: BoardMap } | { kind: 'sheet'; build: (opts: SheetOptions) => ReactNode[] } | { kind: 'doc'; doc: PrintDoc };

interface Printable {
  id: string;
  title: string;
  group: Group;
  description: string;
  paper: string;
  pages: string;
  source: Kind;
  pdfLabel?: string;
  extra?: ReactNode;
}

function buildPrintables(current: BoardMap, classic: BoardMap): Printable[] {
  const docs = { player: playerReferenceDoc(), road: roadPipelineDoc(), market: portMarketDoc(), oil: oilBiddingDoc(), inspector: inspectorDoc(), rulebook: rulebookDoc(), quick: quickStartDoc() };
  return [
    {
      id: 'classic-board',
      title: 'Classic board',
      group: 'Boards',
      description: 'The fixed Classic layout with its number tokens and the eight concealed tile positions face-down.',
      paper: 'A3 landscape',
      pages: '1 page',
      source: { kind: 'board', map: classic },
    },
    {
      id: 'generated-board',
      title: 'Generated board',
      group: 'Boards',
      description: `Your current map from the generator: “${current.name}”, seed ${current.seed}.`,
      paper: 'A3 landscape',
      pages: '1 page',
      source: { kind: 'board', map: current },
      extra: (
        <Link to="/map-generator" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brass hover:text-brass-light">
          <MapIcon size={13} aria-hidden /> Change in the generator
        </Link>
      ),
    },
    {
      id: 'tile-backs',
      title: 'Hidden tile backs',
      group: 'Pieces',
      description: 'Eight identical engraved backs for the concealed Mine and Mountain tiles, with cut outlines.',
      paper: 'A4 portrait',
      pages: `${tileBackPages().length} pages`,
      source: { kind: 'sheet', build: tileBackPages },
    },
    {
      id: 'number-tokens',
      title: 'Number token sheet',
      group: 'Pieces',
      description: 'All twenty production tokens (no 7) plus the four dark Port tokens 5, 6, 8 and 9.',
      paper: 'A4 portrait',
      pages: '1 page',
      source: { kind: 'sheet', build: numberTokenPages },
    },
    {
      id: 'steel-cards',
      title: 'Steel Card deck',
      group: 'Pieces',
      description: 'The twenty-card Steel deck — five 1s, five 2s, four 3s, four 4s and two 5s — plus a sheet of matching backs.',
      paper: 'A4 portrait',
      pages: `${steelCardPages().length} pages`,
      source: { kind: 'sheet', build: steelCardPages },
    },
    { id: 'player-reference', title: 'Player resource reference', group: 'Reference cards', description: 'Turn sequence, starting resources, production, every action cost and trading rates.', paper: 'A4 portrait', pages: 'Flows to fit', source: { kind: 'doc', doc: docs.player } },
    { id: 'road-pipeline', title: 'Road & Pipeline costs', group: 'Reference cards', description: 'Road costs and the Mountain surcharge, toll access and allowances, owner priority and Pipelines.', paper: 'A4 portrait', pages: 'Flows to fit', source: { kind: 'doc', doc: docs.road } },
    { id: 'port-market', title: 'Port Market reference', group: 'Reference cards', description: 'Specializations, the four Market costs, the 2:1 exchange, Steel purchases and the Steel Vault.', paper: 'A4 portrait', pages: 'Flows to fit', source: { kind: 'doc', doc: docs.market } },
    { id: 'oil-bidding', title: 'Oil Rig bidding reference', group: 'Reference cards', description: 'Standard leases, advance bidding with a worked timeline, and Pipeline production.', paper: 'A4 portrait', pages: 'Flows to fit', source: { kind: 'doc', doc: docs.oil } },
    { id: 'tax-inspector', title: 'Tax Inspector reference', group: 'Reference cards', description: 'The four strict steps of a 7, eligible destinations and the Inspector’s effects.', paper: 'A4 portrait', pages: 'Flows to fit', source: { kind: 'doc', doc: docs.inspector } },
    {
      id: 'rulebook-pdf',
      title: 'Complete rulebook',
      group: 'Documents',
      description: 'Every section, cost table, glossary entry and open playtest clarification, generated from the same rules source as the website.',
      paper: 'A4 portrait',
      pages: 'Multi-page',
      source: { kind: 'doc', doc: docs.rulebook },
      pdfLabel: 'Download rulebook PDF',
      extra: (
        <Link to="/rulebook" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brass hover:text-brass-light">
          Read online
        </Link>
      ),
    },
    { id: 'quick-start', title: 'Quick-start guide', group: 'Documents', description: 'Board, setup, the turn, the 7 and victory — enough to start a first game.', paper: 'A4 portrait', pages: 'Flows to fit', source: { kind: 'doc', doc: docs.quick } },
  ];
}

async function printPrintable(p: Printable) {
  const s = p.source;
  if (s.kind === 'board') return printBoard(s.map);
  if (s.kind === 'sheet')
    return printPages(
      s.build({ physical: true }).map((page, i) => (
        <div key={i} className="print-page">
          {page}
        </div>
      )),
      'A4',
      'portrait',
    );
  return printPages(<DocView doc={s.doc} />, 'A4', 'portrait', 14);
}

async function pdfPrintable(p: Printable) {
  const s = p.source;
  if (s.kind === 'board') return exportBoardPdf(s.map);
  if (s.kind === 'sheet') return exportSheetPdf(p.title, s.build);
  return downloadDocPdf(s.doc);
}

/** Renders a fixed-width A4 document scaled down to the container's width. */
function ScaledPage({ children, clip = true }: { children: ReactNode; clip?: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const PAGE_PX = 794;
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAGE_PX);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className={clip ? 'relative aspect-[210/297] overflow-hidden' : 'relative'}>
      <div style={{ width: PAGE_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }} className={clip ? 'absolute left-0 top-0' : ''}>
        {children}
      </div>
    </div>
  );
}

function Preview({ p, full = false }: { p: Printable; full?: boolean }) {
  const s = p.source;
  if (s.kind === 'board') return <BoardSheet map={s.map} imageFor={screenImages} />;
  if (s.kind === 'sheet') {
    const pages = s.build({ imageFor: screenImages });
    return full ? (
      <div className="space-y-4">
        {pages.map((page, i) => (
          <div key={i} className="shadow-lift">
            {page}
          </div>
        ))}
      </div>
    ) : (
      <>{pages[0]}</>
    );
  }
  return full ? (
    <div className="mx-auto max-w-[794px] shadow-lift">
      <DocView doc={s.doc} />
    </div>
  ) : (
    <ScaledPage>
      <DocView doc={s.doc} />
    </ScaledPage>
  );
}

function PreviewDialog({ p, onClose }: { p: Printable | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!p && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [p]);
  return (
    <dialog
      ref={ref}
      aria-label={p ? `${p.title} preview` : 'Preview'}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto max-h-[94vh] w-[min(72rem,96vw)] overflow-hidden rounded-lg border border-brass-dark bg-ink p-0 text-ivory shadow-lift backdrop:bg-black/80 ${p ? '' : 'hidden'}`}
    >
      {p && (
        <div className="flex max-h-[94vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-rivet px-5 py-3">
            <h2 className="font-display text-lg text-ivory">{p.title}</h2>
            <button type="button" aria-label="Close preview" onClick={onClose} autoFocus className="grid h-9 w-9 place-items-center rounded-full border border-rivet text-ivory hover:border-brass">
              <X size={16} aria-hidden />
            </button>
          </div>
          <div className="overflow-auto bg-coal p-4 md:p-8">
            <Preview p={p} full />
          </div>
        </div>
      )}
    </dialog>
  );
}

function PrintableCard({ p, onPreview }: { p: Printable; onPreview: () => void }) {
  const [busy, setBusy] = useState<'print' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (what: 'print' | 'pdf') => {
    setBusy(what);
    setError(null);
    try {
      await (what === 'print' ? printPrintable(p) : pdfPrintable(p));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <article id={p.id} data-printable={p.id} className="plate flex scroll-mt-28 flex-col overflow-hidden" aria-labelledby={`${p.id}-title`}>
      <button type="button" onClick={onPreview} className="group relative block overflow-hidden border-b border-rivet bg-coal p-4" aria-label={`Preview ${p.title}`}>
        <div className={`mx-auto overflow-hidden shadow-lift transition-transform duration-500 group-hover:scale-[1.02] ${p.source.kind === 'board' ? 'w-full' : 'w-[62%]'}`} aria-hidden>
          <Preview p={p} />
        </div>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-sm bg-ink/85 px-2 py-1 text-xs text-parchment opacity-80 group-hover:opacity-100">
          <Eye size={13} aria-hidden /> Preview
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="label">{p.group}</p>
        <h3 id={`${p.id}-title`} className="font-display text-xl font-semibold tracking-[0.04em] text-ivory">
          {p.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted">{p.description}</p>
        <p className="text-xs text-dim">
          {p.paper} · {p.pages}
        </p>
        {p.extra}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => run('print')} disabled={busy != null}>
            {busy === 'print' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Printer size={14} aria-hidden />} Print
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => run('pdf')} disabled={busy != null}>
            {busy === 'pdf' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Download size={14} aria-hidden />} {p.pdfLabel ?? 'Download PDF'}
          </button>
        </div>
        <p role="status" className="min-h-[1rem] text-xs text-ember-light">
          {busy === 'pdf' ? 'Preparing PDF…' : error}
        </p>
      </div>
    </article>
  );
}

const GROUPS: { id: Group; intro: string }[] = [
  { id: 'Boards', intro: 'Full-colour board plates with the walnut surround and a legend. Print on A3 — or tile them on two A4 sheets with your print dialog.' },
  { id: 'Pieces', intro: 'Cut-out components at the proposed prototype sizes. Print at 100% scale; sizes are prototype proposals, not manufacturing specifications.' },
  { id: 'Reference cards', intro: 'One topic per sheet, drawn straight from the rulebook so the numbers never drift.' },
  { id: 'Documents', intro: 'Long-form documents as selectable, searchable vector-text PDFs.' },
];

export default function PrintExportPage() {
  usePageMeta('Print & Export', 'Printable Tax the Richmen boards, tile backs, number tokens, Steel Cards, reference cards, the complete rulebook and a quick-start guide.');
  const current = useMapStore((s) => s.map);
  const classic = useMemo(() => generateClassic('BRASS-0001'), []);
  const printables = useMemo(() => buildPrintables(current, classic), [current, classic]);
  const [preview, setPreview] = useState<Printable | null>(null);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <div className="container-page pb-24 pt-12 md:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-brass-dark" />
          Print &amp; Export
        </p>
        <h1 className="display-lg text-ivory">Bring it to the table.</h1>
        <p className="lede mt-5">
          Twelve printables generated in your browser — boards, cut-out pieces, reference cards and the full rulebook. The four building-cost cards are fixed A4 sheets in that reference group. Nothing is uploaded anywhere. Ready-to-slice STL, 3MF and A4 Steel Card sheets are on the{' '}
          <Link to="/3d-printing" className="text-brass hover:text-brass-light">
            3D printing
          </Link>{' '}
          page.
        </p>
      </header>

      <nav aria-label="Printables" className="mt-8 flex flex-wrap gap-2">
        {printables.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="rounded-sm border border-rivet px-2.5 py-1 text-xs text-muted hover:border-brass-dark hover:text-ivory">
            {p.title}
          </a>
        ))}
      </nav>

      {GROUPS.map((g) => (
        <Fragment key={g.id}>
        <section aria-labelledby={`group-${g.id}`} className="mt-14">
          <div className="max-w-3xl">
            <h2 id={`group-${g.id}`} className="font-display text-2xl font-semibold tracking-[0.04em] text-ivory">
              {g.id}
            </h2>
            <p className="mt-2 text-sm text-muted">{g.intro}</p>
          </div>
          <div className={`mt-6 grid gap-6 ${g.id === 'Boards' ? 'lg:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
            {printables
              .filter((p) => p.group === g.id)
              .map((p) => (
                <PrintableCard key={p.id} p={p} onPreview={() => setPreview(p)} />
              ))}
          </div>
        </section>
        {g.id === 'Reference cards' ? <BuildingCostPanel /> : null}
        </Fragment>
      ))}

      <PreviewDialog p={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
