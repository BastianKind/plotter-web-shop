import { useMemo, useState } from 'react';
import { BottomBar } from '../components/Bars';
import { Modal } from '../components/Modal';
import { PaperSurface } from '../components/Paper';
import { Tooltip } from '../components/Tooltip';
import { UiIcon, type UiIconName } from '../components/UiIcon';
import { FORMAT_ORDER, FORMATS } from '../data/catalog';
import { defaultItems } from '../data/defaults';
import { chf, piecePrice, r05 } from '../lib/pricing';
import { useShop } from '../state/shop';
import type { FormatKey, Mode } from '../types';

const PREVIEW_WIDTH: Record<FormatKey, number> = { a4: 112, a5: 104, card: 168 };

const FEATURES: { icon: UiIconName; label: string; tip: string }[] = [
  { icon: 'pen', label: 'Written with real ink', tip: 'A real pen on real paper. No printer is involved.' },
  { icon: 'box', label: 'Ready in 2–3 days', tip: 'Written within 2–3 working days, then sent by A-Post.' },
  { icon: 'heart', label: 'Made to be kept', tip: 'Ivory 300 gsm paper that feels like a proper letter.' },
];

type Pending = { kind: 'format'; value: FormatKey } | { kind: 'mode'; value: Mode } | null;

function PenIllustration() {
  return (
    <svg viewBox="0 0 160 100" className="promo-art" aria-hidden="true">
      <rect x="18" y="14" width="118" height="78" rx="3" transform="rotate(-4 77 53)" className="pa-paper" />
      <path d="M34 60c10-14 18 6 27-4s12-14 20-2 14 8 22-4" className="pa-line" />
      <path d="M40 74c16-3 40-2 62-6" className="pa-line pa-line-2" />
      <g transform="rotate(38 112 44)">
        <rect x="104" y="6" width="12" height="40" rx="2.5" className="pa-pen" />
        <path d="M104 46h12l-6 12z" className="pa-pen" />
        <circle cx="110" cy="58" r="2" className="pa-dot" />
      </g>
    </svg>
  );
}

export function ChoosePaper() {
  const { state, dispatch } = useShop();
  const [pending, setPending] = useState<Pending>(null);
  const edited = state.past.length > 0;
  const bulk = state.mode === 'bulk';

  // Each card shows the starter design it opens with.
  const previews = useMemo(
    () => Object.fromEntries(FORMAT_ORDER.map((f) => [f, f === state.format ? state.items : defaultItems(f, state.mode)])) as Record<FormatKey, ReturnType<typeof defaultItems>>,
    [state.format, state.items, state.mode],
  );

  const pickFormat = (f: FormatKey) => {
    if (f === state.format) return;
    if (edited) setPending({ kind: 'format', value: f });
    else dispatch({ type: 'SET_FORMAT', format: f });
  };
  const pickMode = (m: Mode) => {
    if (m === state.mode) return;
    if (edited) setPending({ kind: 'mode', value: m });
    else dispatch({ type: 'SET_MODE', mode: m });
  };
  const confirm = () => {
    if (pending?.kind === 'format') dispatch({ type: 'SET_FORMAT', format: pending.value });
    if (pending?.kind === 'mode') dispatch({ type: 'SET_MODE', mode: pending.value });
    setPending(null);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="choose-head">
          <div className="page-head">
            <p className="eyebrow">A little more personal</p>
            <h1 className="page-title">Good things start on paper.</h1>
            <p className="page-sub">Choose your canvas. We’ll turn your words into real, pen-on-paper writing that looks indistinguishable from handwriting.</p>
          </div>
          <p className="tagline" aria-hidden="true">
            Not printed. Penned.
          </p>
        </div>

        <div className="mode-toggle" role="radiogroup" aria-label="How many notes?">
          <button type="button" role="radio" aria-checked={!bulk} className="mode-opt" onClick={() => pickMode('single')}>
            <UiIcon name="user" />
            <span>
              <strong>Sending one note</strong>
              <span className="muted">One note, one address</span>
            </span>
          </button>
          <Tooltip label="Upload a list from Excel. Every card greets its recipient by name." wide>
            <button type="button" role="radio" aria-checked={bulk} className="mode-opt" onClick={() => pickMode('bulk')}>
              <UiIcon name="users" />
              <span>
                <strong>Sending to many</strong>
                <span className="muted">Bulk order with a recipient list</span>
              </span>
            </button>
          </Tooltip>
        </div>

        <div className="format-grid" role="radiogroup" aria-label="Paper">
          {FORMAT_ORDER.map((f) => {
            const F = FORMATS[f];
            const selected = f === state.format;
            const price = piecePrice(f, state.look.hand);
            return (
              <button key={f} type="button" role="radio" aria-checked={selected} className="format-card" onClick={() => pickFormat(f)}>
                <span className="fc-preview">
                  {F.badge && <span className="fc-badge">{F.badge}</span>}
                  <PaperSurface format={f} look={state.look} items={previews[f]} width={PREVIEW_WIDTH[f]} className="fc-paper" />
                </span>
                <span className="fc-body">
                  <span className="fc-top">
                    <span className="fc-title">{F.label}</span>
                    <span className="fc-check" aria-hidden="true">
                      {selected && <UiIcon name="check" size={13} />}
                    </span>
                  </span>
                  <span className="fc-size">{F.sizeLabel}</span>
                  <span className="fc-blurb">{F.blurb}</span>
                  <span className="fc-price-row">
                    <span className="fc-price">{chf(price)}</span>
                    <span className="fc-price-note">{bulk ? `${chf(r05(price * 0.9))} from 25 pieces` : 'per machine-written piece'}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="choose-row">
          <p className="stock-note">
            <UiIcon name="leaf" />
            Beautifully textured, 300 gsm ivory stock. Real ink, always.
          </p>
        </div>

        <section className="promo" aria-label="About plotter">
          <PenIllustration />
          <div className="promo-text">
            <h2>Your words. A real pen. A keepsake that looks like handwriting.</h2>
            <p>Made in our studio using a machine with a real pen, then sent with care. A thoughtful little something in a very digital world.</p>
          </div>
          <ul className="promo-features">
            {FEATURES.map((f) => (
              <li key={f.label}>
                <Tooltip label={f.tip} wide>
                  <span className="feature" tabIndex={0}>
                    <UiIcon name={f.icon} size={22} />
                    <span>{f.label}</span>
                  </span>
                </Tooltip>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <BottomBar
        middle={
          <span className="bb-price">
            <strong>
              {FORMATS[state.format].label} · {chf(piecePrice(state.format, state.look.hand))}
            </strong>
            <span className="muted">{bulk ? 'Bulk order · volume price from 25 pieces' : 'per note · delivery at checkout'}</span>
          </span>
        }
        right={
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'GO', step: bulk ? 'recipients' : 'design' })}>
            {bulk ? 'Add recipients' : 'Make it yours'}
            <UiIcon name="arrowRight" />
          </button>
        }
      />

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Start a fresh design?"
        footer={
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setPending(null)}>
              Keep my design
            </button>
            <button type="button" className="btn btn-primary" onClick={confirm}>
              {pending?.kind === 'format' ? `Switch to ${FORMATS[pending.value].label}` : pending?.value === 'bulk' ? 'Switch to bulk order' : 'Switch to one note'}
            </button>
          </div>
        }
      >
        <p>
          {pending?.kind === 'format'
            ? `${FORMATS[pending.value].label} comes with its own starter design. Your current text and icons are replaced.`
            : 'Bulk orders start with a design that greets every recipient by name. Your current text and icons are replaced.'}
        </p>
      </Modal>
    </div>
  );
}
