import { ArrowRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { COSTS, LIMITS } from '../../data/costs';
import { RESOURCES, RESOURCE_TYPES, type ResourceType } from '../../data/resources';
import { ResourceIcon } from '../ui/ResourceIcon';

const START: Record<ResourceType, number> = { money: 3, wood: 6, metal: 3, fuel: 2, stone: 1 };
const SPECIALTY: ResourceType = 'wood';

function Select({ id, value, onChange }: { id: string; value: ResourceType; onChange: (r: ResourceType) => void }) {
  return (
    <select id={id} className="field w-auto py-1.5 text-sm" value={value} onChange={(e) => onChange(e.target.value as ResourceType)}>
      {RESOURCE_TYPES.map((r) => (
        <option key={r} value={r}>
          {RESOURCES[r].label}
        </option>
      ))}
    </select>
  );
}

export function MarketDemo() {
  const [hand, setHand] = useState(START);
  const [steel, setSteel] = useState(0);
  const [marketUsed, setMarketUsed] = useState(false);
  const [hasMarket, setHasMarket] = useState(true);
  const [network, setNetwork] = useState(true);
  const [inspector, setInspector] = useState(false);
  const [marketTake, setMarketTake] = useState<ResourceType>('metal');
  const [bankGive, setBankGive] = useState<ResourceType>('wood');
  const [bankTake, setBankTake] = useState<ResourceType>('stone');
  const [log, setLog] = useState('Your Port specializes in Wood.');

  const total = RESOURCE_TYPES.reduce((a, r) => a + hand[r], 0);
  const add = (r: ResourceType, n: number) => setHand((h) => ({ ...h, [r]: h[r] + n }));

  const marketBlock = !hasMarket
    ? 'Build your Wood Market first.'
    : inspector
      ? 'The Tax Inspector on your Port suspends Market trading.'
      : marketUsed
        ? `Only ${LIMITS.marketTradesPerTurn} specialized exchange per turn.`
        : hand[SPECIALTY] < LIMITS.marketTradeRate
          ? `You need ${LIMITS.marketTradeRate} Wood.`
          : null;

  const steelCost = COSTS.steelPurchase;
  const steelBlock = !hasMarket
    ? 'Steel purchase requires a constructed Port Market.'
    : !network
      ? 'Steel purchase requires a completed City-to-Port network.'
      : inspector
        ? 'The Tax Inspector on your Port suspends Steel purchase.'
        : hand.metal < steelCost.metal || hand.fuel < steelCost.fuel
          ? `You need ${steelCost.metal} Metal and ${steelCost.fuel} Fuel.`
          : null;

  const bankBlock = hand[bankGive] < LIMITS.bankTradeRate ? `You need ${LIMITS.bankTradeRate} identical ${RESOURCES[bankGive].label}.` : bankGive === bankTake ? 'Choose a different resource to receive.' : null;

  const doMarket = () => {
    if (marketBlock) return setLog(marketBlock);
    setHand((h) => ({ ...h, [SPECIALTY]: h[SPECIALTY] - LIMITS.marketTradeRate, [marketTake]: h[marketTake] + 1 }));
    setMarketUsed(true);
    setLog(`Market: ${LIMITS.marketTradeRate} Wood → 1 ${RESOURCES[marketTake].label}.`);
  };
  const doBank = () => {
    if (bankBlock) return setLog(bankBlock);
    setHand((h) => ({ ...h, [bankGive]: h[bankGive] - LIMITS.bankTradeRate, [bankTake]: h[bankTake] + 1 }));
    setLog(`Bank: ${LIMITS.bankTradeRate} ${RESOURCES[bankGive].label} → 1 ${RESOURCES[bankTake].label}.`);
  };
  const doSteel = () => {
    if (steelBlock) return setLog(steelBlock);
    add('metal', -steelCost.metal);
    add('fuel', -steelCost.fuel);
    setSteel((s) => s + 1);
    setLog(`Bought 1 Steel Coin for ${steelCost.metal} Metal + ${steelCost.fuel} Fuel.`);
  };
  const reset = () => {
    setHand(START);
    setSteel(0);
    setMarketUsed(false);
    setLog('Reset to the starting hand.');
  };

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-3 gap-2 @md:grid-cols-6" aria-label="Your resources">
        {RESOURCE_TYPES.map((r) => (
          <li key={r} className="plate-flat flex flex-col items-center gap-1 py-3">
            <ResourceIcon type={r} size={22} />
            <span className="font-display text-xl tabular-nums text-ivory">{hand[r]}</span>
            <span className="text-[0.65rem] uppercase tracking-wider text-muted">{RESOURCES[r].label}</span>
          </li>
        ))}
        <li className="plate-flat flex flex-col items-center gap-1 border-brass-dark py-3">
          <ResourceIcon type="steel" size={22} />
          <span className="font-display text-xl tabular-nums text-brass-light">{steel}</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-muted">Steel</span>
        </li>
      </ul>
      <p className="text-xs text-dim">Ordinary resources held: {total} (public count). Steel is never an ordinary resource.</p>

      <div className="grid gap-3 @2xl:grid-cols-3">
        <div className="plate-flat flex flex-col gap-3 p-4">
          <p className="label">Wood Market · once per turn</p>
          <div className="flex items-center gap-2 text-sm text-parchment">
            {LIMITS.marketTradeRate} Wood <ArrowRight size={14} aria-hidden /> 1
            <label htmlFor="mk-take" className="sr-only">Resource to receive from Market</label>
            <Select id="mk-take" value={marketTake} onChange={setMarketTake} />
          </div>
          <button type="button" className="btn btn-secondary btn-sm mt-auto" onClick={doMarket} aria-disabled={!!marketBlock}>
            Exchange at Market
          </button>
        </div>
        <div className="plate-flat flex flex-col gap-3 p-4">
          <p className="label">Bank · any time while trading</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-parchment">
            {LIMITS.bankTradeRate}
            <label htmlFor="bk-give" className="sr-only">Resource to give the bank</label>
            <Select id="bk-give" value={bankGive} onChange={setBankGive} />
            <ArrowRight size={14} aria-hidden /> 1
            <label htmlFor="bk-take" className="sr-only">Resource to receive from the bank</label>
            <Select id="bk-take" value={bankTake} onChange={setBankTake} />
          </div>
          <button type="button" className="btn btn-secondary btn-sm mt-auto" onClick={doBank} aria-disabled={!!bankBlock}>
            Trade with bank
          </button>
        </div>
        <div className="plate-flat flex flex-col gap-3 p-4">
          <p className="label">Steel purchase · no per-turn limit</p>
          <div className="flex items-center gap-2 text-sm text-parchment">
            {steelCost.metal} Metal + {steelCost.fuel} Fuel <ArrowRight size={14} aria-hidden /> 1 Steel
          </div>
          <button type="button" className="btn btn-secondary btn-sm mt-auto" onClick={doSteel} aria-disabled={!!steelBlock}>
            Buy Steel Coin
          </button>
        </div>
      </div>

      <fieldset className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <legend className="sr-only">Situation</legend>
        <label className="flex items-center gap-2"><input type="checkbox" checked={hasMarket} onChange={(e) => setHasMarket(e.target.checked)} className="accent-[#d6ac65]" /> Wood Market built</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={network} onChange={(e) => setNetwork(e.target.checked)} className="accent-[#d6ac65]" /> City-to-Port network complete</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={inspector} onChange={(e) => setInspector(e.target.checked)} className="accent-[#d6ac65]" /> Tax Inspector on your Port</label>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rivet pt-3">
        <p className="text-sm text-parchment" aria-live="polite">{log}</p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => (setMarketUsed(false), setLog('New turn: the Market exchange is available again.'))}>
            Next turn
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
            <RotateCcw size={14} aria-hidden /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
