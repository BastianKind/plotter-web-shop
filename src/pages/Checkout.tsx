import { useState, type ChangeEvent, type ReactNode } from 'react';
import { BottomBar } from '../components/Bars';
import { PaperSurface } from '../components/Paper';
import { QtyInput } from '../components/QtyInput';
import { Tooltip } from '../components/Tooltip';
import { UiIcon } from '../components/UiIcon';
import { FORMATS, HANDS, INKS, PRICES } from '../data/catalog';
import { arrivalRange, orderNumber } from '../lib/dates';
import { COPIES_LETTER_MAX, bulkQuote, chf, copiesQuote, singleQuote } from '../lib/pricing';
import { MAX_COPIES, useShop } from '../state/shop';
import type { Mode, Shipping } from '../types';

type Pay = 'card' | 'twint' | 'invoice';

interface Form {
  email: string;
  name: string;
  company: string;
  street: string;
  plz: string;
  city: string;
  country: string;
}

const EXAMPLES: Record<Mode, Form> = {
  single: { email: 'jamie.park@email.com', name: 'Jamie Park', company: '', street: 'Müllerstrasse 32a', plz: '8570', city: 'Weinfelden', country: 'Switzerland' },
  copies: { email: 'lena@kellerflorals.ch', name: 'Lena Keller', company: 'Keller Florals', street: 'Bahnhofstrasse 1', plz: '9000', city: 'St. Gallen', country: 'Switzerland' },
  bulk: { email: 's.meier@muster-ag.ch', name: 'Sandra Meier', company: 'Muster AG', street: 'Industriestrasse 4', plz: '8500', city: 'Frauenfeld', country: 'Switzerland' },
};

