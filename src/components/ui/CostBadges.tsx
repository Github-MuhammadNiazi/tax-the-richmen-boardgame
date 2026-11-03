import { COSTS, COST_LABEL, costEntries, formatCost, type Cost, type CostId } from '../../data/costs';
import { ResourceIcon } from './ResourceIcon';

export function CostBadges({
  cost,
  includeAction = true,
  size = 'md',
  tone = 'dark',
}: {
  cost: Cost | CostId;
  includeAction?: boolean;
  size?: 'sm' | 'md';
  tone?: 'dark' | 'light';
}) {
  const c = typeof cost === 'string' ? COSTS[cost] : cost;
  const entries = costEntries(c, { includeAction });
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" aria-label={formatCost(c, { includeAction })}>
      {entries.map(([k, n]) => (
        <span
          key={k}
          title={`${n} ${COST_LABEL[k]}`}
          className={`cost-badge inline-flex items-center gap-1 rounded-sm border px-1.5 ${size === 'sm' ? 'py-0 text-xs' : 'py-0.5 text-sm'} ${
            tone === 'dark' ? 'border-rivet bg-ink/60 text-ivory' : 'border-[#c9b88f] bg-white/40 text-[#2b2219]'
          }`}
        >
          <span className="font-semibold tabular-nums">{n}</span>
          <ResourceIcon type={k} size={size === 'sm' ? 14 : 16} />
          <span className="sr-only">{COST_LABEL[k]}</span>
        </span>
      ))}
    </span>
  );
}
