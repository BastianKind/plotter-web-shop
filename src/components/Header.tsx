import logo from '../assets/logo.svg';
import { useShop } from '../state/shop';
import type { Step } from '../types';
import { Tooltip } from './Tooltip';
import { UiIcon } from './UiIcon';

const SINGLE_STEPS: [Step, string][] = [
  ['paper', 'Choose your paper'],
  ['design', 'Make it yours'],
  ['checkout', 'Checkout'],
];
const BULK_STEPS: [Step, string][] = [
  ['paper', 'Choose your paper'],
  ['recipients', 'Recipients'],
  ['design', 'Make it yours'],
  ['checkout', 'Checkout'],
];

export function Header({ onHelp }: { onHelp: () => void }) {
  const { state, dispatch } = useShop();
  const steps = state.mode === 'bulk' ? BULK_STEPS : SINGLE_STEPS;
  const finished = state.step === 'done';
  const current = finished ? steps.length : steps.findIndex(([key]) => key === state.step);

  return (
    <header className="header">
      <div className="container header-inner">
        <button
          type="button"
          className="logo-btn"
          aria-label="plotter, back to the start"
          onClick={() => dispatch(finished ? { type: 'NEW_ORDER' } : { type: 'GO', step: 'paper' })}
        >
          <img src={logo} alt="plotter" className="logo" />
        </button>

        <nav aria-label="Order steps" className="stepper-nav">
          <ol className="stepper">
            {steps.map(([key, label], i) => {
              const done = i < current;
              const isCurrent = i === current;
              return (
                <li key={key} className={`st-item${done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}>
                  {i > 0 && <span className="st-line" aria-hidden="true" />}
                  <button
                    type="button"
                    className="st-btn"
                    disabled={!done || finished}
                    aria-current={isCurrent ? 'step' : undefined}
                    onClick={() => dispatch({ type: 'GO', step: key })}
                  >
                    <span className="st-dot">{done ? <UiIcon name="check" size={12} /> : i + 1}</span>
                    <span className="st-label">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="header-right">
          <Tooltip label="Clickable prototype for user tests. Nothing is ordered, sent or charged." side="bottom" wide>
            <span className="proto-pill" tabIndex={0}>
              Prototype
            </span>
          </Tooltip>
          <button type="button" className="help-btn" onClick={onHelp}>
            <UiIcon name="help" />
            <span>A little help?</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© 2026 Plotter studio</span>
        <span>Thoughtful by design. Personal by nature.</span>
      </div>
    </footer>
  );
}
