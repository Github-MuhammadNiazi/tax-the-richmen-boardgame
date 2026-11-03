import type { CostKey } from '../../data/resources';

/** Hand-drawn engraved-style resource glyphs. Each shape differs so resources never rely on colour alone. */
export function ResourceIcon({ type, size = 18, className = '' }: { type: CostKey; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <ResourceGlyph type={type} />
    </svg>
  );
}

export function ResourceGlyph({ type }: { type: CostKey }) {
  switch (type) {
    case 'money':
      return (
        <g>
          <circle cx="12" cy="12" r="9.5" fill="#d6ac65" stroke="#7d5d30" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="6.5" fill="none" stroke="#8a6634" strokeWidth="1" />
          <path d="M12 7.5v9M9.6 10a2.4 1.8 0 0 1 4.8 0c0 2-4.8 1.6-4.8 3.8a2.4 1.8 0 0 0 4.8 0" fill="none" stroke="#5c4320" strokeWidth="1.3" />
        </g>
      );
    case 'wood':
      return (
        <g stroke="#4a3020" strokeWidth="1">
          <circle cx="8" cy="15" r="4" fill="#b7814e" />
          <circle cx="16" cy="15" r="4" fill="#a8743f" />
          <circle cx="12" cy="8.5" r="4" fill="#c08c58" />
          <circle cx="8" cy="15" r="1.4" fill="none" />
          <circle cx="16" cy="15" r="1.4" fill="none" />
          <circle cx="12" cy="8.5" r="1.4" fill="none" />
          <path d="M3.5 12.5h17" stroke="#d8c08f" strokeWidth="1.2" />
        </g>
      );
    case 'metal':
      return (
        <g>
          <path d="M3 17l3-9h12l3 9z" fill="#8d969b" stroke="#3e4448" strokeWidth="1.2" />
          <path d="M6 8l1.5 4h9L18 8" fill="none" stroke="#c4cbcf" strokeWidth="1" />
        </g>
      );
    case 'fuel':
      return (
        <g>
          <rect x="6" y="3.5" width="12" height="17" rx="2" fill="#2f2f2f" stroke="#8b8b8b" strokeWidth="1.1" />
          <path d="M6 8.5h12M6 15.5h12" stroke="#8b8b8b" strokeWidth="1.1" />
          <circle cx="14.5" cy="5.6" r="0.9" fill="#8b8b8b" />
        </g>
      );
    case 'stone':
      return (
        <g>
          <path d="M4 15l2-7 6-3 7 3 1 7-6 4-7-1z" fill="#9c9a92" stroke="#4e4c47" strokeWidth="1.1" />
          <path d="M6 8l6 3 7-3M12 11l1 8" fill="none" stroke="#6b6962" strokeWidth="0.9" />
        </g>
      );
    case 'steel':
      return (
        <g>
          <circle cx="12" cy="12" r="9.5" fill="#b9c0c4" stroke="#5b6266" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="5" fill="none" stroke="#5b6266" strokeWidth="1.6" strokeDasharray="1.6 1.2" />
          <circle cx="12" cy="12" r="2" fill="#5b6266" />
        </g>
      );
    case 'action':
      return (
        <g>
          <path d="M12 2.5l2.3 2.4 3.3-.6.6 3.3 2.4 2.3-2.4 2.3-.6 3.3-3.3-.6L12 21.5l-2.3-2.4-3.3.6-.6-3.3L3.4 12l2.4-2.3.6-3.3 3.3.6z" fill="#a8423c" stroke="#5e211d" strokeWidth="1" />
          <circle cx="12" cy="12" r="3.2" fill="#f2e6cf" />
        </g>
      );
  }
}
