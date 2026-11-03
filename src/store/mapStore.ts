import { create } from 'zustand';
import type { TerrainType } from '../data/terrain';
import { normalizeSeed, randomSeed } from '../lib/rng';
import { generateClassic } from '../map/classic';
import * as edit from '../map/editing';
import { generateBalanced } from '../map/generator';
import { boardMapSchema } from '../map/schema';
import type { BoardMap, GenerationReport, MapTile } from '../map/types';

export const CURRENT_MAP_KEY = 'ttr.current-map.v1';
const HISTORY_LIMIT = 100;

export type SwapMode = 'tile' | 'number';

export interface MapState {
  map: BoardMap;
  past: BoardMap[];
  future: BoardMap[];
  report: GenerationReport | null;
  selected: number | null;
  swapMode: SwapMode | null;
  swapSource: number | null;
  revealAll: boolean;
  showNumbers: boolean;
  showSlotLabels: boolean;
  highlightIssues: boolean;
  dragEnabled: boolean;

  select: (slot: number | null) => void;
  setView: (patch: Partial<Pick<MapState, 'revealAll' | 'showNumbers' | 'showSlotLabels' | 'highlightIssues' | 'dragEnabled'>>) => void;
  setSwapMode: (mode: SwapMode | null) => void;
  tileActivated: (slot: number) => void;

  newClassic: (seed?: string) => void;
  newBalanced: (seed?: string) => void;
  resetToClassic: () => void;
  regenerateUnlocked: (seed?: string) => void;
  loadMap: (map: BoardMap) => void;
  rename: (name: string) => void;

  setTerrain: (slot: number, terrain: TerrainType) => void;
  setNumber: (slot: number, n: number | null) => void;
  setVariant: (slot: number, v: number) => void;
  swap: (a: number, b: number, mode?: SwapMode) => void;
  toggleLock: (slot: number) => void;
  setAllLocks: (locked: boolean) => void;
  toggleReveal: (slot: number) => void;
  setAllRevealed: (revealed: boolean) => void;
  repairCounts: () => void;
  repairNumbers: () => void;

  undo: () => void;
  redo: () => void;
}

function loadInitial(): BoardMap {
  try {
    const raw = localStorage.getItem(CURRENT_MAP_KEY);
    if (raw) {
      const parsed = boardMapSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data as BoardMap;
    }
  } catch {
    /* fall through to a fresh Classic board */
  }
  return generateClassic('BRASS-0001');
}

export const useMapStore = create<MapState>((set, get) => {
  /** Records the current map in history and applies a new one. */
  const commit = (next: BoardMap, extra: Partial<MapState> = {}) => {
    const { map, past } = get();
    if (next === map) return;
    set({ map: next, past: [...past, map].slice(-HISTORY_LIMIT), future: [], ...extra });
  };
  const editTiles = (fn: (tiles: MapTile[]) => MapTile[]) => {
    const { map } = get();
    const tiles = fn(map.tiles);
    if (tiles === map.tiles) return;
    commit({ ...map, tiles, mode: 'custom' });
  };

  return {
    map: loadInitial(),
    past: [],
    future: [],
    report: null,
    selected: null,
    swapMode: null,
    swapSource: null,
    revealAll: false,
    showNumbers: true,
    showSlotLabels: false,
    highlightIssues: true,
    dragEnabled: true,

    select: (slot) => set({ selected: slot }),
    setView: (patch) => set(patch),
    setSwapMode: (mode) => set({ swapMode: mode, swapSource: null }),
    tileActivated: (slot) => {
      const { swapMode, swapSource } = get();
      if (swapMode) {
        if (swapSource == null) set({ swapSource: slot, selected: slot });
        else if (swapSource === slot) set({ swapSource: null });
        else {
          get().swap(swapSource, slot, swapMode);
          set({ swapSource: null, selected: slot });
        }
        return;
      }
      set({ selected: get().selected === slot ? null : slot });
    },

    newClassic: (seed) => {
      const s = normalizeSeed(seed ?? randomSeed());
      commit(generateClassic(s), { report: null, selected: null, swapSource: null });
    },
    newBalanced: (seed) => {
      const s = normalizeSeed(seed ?? randomSeed());
      const result = generateBalanced(s);
      commit(result.map, { report: result.report, selected: null, swapSource: null });
    },
    resetToClassic: () => commit(generateClassic('BRASS-0001'), { report: null, selected: null, swapSource: null }),
    regenerateUnlocked: (seed) => {
      const { map } = get();
      const s = normalizeSeed(seed ?? randomSeed());
      const locked = map.tiles.filter((t) => t.locked);
      const result = generateBalanced(s, { locked });
      commit({ ...result.map, mode: locked.length ? 'custom' : 'balanced', name: map.name }, { report: result.report });
    },
    loadMap: (m) => commit({ ...m, tiles: [...m.tiles].sort((a, b) => a.slot - b.slot) }, { report: null, selected: null, swapSource: null }),
    rename: (name) => {
      const { map } = get();
      set({ map: { ...map, name: name.slice(0, 80) } });
    },

    setTerrain: (slot, terrain) => editTiles((t) => edit.setTerrain(t, slot, terrain)),
    setNumber: (slot, n) => editTiles((t) => edit.setNumber(t, slot, n)),
    setVariant: (slot, v) => editTiles((t) => edit.setVariant(t, slot, v)),
    swap: (a, b, mode = 'tile') => editTiles((t) => (mode === 'number' ? edit.swapNumbers(t, a, b) : edit.swapTiles(t, a, b))),
    toggleLock: (slot) => {
      const { map } = get();
      commit({ ...map, tiles: edit.toggleLock(map.tiles, slot) });
    },
    setAllLocks: (locked) => {
      const { map } = get();
      commit({ ...map, tiles: edit.setAllLocks(map.tiles, locked) });
    },
    toggleReveal: (slot) => {
      const { map } = get();
      commit({ ...map, tiles: edit.toggleReveal(map.tiles, slot) });
    },
    setAllRevealed: (revealed) => {
      const { map } = get();
      commit({ ...map, tiles: edit.setAllRevealed(map.tiles, revealed) });
    },
    repairCounts: () => editTiles((t) => edit.repairCounts(t, `${get().map.seed}:${get().past.length}`)),
    repairNumbers: () => editTiles((t) => edit.repairNumbers(t, `${get().map.seed}:${get().past.length}`)),

    undo: () => {
      const { past, map, future } = get();
      if (!past.length) return;
      set({ map: past[past.length - 1], past: past.slice(0, -1), future: [map, ...future], swapSource: null });
    },
    redo: () => {
      const { past, map, future } = get();
      if (!future.length) return;
      set({ map: future[0], past: [...past, map], future: future.slice(1), swapSource: null });
    },
  };
});

useMapStore.subscribe((state, prev) => {
  if (state.map !== prev.map) {
    try {
      localStorage.setItem(CURRENT_MAP_KEY, JSON.stringify(state.map));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }
});
