import { CircleHelp } from 'lucide-react';
import type { Clarification } from '../../data/rules';

export const CLARIFICATION_LABEL = 'Playtest clarification required';

export function ClarificationNote({ item, compact = false }: { item: Clarification; compact?: boolean }) {
  return (
    <aside
      className="rounded-md border border-dashed border-ember/60 bg-ember/[0.07] p-4 text-sm"
      aria-label={`${CLARIFICATION_LABEL}: ${item.question}`}
      data-clarification={item.id}
    >
      <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ember-light">
        <CircleHelp aria-hidden size={14} />
        {CLARIFICATION_LABEL}
      </p>
      <p className="mt-2 font-medium text-ivory">{item.question}</p>
      {!compact && <p className="mt-1.5 leading-relaxed text-muted">{item.context}</p>}
    </aside>
  );
}
