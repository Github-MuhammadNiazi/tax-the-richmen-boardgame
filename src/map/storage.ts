import { boardMapSchema } from './schema';
import type { BoardMap } from './types';

export const SAVED_MAPS_KEY = 'ttr.saved-maps.v1';

export interface SavedMap {
  id: string;
  name: string;
  savedAt: string;
  map: BoardMap;
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function listSavedMaps(): SavedMap[] {
  const raw = safeStorage()?.getItem(SAVED_MAPS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as SavedMap[];
    return arr.filter((s) => s && typeof s.id === 'string' && boardMapSchema.safeParse(s.map).success);
  } catch {
    return [];
  }
}

function write(list: SavedMap[]) {
  safeStorage()?.setItem(SAVED_MAPS_KEY, JSON.stringify(list));
}

export function saveMap(name: string, map: BoardMap): SavedMap {
  const entry: SavedMap = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim().slice(0, 80) || 'Untitled Board',
    savedAt: new Date().toISOString(),
    map: { ...map, name: name.trim().slice(0, 80) || map.name },
  };
  write([entry, ...listSavedMaps()].slice(0, 50));
  return entry;
}

export function deleteSavedMap(id: string): void {
  write(listSavedMaps().filter((s) => s.id !== id));
}