const RULES: [keyof Form, (v: string) => boolean, string][] = [
  ['email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), 'Enter a valid email address.'],
  ['name', (v) => v.trim().length > 1, 'Enter a name.'],
  ['street', (v) => v.trim().length > 2, 'Enter the street and number.'],
  ['plz', (v) => /^\d{4}$/.test(v.trim()), 'Enter a 4-digit PLZ.'],
  ['city', (v) => v.trim().length > 1, 'Enter the city.'],
];

function Section({ no, title, aside, children }: { no: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="co-section">
      <div className="section-head">
        <span className="sec-no">{no}</span>
        <h2 className="sec-title">{title}</h2>
        {aside && <span className="sec-aside">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function Checkout() {
  const { state, dispatch } = useShop();
  const { mode } = state;
  const bulk = mode === 'bulk';
  const copies = mode === 'copies';
  const F = FORMATS[state.format];
  const [form, setForm] = useState<Form>(EXAMPLES[mode]);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | 'consent', string>>>({});
  const [shipping, setShipping] = useState<Shipping>('standard');
  const [pay, setPay] = useState<Pay>(bulk ? 'invoice' : 'card');
  const [qty, setQty] = useState(1);
  // Business cards usually go without envelopes; notes come with one.
  const [envelope, setEnvelope] = useState(!(copies && state.format === 'card'));
  const [consent, setConsent] = useState(false);

  const single = singleQuote(state.format, state.look.hand, qty, envelope, shipping);
  const cq = copiesQuote(state.format, state.look.hand, state.copies, envelope, shipping);
  const bq = bulkQuote(state.format, state.look.hand, state.recipients.length, state.delivery, state.bulkEnvelopes);
  const total = bulk ? bq.total : copies ? cq.total : single.total;
  const count = bulk ? state.recipients.length : copies ? state.copies : qty;
  const parcel = copies && cq.parcel;

  const set = (key: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const field = (key: keyof Form, label: string, opts: { span?: boolean; type?: string; autoComplete?: string; optional?: boolean; inputMode?: 'numeric' } = {}) => (
    <div className={`field${opts.span ? ' span2' : ''}`}>
      <label htmlFor={`co-${key}`}>
        {label}
        {opts.optional && <span className="muted"> (optional)</span>}
      </label>
      <input
        id={`co-${key}`}
        className="input"
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        inputMode={opts.inputMode}
        value={form[key]}
        onChange={set(key)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `err-${key}` : undefined}
      />
      {errors[key] && (
        <span className="field-error" id={`err-${key}`}>
          {errors[key]}
        </span>
      )}
    </div>
  );

  const place = () => {
    const next: typeof errors = {};
    for (const [key, ok, msg] of RULES) if (!ok(form[key])) next[key] = msg;
    if (bulk && !consent) next.consent = 'Confirm that you’re allowed to use these addresses.';
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first === 'consent' ? 'co-consent' : `co-${first}`)?.focus();
      return;
    }
    dispatch({
      type: 'PLACE_ORDER',
      order: {
        number: orderNumber(),
        mode,
        firstName: form.name.trim().split(/\s+/)[0] ?? '',
        email: form.email.trim(),
        count,
        total,
        direct: bulk ? state.delivery === 'direct' : !copies,
        express: !bulk && !parcel && shipping === 'express',
        placedAt: Date.now(),
      },
    });
  };

  const payLabel = pay === 'twint' ? `Pay ${chf(total)} with TWINT` : pay === 'invoice' ? `Place order · ${chf(total)}` : `Pay ${chf(total)} & place order`;
  const thumbWidth = state.format === 'card' ? 190 : state.format === 'a4' ? 120 : 130;
  const showBadge = bulk || (copies && state.copies > 1);

  return (
    <div className="page">
      <div className="container">
        <div className="co-head">
          <div className="page-head">
            <h1 className="page-title page-title-sm">One last little detail.</h1>
            <p className="page-sub">Your words are ready. We’ll write them with a real pen using a machine, so they look indistinguishable from handwriting.</p>
          </div>
          <button type="button" className="btn-link" onClick={() => dispatch({ type: 'GO', step: 'design' })}>
            <UiIcon name="arrowLeft" size={16} /> Back to your {copies ? 'design' : 'note'}
          </button>
        </div>

        <div className="co-grid">
          <div className="panel co-left">
            <Section no="01" title={bulk ? 'Contact' : 'Your email'} aside={bulk ? 'For the invoice and order updates' : 'For your receipt & order updates'}>
              <div className="form-grid">
                {(bulk || copies) && field('company', 'Company', { span: true, autoComplete: 'organization', optional: true })}
                {bulk && field('name', 'Contact person', { autoComplete: 'name' })}
                {field('email', 'Email address', { type: 'email', autoComplete: 'email', span: !bulk })}
              </div>
            </Section>

            <Section no="02" title={bulk ? 'Billing address' : copies ? 'Where should we send them?' : 'Where should it go?'}>
              <div className="form-grid">
                {!bulk && field('name', 'Full name', { autoComplete: 'name' })}
                <div className={`field${bulk ? ' span2' : ''}`}>
                  <label htmlFor="co-country">Country</label>
                  <select id="co-country" className="input" value={form.country} onChange={set('country')}>
                    <option>Switzerland</option>
                    <option>Liechtenstein</option>
                  </select>
                </div>
                {field('street', 'Street address', { span: true, autoComplete: 'address-line1' })}
                {field('plz', 'PLZ', { autoComplete: 'postal-code', inputMode: 'numeric' })}
                {field('city', 'City', { autoComplete: 'address-level2' })}
              </div>
              {bulk ? (
                <div className="delivery-note">
                  <UiIcon name="envelope" />
                  <span>
                    {state.delivery === 'direct'
                      ? `Each of the ${state.recipients.length} cards is posted to its recipient by A-Post.`
                      : 'All cards are delivered to this address in one parcel.'}{' '}
                    <button type="button" className="btn-link" onClick={() => dispatch({ type: 'GO', step: 'recipients' })}>
                      Change
                    </button>
                  </span>
                </div>
              ) : parcel ? (
                <div className="delivery-note">
                  <UiIcon name="box" />
                  <span>
                    All {state.copies} {F.plural} come in one parcel to this address · {chf(PRICES.bundleFlat)}. Estimated arrival {arrivalRange(state.copies, false)}.
                  </span>
                </div>
              ) : (
                <div className="options options-row">
                  <label className="option">
                    <input type="radio" name="ship" checked={shipping === 'standard'} onChange={() => setShipping('standard')} />
                    <span>
                      <strong>Standard delivery · {chf(PRICES.standard)}</strong>
                      <span className="muted small">Made in 2–3 days. Estimated arrival {arrivalRange(count, false)}.</span>
                    </span>
                  </label>
                  <label className="option">
                    <input type="radio" name="ship" checked={shipping === 'express'} onChange={() => setShipping('express')} />
                    <span>
                      <strong>A-Post Plus · {chf(PRICES.express)}</strong>
                      <span className="muted small">Written first and tracked. Estimated arrival {arrivalRange(count, true)}.</span>
                    </span>
                  </label>
                </div>
              )}
            </Section>

            <Section no="03" title="Payment details">
              <div className="options">
                {(bulk || copies) && (
                  <label className="option">
                    <input type="radio" name="pay" checked={pay === 'invoice'} onChange={() => setPay('invoice')} />
                    <UiIcon name="invoice" />
                    <span>
                      <strong>Invoice</strong>
                      <span className="muted small">By email, payable within 30 days. The usual choice for companies.</span>
                    </span>
                  </label>
                )}
                <label className="option">
                  <input type="radio" name="pay" checked={pay === 'card'} onChange={() => setPay('card')} />
                  <UiIcon name="card" />
                  <span>
                    <strong>Credit or debit card</strong>
                    <span className="pay-badges">
                      <span>VISA</span>
                      <span>Mastercard</span>
                      <span>AMEX</span>
                    </span>
                  </span>
                </label>
                <label className="option">
                  <input type="radio" name="pay" checked={pay === 'twint'} onChange={() => setPay('twint')} />
                  <UiIcon name="phone" />
                  <span>
                    <strong>TWINT</strong>
                    <span className="muted small">After placing the order you get a QR code to pay in the TWINT app.</span>
                  </span>
                </label>
              </div>
              {pay === 'card' && (
                <div className="card-fields">
                  <p className="demo-note">
                    <UiIcon name="info" size={16} /> Demo values only. Payment isn’t part of this prototype, so these fields can’t be edited.
                  </p>
                  <div className="form-grid">
                    <div className="field span2">
                      <label htmlFor="cc-number">Card number</label>
                      <input id="cc-number" className="input" value="4242 4242 4242 4242" readOnly />
                    </div>
                    <div className="field span2">
                      <label htmlFor="cc-name">Name on card</label>
                      <input id="cc-name" className="input" value={form.name} readOnly />
                    </div>
                    <div className="field">
                      <label htmlFor="cc-exp">Expiry</label>
                      <input id="cc-exp" className="input" value="08 / 29" readOnly />
                    </div>
                    <div className="field">
                      <label htmlFor="cc-cvc">Security code</label>
                      <input id="cc-cvc" className="input" value="•••" readOnly />
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {bulk && (
              <Section no="04" title="Your recipient list">
                <p className="muted">We use the addresses only to write and send these cards. The list is deleted 30 days after delivery and never shared.</p>
                <label className="check">
                  <input
                    id="co-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (e.target.checked) setErrors((x) => ({ ...x, consent: undefined }));
                    }}
                    aria-invalid={errors.consent ? true : undefined}
                  />
                  <span>I’m allowed to use these addresses for this mailing.</span>
                </label>
                {errors.consent && <span className="field-error">{errors.consent}</span>}
              </Section>
            )}
          </div>

          <aside className="panel summary" aria-label="Order summary">
            <div className="sum-head">
              <h2 className="sec-title">Your little keepsake</h2>
              <span className="muted small">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="sum-preview">
              <PaperSurface format={state.format} look={state.look} items={state.items} recipient={bulk ? (state.recipients[0] ?? null) : null} width={thumbWidth} className="paper-tilt" />
              {showBadge && <span className="sum-badge">× {count}</span>}
            </div>
            <div className="sum-item">
              <div>
                <strong>
                  {F.label} machine-written {F.noun}
                </strong>
                <p className="muted small">
                  {F.sizeLabel} · Ivory 300 gsm · {INKS[state.look.ink].label} ink · {HANDS[state.look.hand].short} · Written with a real pen by machine
                </p>
              </div>
              <button type="button" className="btn-link" onClick={() => dispatch({ type: 'GO', step: 'design' })}>
                Edit design
              </button>
            </div>

            {!bulk && (
              <>
                <div className="qty-row">
                  <span>
                    Quantity
                    {copies && <span className="muted small"> · same design on each</span>}
                  </span>
                  {copies ? (
                    <QtyInput id="co-copies" label="Number of copies" value={state.copies} max={MAX_COPIES} onChange={(n) => dispatch({ type: 'SET_COPIES', qty: n })} />
                  ) : (
                    <QtyInput id="co-qty" label="Quantity" value={qty} max={20} onChange={setQty} />
                  )}
                </div>
                <label className="addon">
                  <input type="checkbox" checked={envelope} onChange={(e) => setEnvelope(e.target.checked)} />
                  <span>
                    <strong>Add {count > 1 ? 'matching envelopes' : 'a matching envelope'}</strong>
                    <span className="muted small">Unsealed, ready for your own finishing touch.</span>
                  </span>
                  <span className="addon-price">{chf(PRICES.envelope)}</span>
                </label>
              </>
            )}

            <dl className="sum-lines">
              {bulk || copies ? (
                <>
                  <div className="line">
                    <dt>
                      Writing · {bulk ? bq.count : cq.qty} × {chf(bulk ? bq.base : cq.base)}
                    </dt>
                    <dd>{chf(bulk ? bq.gross : cq.gross)}</dd>
                  </div>
                  {(bulk ? bq.rate : cq.rate) > 0 && (
                    <div className="line line-discount">
                      <dt>
                        <Tooltip label="10 % from 25 pieces, 15 % from 100, 20 % from 250.">
                          <span className="dotted" tabIndex={0}>
                            Volume price −{Math.round((bulk ? bq.rate : cq.rate) * 100)} %
                          </span>
                        </Tooltip>
                      </dt>
                      <dd>{chf(-(bulk ? bq.discount : cq.discount))}</dd>
                    </div>
                  )}
                  {bulk && bq.envelopeCount > 0 && (
                    <div className="line">
                      <dt>
                        Envelopes · {bq.envelopeCount} × {chf(PRICES.envelope)}
                      </dt>
                      <dd>{chf(bq.envelopes)}</dd>
                    </div>
                  )}
                  {copies && envelope && (
                    <div className="line">
                      <dt>
                        Envelopes · {cq.qty} × {chf(PRICES.envelope)}
                      </dt>
                      <dd>{chf(cq.envelopes)}</dd>
                    </div>
                  )}
                  <div className="line">
                    <dt>
                      {bulk
                        ? bq.direct
                          ? `Postage A-Post · ${bq.count} × ${chf(PRICES.postEach)}`
                          : 'Delivery to one address'
                        : parcel
                          ? 'Parcel to your address'
                          : shipping === 'express'
                            ? 'A-Post Plus'
                            : 'Standard delivery'}
                    </dt>
                    <dd>{chf(bulk ? bq.postage : cq.shipping)}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="line">
                    <dt>Machine-written {F.noun}{qty > 1 ? ` · ${qty} ×` : ''}</dt>
                    <dd>{chf(single.writing)}</dd>
                  </div>
                  {envelope && (
                    <div className="line">
                      <dt>Ivory envelope{qty > 1 ? ` · ${qty} ×` : ''}</dt>
                      <dd>{chf(single.envelopes)}</dd>
                    </div>
                  )}
                  <div className="line">
                    <dt>{shipping === 'express' ? 'A-Post Plus' : 'Standard delivery'}</dt>
                    <dd>{chf(single.shipping)}</dd>
                  </div>
                </>
              )}
              <div className="line line-total">
                <dt>Total</dt>
                <dd>{chf(total)}</dd>
              </div>
            </dl>
            <p className="muted tiny">
              CHF · All applicable taxes included
              {copies && !parcel ? ` · more than ${COPIES_LETTER_MAX} copies ship as a parcel` : ''}
            </p>

            <button type="button" className="btn btn-primary btn-block" onClick={place}>
              {payLabel} <UiIcon name="arrowRight" />
            </button>
            <p className="secure">
              <UiIcon name="shield" size={15} /> Prototype checkout · nothing is charged
            </p>
            <p className="muted tiny center">By placing your order, you agree to our Terms & Privacy Policy. Each piece is made just for you. Please check your note before ordering.</p>
            <p className="signoff">A little care, delivered.</p>
          </aside>
        </div>
      </div>

      <BottomBar
        left={
          <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'GO', step: 'design' })}>
            <UiIcon name="arrowLeft" /> Back to your {copies ? 'design' : 'note'}
          </button>
        }
        middle={
          <span className="bb-price">
            <strong>{chf(total)}</strong>
            <span className="muted">
              {bulk ? `${state.recipients.length} cards` : copies ? `${state.copies} ${F.plural}` : `${qty} × ${F.label} ${F.noun}`} · incl. delivery
            </span>
          </span>
        }
        right={
          <button type="button" className="btn btn-primary" onClick={place}>
            {pay === 'invoice' ? 'Place order' : 'Pay & place order'} <UiIcon name="arrowRight" />
          </button>
        }
      />
    </div>
  );
}
