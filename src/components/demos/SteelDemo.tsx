import { RotateCcw, Ship } from 'lucide-react';
import { useState } from 'react';
import { LIMITS } from '../../data/costs';
import { STEEL_CARD_AVERAGE, STEEL_DECK_SIZE, steelDeckCards } from '../../data/steel';
import { createRng, randomSeed } from '../../lib/rng';

function shuffled(cards: number[]): number[] {
  return createRng(randomSeed()).shuffle(cards);
}

function SteelCard({ value, faceDown = false }: { value?: number; faceDown?: boolean }) {
  return (
    <svg viewBox="0 0 70 100" className="h-28 w-20 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" aria-hidden>
      <rect x="1" y="1" width="68" height="98" rx="5" fill={faceDown ? '#1f3a33' : '#efe3c4'} stroke="#8a6634" strokeWidth="2" />
      <rect x="6" y="6" width="58" height="88" rx="3" fill="none" stroke={faceDown ? '#d6ac65' : '#8a6634'} strokeOpacity="0.6" strokeDasharray="2 2" />
      {faceDown ? (
        <>
          <circle cx="35" cy="50" r="14" fill="none" stroke="#d6ac65" strokeWidth="2" />
          <path d="M28 50h14M35 43v14" stroke="#d6ac65" strokeWidth="2" />
        </>
      ) : (
        <>
          <text x="35" y="22" textAnchor="middle" fontSize="7" fontWeight="600" letterSpacing="1" fill="#5c4320">STEEL</text>
          <text x="35" y="64" textAnchor="middle" fontSize="36" fontWeight="700" fontFamily="Cinzel, serif" fill="#2b2219">{value}</text>
          <text x="35" y="84" textAnchor="middle" fontSize="6" letterSpacing="0.8" fill="#5c4320">SHIPPING CERTIFICATE</text>
        </>
      )}
    </svg>
  );
}

export function SteelDemo() {
  const [deck, setDeck] = useState(() => shuffled(steelDeckCards()));
  const [discard, setDiscard] = useState<number[]>([]);
  const [steel, setSteel] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [note, setNote] = useState('Your activated Port’s number was rolled. Draw a Steel Card.');
  const won = steel >= LIMITS.steelToWin;

  const draw = () => {
    if (won) return;
    let d = deck;
    let disc = discard;
    let reshuffled = false;
    if (!d.length) {
      d = shuffled(disc);
      disc = [];
      reshuffled = true;
    }
    const [card, ...rest] = d;
    const total = steel + card;
    setDeck(rest);
    setDiscard([...disc, card]);
    setSteel(total);
    setLast(card);
    setNote(
      `${reshuffled ? 'Deck exhausted — discards reshuffled. ' : ''}Drew a ${card}: take ${card} Steel Coin${card > 1 ? 's' : ''} and discard the card.${
        total >= LIMITS.steelToWin ? ' Ten Steel — your ship launches immediately.' : ''
      }`,
    );
  };

  const reset = () => {
    setDeck(shuffled(steelDeckCards()));
    setDiscard([]);
    setSteel(0);
    setLast(null);
    setNote('New deck shuffled.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-6">
        <div className="text-center">
          <SteelCard faceDown />
          <p className="mt-1 text-xs text-muted">Deck · {deck.length}</p>
        </div>
        <div className="text-center">
          {last != null ? <SteelCard value={last} /> : <div className="h-28 w-20 rounded-md border border-dashed border-rivet" aria-hidden />}
          <p className="mt-1 text-xs text-muted">Discard · {discard.length}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={draw} disabled={won}>
            Draw Steel Card
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
            <RotateCcw aria-hidden size={14} /> New deck
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="label">Steel Coins</span>
          <span className="font-display text-lg tabular-nums text-ivory">
            {Math.min(steel, 99)} / {LIMITS.steelToWin}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-10 gap-1" role="img" aria-label={`${steel} of ${LIMITS.steelToWin} Steel`}>
          {Array.from({ length: LIMITS.steelToWin }, (_, i) => (
            <span key={i} className={`h-3 rounded-sm border ${i < steel ? 'border-brass-light bg-gradient-to-b from-[#c9cdd0] to-[#6f777c]' : 'border-rivet bg-coal'}`} />
          ))}
        </div>
      </div>

      <p className={`flex items-center gap-2 text-sm ${won ? 'text-brass-light' : 'text-parchment'}`} aria-live="polite">
        {won && <Ship aria-hidden size={16} />}
        {note}
      </p>
      <p className="text-xs text-dim">
        {STEEL_DECK_SIZE} cards · average value {STEEL_CARD_AVERAGE.toFixed(2)} Steel per draw. Coins are held privately; card draws may be tracked publicly.
      </p>
    </div>
  );
}
