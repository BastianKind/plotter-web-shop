import type { ReactNode } from 'react';

/** Small hover/focus hint above (or below) its child. */
export function Tooltip({ label, children, side = 'top', wide = false }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom'; wide?: boolean }) {
  return (
    <span className={`tt tt-${side}`}>
      {children}
      <span className={`tt-bubble${wide ? ' tt-wide' : ''}`} role="tooltip">
        {label}
      </span>
    </span>
  );
}
