import { useMemo, useState } from 'react';
import { BottomBar } from '../components/Bars';
import { Modal } from '../components/Modal';
import { PaperSurface } from '../components/Paper';
import { QtyInput } from '../components/QtyInput';
import { Tooltip } from '../components/Tooltip';
import { UiIcon, type UiIconName } from '../components/UiIcon';
import { FORMAT_ORDER, FORMATS } from '../data/catalog';
import { defaultItems } from '../data/defaults';
import { chf, copiesQuote, piecePrice, r05 } from '../lib/pricing';
import { MAX_COPIES, useShop } from '../state/shop';
import type { FormatKey, Mode } from '../types';

const PREVIEW_WIDTH: Record<FormatKey, number> = { a4: 112, a5: 104, card: 168 };

const MODES: { mode: Mode; icon: UiIconName; title: string; sub: string; tip?: string }[] = [
  { mode: 'single', icon: 'user', title: 'Sending one note', sub: 'One note, one address' },
  { mode: 'copies', icon: 'copy', title: 'Many copies', sub: 'Business cards, thank-you notes', tip: 'The same design many times, delivered to you. Volume price from 25 pieces.' },
  { mode: 'bulk', icon: 'users', title: 'Sending to many', sub: 'A personal card per recipient', tip: 'Upload a list or type in names. Every card greets its recipient by name.' },
];

const QUICK_QTY = [10, 25, 50, 100, 250, 500];

const MODE_SWITCH: Record<Mode, { button: string; body: string }> = {
  single: { button: 'Switch to one note', body: 'A single note comes with its own starter design. Your current text and icons are replaced.' },
  copies: { button: 'Switch to many copies', body: 'Many copies start with a design that’s the same on every piece, like a business card. Your current text and icons are replaced.' },
  bulk: { button: 'Switch to bulk order', body: 'Bulk orders start with a design that greets every recipient by name. Your current text and icons are replaced.' },
};

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
  const { mode } = state;
  const volume = mode !== 'single';

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

  const cq = copiesQuote(state.format, state.look.hand, state.copies, false, 'standard');

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

        <div className="mode-toggle" role="radiogroup" aria-label="What are you ordering?">
          {MODES.map((m) => {
            const button = (
              <button key={m.mode} type="button" role="radio" aria-checked={mode === m.mode} className="mode-opt" onClick={() => pickMode(m.mode)}>
                <UiIcon name={m.icon} />
                <span>
                  <strong>{m.title}</strong>
                  <span className="muted">{m.sub}</span>
                </span>
              </button>
            );
            return m.tip ? (
              <Tooltip key={m.mode} label={m.tip} wide>
                {button}
              </Tooltip>
            ) : (
              button
            );
          })}
        </div>

        {mode === 'copies' && (
          <div className="qty-row-choose" role="group" aria-labelledby="copies-label">
            <span id="copies-label" className="qty-label">
              How many?
            </span>
            <div className="qty-chips">
              {QUICK_QTY.map((n) => (
                <button key={n} type="button" className={`qty-chip${state.copies === n ? ' is-on' : ''}`} aria-pressed={state.copies === n} onClick={() => dispatch({ type: 'SET_COPIES', qty: n })}>
                  {n}
                </button>
              ))}
            </div>
            <QtyInput id="copies-qty" label="Number of copies" value={state.copies} max={MAX_COPIES} onChange={(qty) => dispatch({ type: 'SET_COPIES', qty })} />
            <span className="muted small">All copies are the same and come to you in one delivery.</span>
          </div>
        )}

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
                    <span className="fc-price-note">{volume ? `${chf(r05(price * 0.9))} from 25 pieces` : 'per machine-written piece'}</span>
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
          mode === 'copies' ? (
            <span className="bb-price">
              <strong>
                {state.copies} × {FORMATS[state.format].label} · {chf(cq.perCard)} each
              </strong>
              <span className="muted">{cq.rate ? `${Math.round(cq.rate * 100)} % volume price · ` : 'Volume price from 25 pieces · '}delivery at checkout</span>
            </span>
          ) : (
            <span className="bb-price">
              <strong>
                {FORMATS[state.format].label} · {chf(piecePrice(state.format, state.look.hand))}
              </strong>
              <span className="muted">{mode === 'bulk' ? 'Bulk order · volume price from 25 pieces' : 'per note · delivery at checkout'}</span>
            </span>
          )
        }
        right={
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'GO', step: mode === 'bulk' ? 'recipients' : 'design' })}>
            {mode === 'bulk' ? 'Add recipients' : 'Make it yours'}
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
              {pending?.kind === 'format' ? `Switch to ${FORMATS[pending.value].label}` : pending ? MODE_SWITCH[pending.value].button : ''}
            </button>
          </div>
        }
      >
        <p>
          {pending?.kind === 'format'
            ? `${FORMATS[pending.value].label} comes with its own starter design. Your current text and icons are replaced.`
            : pending
              ? MODE_SWITCH[pending.value].body
              : ''}
        </p>
      </Modal>
    </div>
  );
}
