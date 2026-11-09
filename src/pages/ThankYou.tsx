import { useState } from 'react';
import { Modal } from '../components/Modal';
import { PaperSurface } from '../components/Paper';
import { UiIcon } from '../components/UiIcon';
import { dayRange, schedule, shortDay } from '../lib/dates';
import { chf } from '../lib/pricing';
import { useShop } from '../state/shop';
import { FORMATS } from '../data/catalog';

function TruckScene() {
  return (
    <svg className="truck-scene" viewBox="0 0 320 90" aria-hidden="true">
      <path d="M10 76h300" className="road" />
      <path d="M30 76c40-10 70 6 110-2s70-8 100 0" className="road-swoosh" />
      <g className="truck">
        <rect x="0" y="22" width="62" height="40" rx="5" className="truck-box" />
        <path d="M62 34h20l14 15v13H62z" className="truck-cab" />
        <circle cx="18" cy="66" r="8" className="wheel" />
        <circle cx="78" cy="66" r="8" className="wheel" />
        <path d="M14 36h30M14 46h22" className="truck-lines" />
      </g>
    </svg>
  );
}

export function ThankYou() {
  const { state, dispatch } = useShop();
  const [viewOpen, setViewOpen] = useState(false);
  const order = state.order;
  if (!order) return null;

  const { start, end, posted, arrives } = schedule(order.count, order.express, new Date(order.placedAt));
  const bulk = order.mode === 'bulk';
  const copies = order.mode === 'copies';
  // Bulk shows three different personal cards; copies show three of the same.
  const stack = bulk ? state.recipients.slice(0, 3) : copies ? [null, null, null] : [];

  return (
    <div className="page">
      <div className="container thanks">
        <div className="thanks-card">
          <p className="thanks-title">Thank you{order.firstName ? `, ${order.firstName}` : ''}!</p>
          {stack.length ? (
            <div className="stack" aria-hidden="true">
              {stack.map((r, i) => (
                <PaperSurface key={i} format={state.format} look={state.look} items={state.items} recipient={r} width={state.format === 'card' ? 170 : 120} className={`stack-card stack-${i}`} />
              ))}
            </div>
          ) : (
            <TruckScene />
          )}
          <p className="thanks-text">
            {bulk
              ? `${order.count} cards are in the writing queue.`
              : copies
                ? `${order.count} ${FORMATS[state.format].plural} are in the writing queue.`
                : `Your ${order.count > 1 ? 'notes are' : 'note is'} in the writing queue and will be out for delivery soon.`}
            {state.look.hand === 'own' && ' We start as soon as your handwriting template is back.'}
          </p>
        </div>

        <ol className="timeline">
          <li>
            <UiIcon name="pen" />
            <span className="muted small">Written</span>
            <strong>{dayRange(start, end)}</strong>
          </li>
          <li>
            <UiIcon name="envelope" />
            <span className="muted small">{order.direct ? 'Posted' : 'Shipped'}</span>
            <strong>{shortDay(posted)}</strong>
          </li>
          <li>
            <UiIcon name="truck" />
            <span className="muted small">Arrives</span>
            <strong>from {shortDay(arrives)}</strong>
          </li>
        </ol>

        <p className="order-no">
          Order <strong>{order.number}</strong> · {chf(order.total)} · confirmation to {order.email}
        </p>

        <div className="thanks-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setViewOpen(true)}>
            <UiIcon name="eye" /> View your {bulk ? 'cards' : copies ? 'design' : 'note'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'NEW_ORDER' })}>
            To home page <UiIcon name="arrowRight" />
          </button>
        </div>
      </div>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={bulk ? 'Your cards' : copies ? 'Your design' : 'Your note'} wide>
        <div className="preview-desk">
          <PaperSurface
            format={state.format}
            look={state.look}
            items={state.items}
            recipient={bulk ? (state.recipients[0] ?? null) : null}
            width={state.format === 'card' ? 520 : 360}
            className="paper-tilt"
          />
        </div>
      </Modal>
    </div>
  );
}
