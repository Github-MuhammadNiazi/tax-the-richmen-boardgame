import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { SAVED_MAPS_KEY } from '../map/storage';
import { useMapStore } from '../store/mapStore';

function renderApp(path = '/') {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return { user, ...utils };
}

const board = () => screen.getByRole('application');
const tile = (slot: number) => board().querySelector(`[data-slot="${slot}"]`)!;
const clickTile = (slot: number) => {
  fireEvent.pointerDown(tile(slot), { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(tile(slot), { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
};

beforeEach(() => {
  act(() => {
    useMapStore.getState().newClassic('BRASS-0001');
    useMapStore.setState({ past: [], future: [], selected: null, swapMode: null, swapSource: null, revealAll: false });
  });
});

describe('site navigation', () => {
  it('renders the homepage and navigates to every route from the header', async () => {
    const { user } = renderApp('/');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const primary = screen.getByRole('navigation', { name: 'Primary' });
    const routes: [string, RegExp][] = [
      ['How to Play', /fourteen steps/i],
      ['Rulebook', /complete rules/i],
      ['Map Generator', /every map tells/i],
      ['Components', /built to be held/i],
      ['Print & Export', /bring it to the table/i],
      ['3D Printing', /print the pieces/i],
    ];
    for (const [link, heading] of routes) {
      await user.click(within(primary).getByRole('link', { name: link }));
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      expect(within(primary).getByRole('link', { name: link })).toHaveAttribute('aria-current', 'page');
    }
  });

  it('opens and closes the mobile menu', async () => {
    const { user } = renderApp('/');
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(within(screen.getByRole('navigation', { name: 'Mobile' })).getByRole('link', { name: /Rulebook/ }));
    expect(await screen.findByLabelText('Search the rules')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows a not-found page for unknown routes', async () => {
    renderApp('/no-such-page');
    expect(await screen.findByRole('heading', { level: 1, name: /leads into the sea/i })).toBeInTheDocument();
  });
});

describe('rulebook', () => {
  it('filters rules by search and highlights matches', async () => {
    const { user } = renderApp('/rulebook');
    const search = await screen.findByLabelText('Search the rules');
    await user.type(search, 'vault');
    await waitFor(() => expect(document.querySelectorAll('main mark').length).toBeGreaterThan(0));
    expect(screen.getByRole('heading', { level: 3, name: 'Steel Vault' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Starting order' })).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'zzqx');
    expect(await screen.findByText(/No rules match/)).toBeInTheDocument();
  });

  it('switches to the printer-friendly view and lists playtest clarifications', async () => {
    const { user } = renderApp('/rulebook');
    const toggle = await screen.findByRole('button', { name: /Printer-friendly/ });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.paper-view')).not.toBeNull();
    expect(document.querySelectorAll('[data-clarification]').length).toBeGreaterThan(0);
  });
});

describe('how to play', () => {
  it('steps forward and back through the fourteen steps', async () => {
    const { user } = renderApp('/how-to-play');
    const progress = await screen.findByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '1');
    await user.click(screen.getByRole('button', { name: /^Next/ }));
    expect(progress).toHaveAttribute('aria-valuenow', '2');
    await user.click(screen.getByRole('button', { name: /Previous/ }));
    expect(progress).toHaveAttribute('aria-valuenow', '1');
  });

  it('ends with a link to the map generator', async () => {
    renderApp('/how-to-play?step=14');
    expect(await screen.findByRole('progressbar', { name: 'Step 14 of 14' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /generator|generate/i }).some((a) => a.getAttribute('href') === '/map-generator')).toBe(true);
  });
});

describe('map generator', () => {
  it('switches mode and regenerates with a new seed', async () => {
    const { user } = renderApp('/map-generator');
    await screen.findByRole('application');
    const modes = screen.getByRole('radiogroup', { name: 'Generation mode' });
    await user.click(within(modes).getByRole('radio', { name: 'Balanced Random' }));
    await waitFor(() => expect(useMapStore.getState().map.mode).toBe('balanced'));
    const seed = useMapStore.getState().map.seed;
    await user.click(screen.getByRole('button', { name: /Regenerate/ }));
    await waitFor(() => expect(useMapStore.getState().map.seed).not.toBe(seed));
    expect(useMapStore.getState().map.tiles).toHaveLength(30);
  });

  it('selects a tile, edits it in the editor, then undoes and redoes the change', async () => {
    const { user } = renderApp('/map-generator');
    await screen.findByRole('application');
    clickTile(0);
    expect(await screen.findByRole('tab', { name: 'Editor', selected: true })).toBeInTheDocument();
    const terrain = screen.getByLabelText(/terrain/i, { selector: 'select' });
    const before = useMapStore.getState().map.tiles.find((t) => t.slot === 0)!.terrain;
    await user.selectOptions(terrain, 'village');
    expect(useMapStore.getState().map.tiles.find((t) => t.slot === 0)!.terrain).toBe('village');
    expect(useMapStore.getState().map.mode).toBe('custom');

    await user.click(screen.getByRole('button', { name: /Undo/ }));
    expect(useMapStore.getState().map.tiles.find((t) => t.slot === 0)!.terrain).toBe(before);
    await user.click(screen.getByRole('button', { name: /Redo/ }));
    expect(useMapStore.getState().map.tiles.find((t) => t.slot === 0)!.terrain).toBe('village');
  });

  it('reports validation errors when counts break, and repairs them', async () => {
    const { user } = renderApp('/map-generator');
    await screen.findByRole('application');
    act(() => useMapStore.getState().setTerrain(0, 'water'));
    await user.click(screen.getByRole('tab', { name: /Validation/ }));
    expect(await screen.findAllByText(/error/i)).not.toHaveLength(0);
    await user.click(screen.getByRole('tab', { name: 'Editor' }));
    await user.click(screen.getByRole('button', { name: /Repair counts/ }));
    const counts: Record<string, number> = {};
    for (const t of useMapStore.getState().map.tiles) counts[t.terrain] = (counts[t.terrain] ?? 0) + 1;
    expect(counts).toMatchObject({ city: 4, water: 5, tax: 1 });
  });

  it('saves to the browser, loads a saved board and exports JSON', async () => {
    const createUrl = vi.fn(() => 'blob:mock');
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = vi.fn();
    const { user } = renderApp('/map-generator');
    await screen.findByRole('application');
    await user.click(screen.getByRole('tab', { name: 'Save & export' }));
    const name = screen.getByLabelText('Board name', { selector: 'input' });
    await user.clear(name);
    await user.type(name, 'Test Harbour');
    await user.click(screen.getByRole('button', { name: /Save to this browser/ }));
    expect(await screen.findByText(/Saved “Test Harbour”/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SAVED_MAPS_KEY)!)).toHaveLength(1);

    act(() => useMapStore.getState().newBalanced('OTHER-SEED'));
    await user.click(screen.getByRole('button', { name: /^Load/ }));
    expect(useMapStore.getState().map.name).toBe('Test Harbour');

    await user.click(screen.getByRole('button', { name: /Export JSON/ }));
    expect(createUrl).toHaveBeenCalled();
    for (const label of ['PNG', 'SVG', 'PDF', 'Print']) expect(screen.getByRole('button', { name: new RegExp(`^${label}$`) })).toBeEnabled();
  });

  it('rejects an invalid JSON import without changing the board', async () => {
    const { user } = renderApp('/map-generator');
    await screen.findByRole('application');
    await user.click(screen.getByRole('tab', { name: 'Save & export' }));
    const before = useMapStore.getState().map;
    const file = new File(['{"not":"a board"}'], 'bad.json', { type: 'application/json' });
    await user.upload(screen.getByTestId('import-json'), file);
    expect(await screen.findByText(/Import failed/)).toBeInTheDocument();
    expect(useMapStore.getState().map).toBe(before);
  });
});

describe('components page', () => {
  it('filters by category and opens the lightbox', async () => {
    const { user } = renderApp('/components');
    await screen.findByRole('heading', { level: 1, name: /built to be held/i });
    const all = screen.getAllByRole('article').length;
    expect(all).toBeGreaterThanOrEqual(15);
    await user.click(screen.getByRole('radio', { name: /^Steel/ }));
    expect(screen.getAllByRole('article').length).toBeLessThan(all);
    await user.click(screen.getByRole('button', { name: /Enlarge Steel Cards/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Steel Cards' });
    expect(within(dialog).getByRole('img')).toHaveAttribute('alt', expect.stringMatching(/steel/i));
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Steel Cards' })).not.toBeInTheDocument());
  });
});

describe('3D printing library', () => {
  it('filters parts, previews a filament and links real downloads', async () => {
    const { user } = renderApp('/3d-printing');
    expect(await screen.findByRole('heading', { level: 1, name: /print the pieces/i })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Standard 256 mm' }));
    expect(screen.getByText(/256 × 256 mm/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Copper' }));
    expect(screen.getByText(/Previewing Copper/)).toBeInTheDocument();
    const base = document.getElementById('hex_base') as HTMLElement;
    expect(within(base).getByRole('link', { name: 'STL' })).toHaveAttribute('href', '/printables/models/hex_base.stl');
    expect(within(base).getByRole('link', { name: '3MF' })).toHaveAttribute('href', '/printables/models/hex_base.3mf');
    expect(screen.queryByRole('heading', { name: 'City relief topper' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('heading', { name: 'City relief topper' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Building cost cards, duplex' })).toHaveAttribute('href', '/printables/cards/building-cost-cards-a4-duplex.pdf');
    await user.click(screen.getByRole('radio', { name: 'Roads' }));
    expect(screen.getByRole('heading', { name: 'Road segment' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Universal hex base' })).not.toBeInTheDocument();
  });
});

describe('print & export hub', () => {
  it('lists the twelve printables with print and PDF actions', async () => {
    const { user } = renderApp('/print-export');
    await screen.findByRole('heading', { level: 1, name: /bring it to the table/i });
    const cards = document.querySelectorAll('[data-printable]');
    expect(cards).toHaveLength(12);
    for (const card of cards) {
      expect(within(card as HTMLElement).getByRole('button', { name: /Print/ })).toBeInTheDocument();
      expect(within(card as HTMLElement).getByRole('button', { name: /PDF/ })).toBeInTheDocument();
    }
    expect(document.getElementById('rulebook-pdf')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Building cost cards, duplex' })).toHaveAttribute('href', '/printables/cards/building-cost-cards-a4-duplex.pdf');
    await user.click(screen.getByRole('button', { name: 'Preview Quick-start guide' }));
    expect(await screen.findByRole('dialog', { name: 'Quick-start guide preview' })).toBeInTheDocument();
  });

  it('sends a reference card to the browser print dialog', async () => {
    const print = vi.fn();
    window.print = print;
    const { user } = renderApp('/print-export');
    await screen.findByRole('heading', { level: 1, name: /bring it to the table/i });
    await user.click(within(document.getElementById('tax-inspector')!).getByRole('button', { name: /Print/ }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    expect(document.querySelector('#print-root [data-doc="tax-inspector"]')).not.toBeNull();
  });
});
