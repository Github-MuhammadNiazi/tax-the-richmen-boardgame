import { Dices, Eye, Grid3x3, Hash, Highlighter, Move, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import type { HighlightTone } from '../components/board/BoardArt';
import { BoardViewport } from '../components/map/BoardViewport';
import { EditorPanel } from '../components/map/EditorPanel';
import { SavePanel } from '../components/map/SavePanel';
import { ScoreSummary, ValidationPanel } from '../components/map/ValidationPanel';
import { normalizeSeed, randomSeed } from '../lib/rng';
import { usePageMeta } from '../lib/usePageMeta';
import { analyzeMap } from '../map/analysis';
import { decodeMap } from '../map/share';
import { useMapStore } from '../store/mapStore';

type Tab = 'validate' | 'edit' | 'save';
const TABS: { id: Tab; label: string }[] = [
  { id: 'validate', label: 'Validation' },
  { id: 'edit', label: 'Editor' },
  { id: 'save', label: 'Save & export' },
];

function Toggle({ pressed, onClick, children, label }: { pressed: boolean; onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm" aria-pressed={pressed} onClick={onClick} title={label}>
      {children}
    </button>
  );
}

export default function MapGeneratorPage() {
  usePageMeta('Map Generator', 'Generate, validate, edit and export Tax the Richmen boards: the Classic layout, balanced seeded random maps and fully custom designs.');
  const map = useMapStore((s) => s.map);
  const report = useMapStore((s) => s.report);
  const canUndo = useMapStore((s) => s.past.length > 0);
  const canRedo = useMapStore((s) => s.future.length > 0);
  const view = useMapStore(
    useShallow((s) => ({ revealAll: s.revealAll, showNumbers: s.showNumbers, showSlotLabels: s.showSlotLabels, highlightIssues: s.highlightIssues, dragEnabled: s.dragEnabled })),
  );
  const selected = useMapStore((s) => s.selected);
  const actions = useMapStore.getState();
  const [params, setParams] = useSearchParams();
  const [seed, setSeed] = useState(map.seed);
  const [tab, setTab] = useState<Tab>('validate');
  const [focusCheck, setFocusCheck] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const loadedFromUrl = useRef(false);

  useEffect(() => setSeed(map.seed), [map.seed]);

  useEffect(() => {
    if (loadedFromUrl.current) return;
    loadedFromUrl.current = true;
    const code = params.get('map');
    const mode = params.get('mode');
    const s = params.get('seed');
    if (code) {
      const decoded = decodeMap(code);
      if (decoded) {
        actions.loadMap(decoded);
        setNotice(`Loaded the shared board “${decoded.name}”.`);
      } else setNotice('The shared board link is damaged or from an incompatible version, so your current board is shown.');
    } else if (s && (mode === 'classic' || mode === 'balanced')) {
      if (mode === 'classic') actions.newClassic(s);
      else actions.newBalanced(s);
      setNotice(`Generated the ${mode === 'classic' ? 'Classic' : 'Balanced Random'} board for seed ${normalizeSeed(s)}.`);
    }
    if (code || s || mode) setParams({}, { replace: true });
  }, [params, setParams, actions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        actions.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions]);

  useEffect(() => {
    if (selected != null && tab === 'validate') setTab('edit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const analysis = useMemo(() => analyzeMap(map.tiles), [map.tiles]);
  useEffect(() => {
    if (focusCheck && !analysis.checks.some((c) => c.id === focusCheck && c.slots?.length)) setFocusCheck(null);
  }, [analysis, focusCheck]);

  const highlights = useMemo(() => {
    const m = new Map<number, HighlightTone>();
    if (focusCheck) {
      for (const s of analysis.checks.find((c) => c.id === focusCheck)?.slots ?? []) m.set(s, 'focus');
      return m;
    }
    if (!view.highlightIssues) return m;
    for (const c of analysis.warnings) for (const s of c.slots ?? []) m.set(s, 'warning');
    for (const c of analysis.errors) for (const s of c.slots ?? []) m.set(s, 'error');
    return m;
  }, [analysis, focusCheck, view.highlightIssues]);

  const generate = (mode: 'classic' | 'balanced', s = seed) => {
    const clean = normalizeSeed(s);
    if (mode === 'classic') actions.newClassic(clean);
    else actions.newBalanced(clean);
    setFocusCheck(null);
    setNotice(null);
  };
  const currentMode = map.mode;
  const onSeedSubmit = (e: FormEvent) => {
    e.preventDefault();
    generate(currentMode === 'classic' ? 'classic' : 'balanced');
  };

  return (
    <div className="container-page pb-24 pt-10 md:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-brass-dark" />
            Map generator
          </p>
          <h1 className="display-md text-ivory">Every map tells a different story.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Start from the approved Classic layout, generate a seeded Balanced Random board, or edit any hex. Every board is validated live against the frozen component counts.
          </p>
        </div>
        <div className="hidden md:block">
          <ScoreSummary analysis={analysis} />
        </div>
      </header>

      {notice && (
        <p className="mt-6 rounded-md border border-brass-dark/70 bg-brass/10 px-4 py-2.5 text-sm text-parchment" role="status">
          {notice}
        </p>
      )}

      <div className="mt-6 space-y-3 rounded-md border border-rivet bg-ink-2 p-3" role="toolbar" aria-label="Board generation">
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Generation mode" className="flex rounded-md border border-rivet bg-ink p-0.5">
            {(
              [
                ['classic', 'Classic'],
                ['balanced', 'Balanced Random'],
                ['custom', 'Custom'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={currentMode === id}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${currentMode === id ? 'bg-brass text-ink' : 'text-muted hover:text-ivory'}`}
                onClick={() => (id === 'custom' ? setTab('edit') : generate(id))}
                title={id === 'custom' ? 'Any edit switches the board to Custom. Opens the editor.' : undefined}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={onSeedSubmit} className="flex items-center gap-1.5">
            <label htmlFor="seed" className="text-xs uppercase tracking-wider text-dim">
              Seed
            </label>
            <input id="seed" className="field h-9 min-h-0 w-40 py-1 font-mono text-sm uppercase" value={seed} onChange={(e) => setSeed(e.target.value)} maxLength={40} spellCheck={false} autoComplete="off" />
            <button type="submit" className="btn btn-secondary btn-sm">
              Generate
            </button>
          </form>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const s = randomSeed();
              setSeed(s);
              generate(currentMode === 'classic' ? 'classic' : 'balanced', s);
            }}
          >
            <Dices size={14} aria-hidden /> Regenerate
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => (actions.resetToClassic(), setFocusCheck(null))}>
            <RotateCcw size={14} aria-hidden /> Reset to Classic
          </button>
          <span className="mx-1 hidden h-6 w-px bg-rivet sm:block" aria-hidden />
          <button type="button" className="btn btn-ghost btn-sm" onClick={actions.undo} disabled={!canUndo} aria-keyshortcuts="Control+Z" title="Undo (Ctrl+Z)">
            <Undo2 size={14} aria-hidden /> Undo
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={actions.redo} disabled={!canRedo} aria-keyshortcuts="Control+Shift+Z" title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={14} aria-hidden /> Redo
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-rivet pt-3" role="group" aria-label="View options">
          <Toggle pressed={view.revealAll} onClick={() => actions.setView({ revealAll: !view.revealAll })} label="Show concealed Mine and Mountain tiles face-up">
            <Eye size={14} aria-hidden /> Show hidden tiles
          </Toggle>
          <Toggle pressed={view.showNumbers} onClick={() => actions.setView({ showNumbers: !view.showNumbers })} label="Show number tokens">
            <Hash size={14} aria-hidden /> Numbers
          </Toggle>
          <Toggle pressed={view.showSlotLabels} onClick={() => actions.setView({ showSlotLabels: !view.showSlotLabels })} label="Show hex position labels">
            <Grid3x3 size={14} aria-hidden /> Hex labels
          </Toggle>
          <Toggle pressed={view.highlightIssues} onClick={() => actions.setView({ highlightIssues: !view.highlightIssues })} label="Highlight hexes with errors or warnings">
            <Highlighter size={14} aria-hidden /> Highlight issues
          </Toggle>
          <Toggle pressed={view.dragEnabled} onClick={() => actions.setView({ dragEnabled: !view.dragEnabled })} label="Drag a tile onto another to swap them">
            <Move size={14} aria-hidden /> Drag to swap
          </Toggle>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <BoardViewport highlights={highlights} checks={analysis.checks} />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted" aria-label="Legend">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-[#d0574e] bg-[#d0574e]/20" /> Hard error
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-dashed border-[#e0a43c]" /> Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-brass" /> Inspected check
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-dashed border-[#8fc79b]" /> Swap source
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-brass bg-ink" /> Locked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#2a3a42] ring-1 ring-brass" /> Port number (Steel)
            </span>
          </div>
          <p className="mt-2 text-xs text-dim">
            Drag tiles to swap · scroll or pinch to zoom · drag the background to pan when zoomed · arrow keys move between hexes · Ctrl+Z / Ctrl+Shift+Z undo and redo.
          </p>
        </div>

        <aside aria-label="Board tools" className="min-w-0">
          <div role="tablist" aria-label="Board tools" className="flex rounded-md border border-rivet bg-ink-2 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => {
                  const i = TABS.findIndex((x) => x.id === tab);
                  const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i + TABS.length - 1) % TABS.length : -1;
                  if (next >= 0) {
                    setTab(TABS[next].id);
                    document.getElementById(`tab-${TABS[next].id}`)?.focus();
                  }
                }}
                className={`flex-1 rounded-[3px] px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === t.id ? 'bg-steel text-ivory' : 'text-muted hover:text-parchment'}`}
              >
                {t.label}
                {t.id === 'validate' && analysis.errors.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-ember px-1.5 text-[0.6rem] text-ivory" aria-label={`${analysis.errors.length} errors`}>
                    {analysis.errors.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-4">
            {tab === 'validate' && <ValidationPanel analysis={analysis} tiles={map.tiles} report={report} focusCheck={focusCheck} onFocusCheck={setFocusCheck} />}
            {tab === 'edit' && <EditorPanel />}
            {tab === 'save' && <SavePanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
