import { Copy, Download, FileImage, FileJson, FileText, FolderOpen, Link2, Printer, Save, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { downloadText, slugify } from '../../export/download';
import { parseMapJson, serializeMap } from '../../map/schema';
import { seedUrl, shareUrl } from '../../map/share';
import { deleteSavedMap, listSavedMaps, saveMap, type SavedMap } from '../../map/storage';
import { useMapStore } from '../../store/mapStore';

type Status = { tone: 'ok' | 'error' | 'busy'; text: string } | null;

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SavePanel() {
  const map = useMapStore((s) => s.map);
  const revealAll = useMapStore((s) => s.revealAll);
  const showNumbers = useMapStore((s) => s.showNumbers);
  const rename = useMapStore((s) => s.rename);
  const loadMap = useMapStore((s) => s.loadMap);
  const [saved, setSaved] = useState<SavedMap[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [link, setLink] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setSaved(listSavedMaps()), []);

  const say = (tone: NonNullable<Status>['tone'], text: string) => setStatus({ tone, text });

  const onSave = () => {
    try {
      saveMap(map.name, map);
      setSaved(listSavedMaps());
      say('ok', `Saved “${map.name}” in this browser.`);
    } catch {
      say('error', 'Saving failed — browser storage may be full or disabled.');
    }
  };

  const onDelete = (id: string) => {
    deleteSavedMap(id);
    setSaved(listSavedMaps());
    setConfirmId(null);
    say('ok', 'Saved board deleted.');
  };

  const onShare = async (kind: 'map' | 'seed') => {
    const url = kind === 'map' ? shareUrl(map) : seedUrl(map.mode === 'balanced' ? 'balanced' : 'classic', map.seed);
    setLink(url);
    say('ok', (await copy(url)) ? 'Link copied to the clipboard.' : 'Copy the link below.');
  };

  const onImport = async (file: File) => {
    setImportErrors([]);
    if (file.size > 200_000) {
      setImportErrors(['That file is too large to be a board export.']);
      return;
    }
    const result = parseMapJson(await file.text());
    if (!result.ok) {
      setImportErrors(result.errors);
      say('error', 'Import failed. Nothing was changed.');
      return;
    }
    loadMap(result.map);
    say('ok', `Imported “${result.map.name}”. Use Undo to return to the previous board.`);
  };

  const run = async (label: string, job: () => Promise<unknown>) => {
    say('busy', `Preparing ${label}…`);
    try {
      await job();
      say('ok', `${label} ready.`);
    } catch (err) {
      say('error', `${label} failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  };
  const opts = { revealAll, showNumbers };
  const board = () => import('../../export/board');

  return (
    <div className="space-y-6">
      <section aria-labelledby="name-title" className="plate-flat space-y-3 p-4">
        <h3 id="name-title" className="label">
          Board name
        </h3>
        <label htmlFor="map-name" className="sr-only">
          Board name
        </label>
        <input id="map-name" className="field" value={map.name} maxLength={80} onChange={(e) => rename(e.target.value)} onBlur={(e) => !e.target.value.trim() && rename('Untitled Board')} />
        <button type="button" className="btn btn-primary btn-sm w-full" onClick={onSave}>
          <Save size={14} aria-hidden /> Save to this browser
        </button>
      </section>

      <section aria-labelledby="saved-title" className="plate-flat p-4">
        <h3 id="saved-title" className="label">
          Saved boards ({saved.length})
        </h3>
        {saved.length === 0 ? (
          <p className="text-sm text-muted">Nothing saved yet. Boards are stored only in this browser.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {saved.map((s) => (
              <li key={s.id} className="rounded-md border border-rivet bg-coal/60 p-3">
                <p className="truncate text-sm font-semibold text-ivory">{s.name}</p>
                <p className="text-xs text-dim">
                  {s.map.mode} · {s.map.seed} · {new Date(s.savedAt).toLocaleString()}
                </p>
                {confirmId === s.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2" role="alertdialog" aria-label={`Delete ${s.name}?`}>
                    <span className="text-xs text-ember-light">Delete this board permanently?</span>
                    <button type="button" className="btn btn-sm border-ember/70 bg-ember/20 text-ivory" onClick={() => onDelete(s.id)}>
                      Delete
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)} autoFocus>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        loadMap(s.map);
                        say('ok', `Loaded “${s.name}”.`);
                      }}
                    >
                      <FolderOpen size={14} aria-hidden /> Load
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Delete ${s.name}`} onClick={() => setConfirmId(s.id)}>
                      <Trash2 size={14} aria-hidden /> Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="share-title" className="plate-flat space-y-3 p-4">
        <h3 id="share-title" className="label">
          Share
        </h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onShare('map')}>
            <Link2 size={14} aria-hidden /> Copy board link
          </button>
          {map.mode !== 'custom' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onShare('seed')}>
              <Copy size={14} aria-hidden /> Copy seed link
            </button>
          )}
        </div>
        {link && (
          <>
            <label htmlFor="share-link" className="sr-only">
              Share link
            </label>
            <input id="share-link" className="field font-mono text-xs" readOnly value={link} onFocus={(e) => e.target.select()} />
          </>
        )}
        <p className="text-xs text-dim">Board links encode every tile, number and lock. Seed links regenerate the same board from its seed.</p>
      </section>

      <section aria-labelledby="export-title" className="plate-flat space-y-3 p-4">
        <h3 id="export-title" className="label">
          Export
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => run('PNG image', async () => (await board()).exportBoardPng(map, opts))}>
            <FileImage size={14} aria-hidden /> PNG
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => run('SVG file', async () => (await board()).exportBoardSvg(map, opts))}>
            <Download size={14} aria-hidden /> SVG
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => run('PDF', async () => (await board()).exportBoardPdf(map, opts))}>
            <FileText size={14} aria-hidden /> PDF
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => run('Print preview', async () => (await board()).printBoard(map, opts))}>
            <Printer size={14} aria-hidden /> Print
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => (downloadText(serializeMap(map), `${slugify(map.name)}-${map.seed}.json`), say('ok', 'JSON exported.'))}>
            <FileJson size={14} aria-hidden /> Export JSON
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} aria-hidden /> Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Import board JSON file"
          data-testid="import-json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
        <p className="text-xs text-dim">Exports use the current view: {revealAll ? 'concealed tiles shown face-up' : 'concealed tiles face-down'}, numbers {showNumbers ? 'shown' : 'hidden'}.</p>
        {importErrors.length > 0 && (
          <ul className="space-y-1 rounded-md border border-ember/60 bg-ember/10 p-3 text-xs text-ember-light" role="alert">
            {importErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </section>

      <p
        className={`min-h-5 text-sm ${status?.tone === 'error' ? 'text-ember-light' : status?.tone === 'busy' ? 'text-muted' : 'text-verdigris'}`}
        role="status"
        aria-live="polite"
      >
        {status?.text}
      </p>
    </div>
  );
}
