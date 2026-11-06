import type { ReactNode } from 'react';
import { fullName } from '../lib/recipients';
import { useShop } from '../state/shop';
import { UiIcon } from './UiIcon';

/** Sticky bar at the bottom of each step: back, price, next. */
export function BottomBar({ left, middle, right }: { left?: ReactNode; middle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="bottombar">
      <div className="container bottombar-inner">
        <div className="bb-left">{left}</div>
        <div className="bb-mid">{middle}</div>
        <div className="bb-right">{right}</div>
      </div>
    </div>
  );
}

/** Flip through the recipients to check every personal card. */
export function Pager({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useShop();
  const n = state.recipients.length;
  const r = state.recipients[state.previewIdx];
  if (!n) return <span className="pager muted">No recipients yet</span>;
  return (
    <div className={`pager${compact ? ' pager-compact' : ''}`}>
      <button type="button" className="icon-btn" aria-label="Previous recipient" disabled={state.previewIdx === 0} onClick={() => dispatch({ type: 'SET_PREVIEW', idx: state.previewIdx - 1 })}>
        <UiIcon name="chevronLeft" />
      </button>
      <span className="pager-label">
        <strong>{r ? fullName(r) : ''}</strong>
        <span className="muted">
          {state.previewIdx + 1} of {n}
        </span>
      </span>
      <button type="button" className="icon-btn" aria-label="Next recipient" disabled={state.previewIdx >= n - 1} onClick={() => dispatch({ type: 'SET_PREVIEW', idx: state.previewIdx + 1 })}>
        <UiIcon name="chevronRight" />
      </button>
    </div>
  );
}
