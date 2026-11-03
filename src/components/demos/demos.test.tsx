import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InspectorDemo } from './InspectorDemo';
import { MarketDemo } from './MarketDemo';
import { RoadDemo } from './RoadDemo';
import { SteelDemo } from './SteelDemo';
import { TollDemo } from './TollDemo';

const held = (label: string) => {
  const li = screen.getByRole('list', { name: 'Your resources' }).querySelectorAll('li');
  const row = [...li].find((l) => l.textContent?.includes(label))!;
  return Number(row.querySelector('.font-display')!.textContent);
};

describe('Road demo', () => {
  it('charges a Road per segment plus a Stone for Mountain segments and detects the City–Port link', async () => {
    const user = userEvent.setup();
    render(<RoadDemo />);
    await user.click(screen.getByRole('button', { name: 'Build Road between your City and the Mountain' }));
    expect(screen.getByText(/Mountain surcharge applies/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Build Road between the Mountain and the northern Village' }));
    await user.click(screen.getByRole('button', { name: 'Build Road between the northern Village and your Port' }));
    expect(screen.getByText('Connected — Port activated')).toBeInTheDocument();
    expect(screen.getByLabelText('3 Wood + 3 Metal + 3 Fuel + 2 Stone + 3 actions')).toBeInTheDocument();
  });

  it('never offers connection points into Water or the Tax Office', () => {
    render(<RoadDemo />);
    const labels = screen.getAllByRole('button', { name: /^Build Road between/ }).map((b) => b.getAttribute('aria-label')!);
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(l).not.toMatch(/Water|Tax Office/);
  });
});

describe('Toll demo', () => {
  it('rejects two consecutive toll Roads', async () => {
    const user = userEvent.setup();
    render(<TollDemo />);
    await user.click(screen.getByRole('radio', { name: 'Two rival Roads in a row' }));
    await user.click(screen.getByRole('button', { name: /Segment 2: Blue's Road/ }));
    await user.click(screen.getByRole('button', { name: /Segment 3: Blue's Road/ }));
    expect(screen.getByText(/Two consecutive toll Roads need an intervening Road/)).toBeInTheDocument();
  });

  it('limits tolls to two until four paid Roads are built, then allows a third', async () => {
    const user = userEvent.setup();
    render(<TollDemo />);
    await user.click(screen.getByRole('radio', { name: 'Three rival Roads' }));
    for (const n of [1, 3, 5]) await user.click(screen.getByRole('button', { name: new RegExp(`Segment ${n}: Blue's Road`) }));
    expect(screen.getByText(/Toll allowance is 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Segment 2: empty/ }));
    await user.click(screen.getByRole('button', { name: /Segment 4: empty/ }));
    await user.click(screen.getByRole('button', { name: 'More paid Roads' }));
    expect(screen.getByText('Valid City-to-Port network')).toBeInTheDocument();
  });
});

describe('Market demo', () => {
  it('allows one 2:1 specialized exchange per turn and 4:1 bank trades', async () => {
    const user = userEvent.setup();
    render(<MarketDemo />);
    expect(held('Wood')).toBe(6);
    await user.click(screen.getByRole('button', { name: 'Exchange at Market' }));
    expect(held('Wood')).toBe(4);
    expect(held('Metal')).toBe(4);
    await user.click(screen.getByRole('button', { name: 'Exchange at Market' }));
    expect(screen.getByText(/Only 1 specialized exchange per turn/)).toBeInTheDocument();
    expect(held('Wood')).toBe(4);
    await user.click(screen.getByRole('button', { name: 'Trade with bank' }));
    expect(held('Wood')).toBe(0);
    expect(held('Stone')).toBe(2);
  });

  it('requires a Market and a completed network to buy Steel', async () => {
    const user = userEvent.setup();
    render(<MarketDemo />);
    await user.click(screen.getByLabelText('City-to-Port network complete'));
    await user.click(screen.getByRole('button', { name: 'Buy Steel Coin' }));
    expect(screen.getByText(/requires a completed City-to-Port network/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('City-to-Port network complete'));
    await user.click(screen.getByRole('button', { name: 'Buy Steel Coin' }));
    expect(screen.getByText('Bought 1 Steel Coin for 2 Metal + 1 Fuel.')).toBeInTheDocument();
  });
});

describe('Tax Inspector demo', () => {
  it('taxes half (rounded down) at 8+ and Steel only at 8 or 9 unless vaulted', async () => {
    const user = userEvent.setup();
    render(<InspectorDemo />);
    expect(screen.getByText(/Surrender 5 \(half, rounded down\) → 6 left/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Ordinary resources held/), { target: { value: '7' } });
    expect(screen.getByText('Below 8: no tax.')).toBeInTheDocument();
    expect(screen.getByText('Lose 1 Steel → 7.')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Active Steel Vault'));
    expect(screen.getByText(/The Vault absorbs this Steel-tax event/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Steel held/), { target: { value: '7' } });
    expect(screen.getByText('Only 8 or 9 Steel is taxed.')).toBeInTheDocument();
  });

  it('refuses Water, the Tax Office, concealed tiles and the current hex', async () => {
    const user = userEvent.setup();
    render(<InspectorDemo />);
    for (const [name, reason] of [
      [/^Water/, /Water is never an eligible destination/],
      [/^Tax Office/, /Tax Office can never be targeted/],
      [/^Concealed tile/, /Unrevealed Mine\/Mountain tiles/],
      [/\(Inspector here\)/, /must move to a different hex/],
    ] as const) {
      await user.click(screen.getAllByRole('button', { name })[0]);
      expect(screen.getByText(reason)).toBeInTheDocument();
    }
  });
});

describe('Steel demo', () => {
  it('draws from a 20-card deck', async () => {
    const user = userEvent.setup();
    render(<SteelDemo />);
    await user.click(screen.getByRole('button', { name: /Draw/ }));
    expect(screen.getByRole('img', { name: /of 10 Steel/ })).toBeInTheDocument();
    expect(screen.getByText(/19/)).toBeInTheDocument();
  });
});
