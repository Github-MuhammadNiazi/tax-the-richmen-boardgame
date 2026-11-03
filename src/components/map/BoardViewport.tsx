import { Lock, Maximize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { diceProbability } from '../../data/numbers';
import { TERRAIN } from '../../data/terrain';
import type { Check } from '../../map/analysis';
import { NEIGHBORS, boardLayout, hexPath } from '../../map/geometry';
import type { MapTile } from '../../map/types';
import { useMapStore } from '../../store/mapStore';
import { BoardArt, type HighlightTone } from '../board/BoardArt';
import { TileFace } from '../board/TileArt';

const PREFIX = 'gen';
const R = 100;
const LAYOUT = boardLayout(R, 24);
const MIN_K = 1;
const MAX_K = 3.2;
const DRAG_THRESHOLD = 6;

interface View {
  k: number;
  x: number;
  y: number;
}

interface Gesture {
  id: number;
  slot: number | null;
  startX: number;
  startY: number;
  start: View;
  mode: 'pending' | 'pan' | 'tile';
}

function clampView(v: View): View {
  const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
  const minX = LAYOUT.width * (1 - k);
  const minY = LAYOUT.height * (1 - k);
  return { k, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
}

export function isFaceDown(t: MapTile, revealAll: boolean) {
  return TERRAIN[t.terrain].concealed && !t.revealed && !revealAll;
}

export function describeTile(t: MapTile, revealAll: boolean): string {
  const faceDown = isFaceDown(t, revealAll);
  const parts = [`Hex ${t.slot + 1}`, faceDown ? 'concealed tile' : TERRAIN[t.terrain].label];
  if (!faceDown && t.number != null) parts.push(`number ${t.number}`);
  if (TERRAIN[t.terrain].concealed && !faceDown) parts.push('normally face-down');
  if (t.locked) parts.push('locked');
  return parts.join(', ');
}

/** Direction-aware neighbour lookup for arrow-key navigation across the hex grid. */
function neighborInDirection(slot: number, key: string): number | null {
  const angle = { ArrowRight: 0, ArrowDown: 90, ArrowLeft: 180, ArrowUp: -90 }[key];
  if (angle === undefined) return null;
  const from = LAYOUT.centers[slot];
  let best: number | null = null;
  let bestDiff = 61;
  for (const n of NEIGHBORS[slot]) {
    const to = LAYOUT.centers[n];
    const a = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    let diff = Math.abs(a - angle);
    if (diff > 180) diff = 360 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = n;
    }
  }
  return best;
}

export function BoardViewport({ highlights, checks }: { highlights: Map<number, HighlightTone>; checks: Check[] }) {
  const tiles = useMapStore((s) => s.map.tiles);
  const selected = useMapStore((s) => s.selected);
  const swapSource = useMapStore((s) => s.swapSource);
  const swapMode = useMapStore((s) => s.swapMode);
  const revealAll = useMapStore((s) => s.revealAll);
  const showNumbers = useMapStore((s) => s.showNumbers);
  const showSlotLabels = useMapStore((s) => s.showSlotLabels);
  const dragEnabled = useMapStore((s) => s.dragEnabled);
  const tileActivated = useMapStore((s) => s.tileActivated);
  const swap = useMapStore((s) => s.swap);
  const toggleLock = useMapStore((s) => s.toggleLock);
  const toggleReveal = useMapStore((s) => s.toggleReveal);
  const select = useMapStore((s) => s.select);
  const setSwapMode = useMapStore((s) => s.setSwapMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [hovered, setHovered] = useState<number | null>(null);
  const [focusSlot, setFocusSlot] = useState(0);
  const [focusWithin, setFocusWithin] = useState(false);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; over: number | null } | null>(null);
  const [width, setWidth] = useState(0);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; start: View } | null>(null);

  const bySlot = useMemo(() => new Map(tiles.map((t) => [t.slot, t])), [tiles]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Client point → viewBox coordinates. */
  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const toBoard = useCallback(
    (clientX: number, clientY: number) => {
      const p = toViewBox(clientX, clientY);
      const v = viewRef.current;
      return { x: (p.x - v.x) / v.k, y: (p.y - v.y) / v.k };
    },
    [toViewBox],
  );

  const slotAtPoint = (bx: number, by: number): number | null => {
    let best: number | null = null;
    let bestD = R * 0.9;
    LAYOUT.centers.forEach((c, i) => {
      const d = Math.hypot(c.x - bx, c.y - by);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const zoomAt = useCallback((factor: number, at?: { x: number; y: number }) => {
    setView((v) => {
      const p = at ?? { x: LAYOUT.width / 2, y: LAYOUT.height / 2 };
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      const ratio = k / v.k;
      return clampView({ k, x: p.x - (p.x - v.x) * ratio, y: p.y - (p.y - v.y) * ratio });
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * 0.0015), toViewBox(e.clientX, e.clientY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt, toViewBox]);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointers cannot be captured */
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: toViewBox((a.x + b.x) / 2, (a.y + b.y) / 2), start: viewRef.current };
      gesture.current = null;
      setDrag(null);
      return;
    }
    const slotAttr = (e.target as Element).closest('[data-slot]')?.getAttribute('data-slot');
    gesture.current = { id: e.pointerId, slot: slotAttr != null ? Number(slotAttr) : null, startX: e.clientX, startY: e.clientY, start: viewRef.current, mode: 'pending' };
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const { start, mid } = pinch.current;
      const k = Math.min(MAX_K, Math.max(MIN_K, start.k * (dist / pinch.current.dist)));
      const ratio = k / start.k;
      setView(clampView({ k, x: mid.x - (mid.x - start.x) * ratio, y: mid.y - (mid.y - start.y) * ratio }));
      return;
    }
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) {
      if (e.pointerType === 'mouse') {
        const b = toBoard(e.clientX, e.clientY);
        const s = slotAtPoint(b.x, b.y);
        if (s !== hovered) setHovered(s);
      }
      return;
    }
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (g.mode === 'pending') {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      const tile = g.slot != null ? bySlot.get(g.slot) : undefined;
      g.mode = tile && dragEnabled && !tile.locked && !swapMode ? 'tile' : 'pan';
    }
    if (g.mode === 'pan') {
      const svg = svgRef.current;
      const scale = svg ? LAYOUT.width / svg.getBoundingClientRect().width : 1;
      setView(clampView({ ...g.start, x: g.start.x + dx * scale, y: g.start.y + dy * scale }));
    } else {
      const b = toBoard(e.clientX, e.clientY);
      const over = slotAtPoint(b.x, b.y);
      const target = over != null && over !== g.slot && !bySlot.get(over)?.locked ? over : null;
      setDrag({ from: g.slot!, x: b.x, y: b.y, over: target });
    }
  };

  const endPointer = (e: ReactPointerEvent<SVGSVGElement>, cancelled = false) => {
    pointers.current.delete(e.pointerId);
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null;
      return;
    }
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.id !== e.pointerId || cancelled) {
      setDrag(null);
      return;
    }
    if (g.mode === 'pending' && g.slot != null) {
      setFocusSlot(g.slot);
      tileActivated(g.slot);
    } else if (g.mode === 'tile' && drag?.over != null) {
      swap(drag.from, drag.over, 'tile');
      select(drag.over);
      setFocusSlot(drag.over);
    }
    setDrag(null);
  };

  const focusTile = (slot: number) => {
    setFocusSlot(slot);
    requestAnimationFrame(() => svgRef.current?.querySelector<SVGGElement>(`[data-slot="${slot}"]`)?.focus());
  };

  const onTileKeyDown = (slot: number, e: KeyboardEvent<SVGGElement>) => {
    const next = neighborInDirection(slot, e.key);
    if (next != null) {
      e.preventDefault();
      focusTile(next);
      return;
    }
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        tileActivated(slot);
        break;
      case 'l':
      case 'L':
        e.preventDefault();
        toggleLock(slot);
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        toggleReveal(slot);
        break;
      case 'Escape':
        if (swapMode) setSwapMode(null);
        else select(null);
        break;
      case 'Home':
        e.preventDefault();
        focusTile(0);
        break;
      case 'End':
        e.preventDefault();
        focusTile(tiles.length - 1);
        break;
    }
  };

  useEffect(() => {
    if (selected != null) setFocusSlot(selected);
  }, [selected]);

  const tipSlot = drag ? null : hovered ?? (focusWithin ? focusSlot : null);
  const tipTile = tipSlot != null ? bySlot.get(tipSlot) : undefined;
  const pxPerUnit = width / LAYOUT.width;
  const tipPos = tipSlot != null ? { left: (view.x + LAYOUT.centers[tipSlot].x * view.k) * pxPerUnit, top: (view.y + (LAYOUT.centers[tipSlot].y - R * 0.86) * view.k) * pxPerUnit } : null;
  const tipIssues = tipSlot != null ? checks.filter((c) => c.severity !== 'pass' && c.slots?.includes(tipSlot)) : [];
  const dragTile = drag ? bySlot.get(drag.from) : undefined;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative touch-none overflow-hidden rounded-md border border-rivet walnut"
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
          className={`block h-auto w-full select-none ${drag ? 'cursor-grabbing' : view.k > 1 ? 'cursor-grab' : ''}`}
          role="application"
          aria-label="Interactive board editor. Use arrow keys to move between hexes, Enter to select, L to lock, H to reveal or hide."
          aria-roledescription="hex board"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endPointer(e)}
          onPointerCancel={(e) => endPointer(e, true)}
          onFocus={() => setFocusWithin(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false);
          }}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <BoardArt
              tiles={tiles}
              prefix={PREFIX}
              radius={R}
              revealAll={revealAll}
              showNumbers={showNumbers}
              showSlotLabels={showSlotLabels}
              selected={selected}
              hovered={hovered}
              swapSource={swapSource}
              dropTarget={drag?.over ?? null}
              highlights={highlights}
              dim={drag ? new Set([drag.from]) : undefined}
              asGroup
              interaction={{
                focusSlot,
                onTileKeyDown,
                onTileFocus: (s) => setFocusSlot(s),
                describe: (t) => describeTile(t, revealAll),
              }}
            >
              {tiles
                .filter((t) => t.locked)
                .map((t) => {
                  const c = LAYOUT.centers[t.slot];
                  return (
                    <g key={`lock${t.slot}`} transform={`translate(${c.x + R * 0.36} ${c.y - R * 0.62})`} pointerEvents="none">
                      <circle r={R * 0.15} fill="#151b1d" stroke="#d6ac65" strokeWidth={R * 0.02} />
                      <rect x={-R * 0.065} y={-R * 0.02} width={R * 0.13} height={R * 0.1} rx={R * 0.015} fill="#d6ac65" />
                      <path d={`M${-R * 0.04},${-R * 0.02} v${-R * 0.035} a${R * 0.04},${R * 0.04} 0 0 1 ${R * 0.08},0 v${R * 0.035}`} fill="none" stroke="#d6ac65" strokeWidth={R * 0.018} />
                    </g>
                  );
                })}
              {drag && dragTile && (
                <g pointerEvents="none" opacity={0.9}>
                  <TileFace prefix={PREFIX} cx={drag.x} cy={drag.y} radius={R * 0.9} terrain={dragTile.terrain} variant={dragTile.variant} concealed={isFaceDown(dragTile, revealAll)} />
                  <path d={hexPath(drag.x, drag.y, R * 0.87)} fill="none" stroke="#f0d49c" strokeWidth={R * 0.04} />
                </g>
              )}
            </BoardArt>
          </g>
        </svg>

        <div className="absolute right-3 top-3 flex flex-col gap-1.5" role="group" aria-label="Zoom">
          <button type="button" className="btn btn-ghost btn-sm h-8 w-8 bg-ink/80 p-0" aria-label="Zoom in" onClick={() => zoomAt(1.3)}>
            <Plus size={15} aria-hidden />
          </button>
          <button type="button" className="btn btn-ghost btn-sm h-8 w-8 bg-ink/80 p-0" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.3)}>
            <Minus size={15} aria-hidden />
          </button>
          <button type="button" className="btn btn-ghost btn-sm h-8 w-8 bg-ink/80 p-0" aria-label="Fit board" onClick={() => setView({ k: 1, x: 0, y: 0 })}>
            <Maximize2 size={14} aria-hidden />
          </button>
        </div>
        {view.k > 1 && (
          <p className="pointer-events-none absolute bottom-3 right-3 rounded-sm bg-ink/80 px-2 py-1 text-xs tabular-nums text-muted">{Math.round(view.k * 100)}%</p>
        )}

        {tipTile && tipPos && width > 0 && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 w-max max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-md border border-brass-dark bg-ink/95 px-3 py-2 text-xs shadow-lift"
            style={{ left: Math.min(Math.max(tipPos.left, 80), width - 80), top: Math.max(tipPos.top - 6, 70) }}
          >
            <TileTip tile={tipTile} revealAll={revealAll} issues={tipIssues} />
          </div>
        )}
      </div>
      {swapMode && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-verdigris/60 bg-verdigris/10 px-4 py-2.5 text-sm text-parchment" role="status">
          <span>
            {swapSource == null
              ? `Swap ${swapMode === 'tile' ? 'tiles' : 'numbers'}: select the first hex.`
              : `Swap ${swapMode === 'tile' ? 'tile' : 'number'} on hex ${swapSource + 1} — now select the second hex.`}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSwapMode(null)}>
            Cancel swap
          </button>
        </div>
      )}
    </div>
  );
}

function TileTip({ tile, revealAll, issues }: { tile: MapTile; revealAll: boolean; issues: Check[] }) {
  const faceDown = isFaceDown(tile, revealAll);
  const def = TERRAIN[tile.terrain];
  return (
    <>
      <p className="font-display text-sm text-ivory">
        Hex {tile.slot + 1} · {faceDown ? 'Concealed tile' : def.label}
        {tile.locked && <Lock size={11} className="ml-1.5 inline text-brass" aria-label="locked" />}
      </p>
      {!faceDown && <p className="text-muted">{def.variants[tile.variant % def.variants.length]?.name}</p>}
      {!faceDown && tile.number != null && (
        <p className="mt-0.5 text-parchment">
          Number {tile.number} · {(diceProbability(tile.number) * 100).toFixed(1)}% per roll
        </p>
      )}
      {faceDown && <p className="text-muted">Mine or Mountain — revealed during play.</p>}
      {issues.slice(0, 3).map((c) => (
        <p key={c.id} className={`mt-1 ${c.severity === 'error' ? 'text-ember-light' : 'text-[#e0a43c]'}`}>
          {c.label}
        </p>
      ))}
    </>
  );
}
