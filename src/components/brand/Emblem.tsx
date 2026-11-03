import { useId } from 'react';

/** Original Tax the Richmen emblem: a brass cog ring around a hex seal bearing three chimneys over a coin. */
export function Emblem({ size = 44, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const teeth = 18;
  const outer = 47;
  const inner = 40;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (Math.PI * 2 * i) / (teeth * 2) - Math.PI / 2;
    const a1 = (Math.PI * 2 * (i + 1)) / (teeth * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${50 + r * Math.cos(a0)},${50 + r * Math.sin(a0)}`, `${50 + r * Math.cos(a1)},${50 + r * Math.sin(a1)}`);
  }
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${50 + 27 * Math.cos(a)},${50 + 27 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-brass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d49c" />
          <stop offset="0.45" stopColor="#d6ac65" />
          <stop offset="1" stopColor="#8a6634" />
        </linearGradient>
      </defs>
      <polygon points={pts.join(' ')} fill={`url(#${id}-brass)`} />
      <circle cx="50" cy="50" r="37" fill="#1b2224" stroke="#6e5530" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="33" fill="none" stroke={`url(#${id}-brass)`} strokeWidth="0.8" strokeDasharray="1.2 2.2" />
      <polygon points={hex} fill="#202729" stroke={`url(#${id}-brass)`} strokeWidth="2" />
      {/* chimneys */}
      <g fill={`url(#${id}-brass)`}>
        <rect x="38" y="33" width="5" height="17" />
        <rect x="47.5" y="28" width="5" height="22" />
        <rect x="57" y="36" width="5" height="14" />
        <rect x="35" y="49" width="30" height="4" />
      </g>
      {/* coin */}
      <circle cx="50" cy="62" r="8.5" fill="none" stroke={`url(#${id}-brass)`} strokeWidth="2" />
      <circle cx="50" cy="62" r="4" fill={`url(#${id}-brass)`} />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Emblem size={compact ? 36 : 44} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.62rem] tracking-[0.42em] text-brass">TAX THE</span>
        <span className="font-display text-lg font-bold tracking-[0.16em] text-ivory sm:text-xl">RICHMEN</span>
      </span>
    </span>
  );
}
