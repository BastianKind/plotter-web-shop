import { useEffect, useRef, useState } from 'react';
import { BottomBar, Pager } from '../components/Bars';
import { Envelope } from '../components/Envelope';
import { Modal } from '../components/Modal';
import { PaperSurface } from '../components/Paper';
import { PaperEditor } from '../components/PaperEditor';
import { PaperIcon } from '../components/PaperIcon';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { Tooltip } from '../components/Tooltip';
import { UiIcon, type UiIconName } from '../components/UiIcon';
import { FORMATS, HAND_ORDER, HANDS, ICONS, INKS, SIZES } from '../data/catalog';
import { clamp } from '../lib/geometry';
import { INSERTABLE, unknownTokens } from '../lib/personalize';
import { bulkQuote, chf, singleQuote } from '../lib/pricing';
import { useShop } from '../state/shop';
import type { Align, HandKey, InkKey, SizeKey } from '../types';

const ALIGNS: { value: Align; icon: UiIconName; label: string }[] = [
  { value: 'left', icon: 'alignLeft', label: 'Align left' },
  { value: 'center', icon: 'alignCenter', label: 'Center' },
  { value: 'right', icon: 'alignRight', label: 'Align right' },
  { value: 'justify', icon: 'alignJustify', label: 'Justify' },
];

type IconTab = 'all' | 'nature' | 'love';

export function Design() {
  const { state, dispatch } = useShop();
  const toast = useToast();
  const F = FORMATS[state.format];
  const bulk = state.mode === 'bulk';
  const selected = state.items.find((i) => i.id === state.selectedId) ?? null;
  const textItem = selected?.kind === 'text' ? selected : null;
  const recipient = bulk ? (state.recipients[state.previewIdx] ?? null) : null;

  const [tab, setTab] = useState<IconTab>('all');
  const [zoom, setZoom] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState({ w: 640, h: 560 });
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);

  // Fit the paper into the canvas; zoom multiplies that fit.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStage({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fit = Math.max(0.6, Math.min((stage.w - 64) / F.w, (stage.h - 64) / F.h));
  const scale = fit * zoom;

  // "All changes saved" indicator.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaving(true);
    const t = window.setTimeout(() => setSaving(false), 700);
    return () => window.clearTimeout(t);
  }, [state.items, state.look]);

  // Undo / redo shortcuts while not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
      } else if (k === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  const insertToken = (token: string) => {
    if (!textItem) return;
    const ta = textRef.current;
    const start = ta?.selectionStart ?? textItem.text.length;
    const end = ta?.selectionEnd ?? textItem.text.length;
    const text = textItem.text.slice(0, start) + token + textItem.text.slice(end);
    dispatch({ type: 'UPDATE_ITEM', id: textItem.id, commit: true, patch: { text } });
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const onSvg = (file: File | undefined) => {
    if (!file) return;
    if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
      toast('Only SVG files work here, so the pen can follow the lines.', 'warn');
      return;
    }
    if (file.size > 300_000) {
      toast('That SVG is too large. Keep it under 300 KB.', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({ type: 'ADD_IMAGE', src: String(reader.result), name: file.name });
      toast(`${file.name} added to your paper`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const unknown = textItem ? unknownTokens(textItem.text) : [];
  const icons = ICONS.filter((i) => tab === 'all' || i.group === tab);
  const single = singleQuote(state.format, state.look.hand, 1, false, 'standard');
  const bulkQ = bulkQuote(state.format, state.look.hand, state.recipients.length, state.delivery, state.bulkEnvelopes);
  const previewWidth = state.format === 'card' ? 520 : state.format === 'a4' ? 360 : 380;

  const handOptions = HAND_ORDER.map((k: HandKey) => ({
    value: k,
    label: HANDS[k].label,
    hint: HANDS[k].hint,
    preview: (
      <span className="hand-preview">
        <span className="hand-sample" style={{ fontFamily: HANDS[k].family, fontSize: 22 * HANDS[k].factor }}>
          Dear you,
        </span>
        <span className="opt-label">{HANDS[k].label}</span>
      </span>
    ),
  }));
  const inkOptions = (Object.keys(INKS) as InkKey[]).map((k) => ({ value: k, label: INKS[k].label, swatch: INKS[k].color }));
  const sizeOptions = (Object.keys(SIZES) as SizeKey[]).map((k) => ({ value: k, label: SIZES[k], hint: k === 'mixed' ? 'Bigger first line' : undefined }));

  return (
    <div className="page page-design">
      <div className="container">
        <div className="design-head">
          <div className="page-head">
            <h1 className="page-title page-title-sm">{bulk ? 'One message, every name.' : 'A note, in your own words.'}</h1>
            <p className="page-sub">
              {bulk ? 'Write it once and use First name to greet everyone personally.' : 'Write something lovely.'} Drag your text and icons to make it feel just right.
            </p>
          </div>
          <div className="design-actions">
            <span className={`saved${saving ? ' is-saving' : ''}`} aria-live="polite">
              <UiIcon name={saving ? 'pen' : 'check'} size={15} />
              {saving ? 'Saving…' : 'All changes saved'}
            </span>
            <button type="button" className="btn btn-secondary" onClick={() => setPreviewOpen(true)}>
              <UiIcon name="eye" /> Preview
            </button>
          </div>
        </div>

        <div className="design-grid">
          {/* Left: words and handwriting */}
          <aside className="panel design-left" aria-label="Your words">
            <h2 className="panel-title">
              <UiIcon name="text" /> Your words
            </h2>

            {textItem ? (
              <div className="field">
                <div className="label-row">
                  <label htmlFor="msg">Message</label>
                  <span className="counter">{textItem.text.length} / 1,000</span>
                </div>
                <textarea
                  id="msg"
                  ref={textRef}
                  className="input"
                  rows={9}
                  maxLength={1000}
                  value={textItem.text}
                  onFocus={() => dispatch({ type: 'BEGIN_CHANGE' })}
                  onBlur={() => dispatch({ type: 'END_CHANGE' })}
                  onChange={(e) => dispatch({ type: 'UPDATE_ITEM', id: textItem.id, patch: { text: e.target.value } })}
                />
                {bulk && (
                  <div className="token-row">
                    <span className="muted small">Insert:</span>
                    {INSERTABLE.map((t) => (
                      <Tooltip key={t.token} label={`Writes each recipient’s ${t.label.toLowerCase()}`}>
                        <button type="button" className="token-btn" onClick={() => insertToken(t.token)}>
                          <UiIcon name="plus" size={13} /> {t.label}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                )}
                {unknown.length > 0 && (
                  <p className="notice">
                    <UiIcon name="alert" size={16} />
                    <span>
                      {unknown.join(', ')} {unknown.length === 1 ? 'isn’t a placeholder we know' : 'aren’t placeholders we know'}, so it would be written as is.
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="empty-note">{selected ? 'This is an icon. Click a text box on the paper to edit its words.' : 'Click a text box on the paper to edit it.'}</p>
            )}

            <button type="button" className="btn-link" onClick={() => dispatch({ type: 'ADD_TEXT' })}>
              <UiIcon name="plus" size={16} /> Add another text box
            </button>

            <hr />

            <div className="field">
              <label htmlFor="hand">Handwriting</label>
              <Select
                id="hand"
                value={state.look.hand}
                options={handOptions}
                onChange={(v) => dispatch({ type: 'SET_LOOK', patch: { hand: v } })}
                valueStyle={{ fontFamily: HANDS[state.look.hand].family, fontSize: 19 * HANDS[state.look.hand].factor }}
              />
              {state.look.hand === 'own' && <p className="hint">After you order, we send you a short template to fill in once. Until then, the preview uses a sample style.</p>}
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="size">Size</label>
                {textItem ? (
                  <Select id="size" value={textItem.size} options={sizeOptions} onChange={(v) => dispatch({ type: 'UPDATE_ITEM', id: textItem.id, commit: true, patch: { size: v } })} />
                ) : (
                  <button type="button" id="size" className="select-btn" disabled>
                    <span className="select-value muted">—</span>
                  </button>
                )}
              </div>
              <div className="field">
                <label htmlFor="ink">Ink</label>
                <Select id="ink" value={state.look.ink} options={inkOptions} onChange={(v) => dispatch({ type: 'SET_LOOK', patch: { ink: v } })} />
              </div>
            </div>

            <hr />

            <div className="field">
              <div className="label-row">
                <span className="label">Position on paper</span>
                <span className="counter">mm</span>
              </div>
              <div className="two">
                <label className="mini-field">
                  <span>X · from left</span>
                  <input
                    className="input"
                    type="number"
                    step={0.5}
                    disabled={!selected}
                    value={selected ? selected.x : ''}
                    onFocus={() => dispatch({ type: 'BEGIN_CHANGE' })}
                    onBlur={() => dispatch({ type: 'END_CHANGE' })}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (selected && !Number.isNaN(v)) dispatch({ type: 'UPDATE_ITEM', id: selected.id, patch: { x: clamp(v, 0, F.w - selected.w) } });
                    }}
                  />
                </label>
                <label className="mini-field">
                  <span>Y · from top</span>
                  <input
                    className="input"
                    type="number"
                    step={0.5}
                    disabled={!selected}
                    value={selected ? selected.y : ''}
                    onFocus={() => dispatch({ type: 'BEGIN_CHANGE' })}
                    onBlur={() => dispatch({ type: 'END_CHANGE' })}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (selected && !Number.isNaN(v)) dispatch({ type: 'UPDATE_ITEM', id: selected.id, patch: { y: clamp(v, 0, F.h - selected.h) } });
                    }}
                  />
                </label>
              </div>
              <div className="align-row" role="group" aria-label="Text alignment">
                {ALIGNS.map((a) => (
                  <Tooltip key={a.value} label={a.label}>
                    <button
                      type="button"
                      className={`align-btn${textItem?.align === a.value ? ' is-on' : ''}`}
                      aria-label={a.label}
                      aria-pressed={textItem?.align === a.value}
                      disabled={!textItem}
                      onClick={() => textItem && dispatch({ type: 'UPDATE_ITEM', id: textItem.id, commit: true, patch: { align: a.value } })}
                    >
                      <UiIcon name={a.icon} size={17} />
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </aside>

          {/* Middle: the paper */}
          <section className="canvas" aria-label="Paper">
            <div className="canvas-bar">
              <div className="cb-group">
                <Tooltip label="Undo · Ctrl+Z">
                  <button type="button" className="icon-btn" aria-label="Undo" disabled={!state.past.length} onClick={() => dispatch({ type: 'UNDO' })}>
                    <UiIcon name="undo" />
                  </button>
                </Tooltip>
                <Tooltip label="Redo · Ctrl+Y">
                  <button type="button" className="icon-btn" aria-label="Redo" disabled={!state.future.length} onClick={() => dispatch({ type: 'REDO' })}>
                    <UiIcon name="redo" />
                  </button>
                </Tooltip>
              </div>
              <span className="cb-label">
                {F.label} · {F.orientation} · {F.sizeLabel}
              </span>
              <div className="cb-group">
                <Tooltip label="Zoom out">
                  <button type="button" className="icon-btn" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
                    <UiIcon name="minus" />
                  </button>
                </Tooltip>
                <Tooltip label="Fit to screen">
                  <button type="button" className="zoom-btn" onClick={() => setZoom(1)}>
                    {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
                  </button>
                </Tooltip>
                <Tooltip label="Zoom in">
                  <button type="button" className="icon-btn" aria-label="Zoom in" disabled={zoom >= 2.5} onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}>
                    <UiIcon name="plus" />
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="stage" ref={stageRef}>
              <div className="stage-inner">
                <PaperEditor scale={scale} recipient={recipient} />
              </div>
            </div>
            <div className="canvas-foot">
              {bulk ? <Pager compact /> : <span />}
              <span className="hint-line">
                <UiIcon name="move" size={15} /> Drag to move · Use the corners to resize
              </span>
            </div>
          </section>

          {/* Right: little extras */}
          <aside className="panel design-right" aria-label="Little extras">
            <h2 className="panel-title">
              <UiIcon name="sparkle" /> Little extras
            </h2>
            <p className="muted small">A small mark can say a lot. Choose an icon to add it to your paper.</p>
            <div className="tabs" role="tablist" aria-label="Icon groups">
              {(
                [
                  ['all', 'All icons'],
                  ['nature', 'Nature'],
                  ['love', 'Love'],
                ] as [IconTab, string][]
              ).map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className="tab" onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="icon-grid" role="tabpanel">
              {icons.map((ic) => (
                <Tooltip key={ic.key} label={ic.label}>
                  <button type="button" className="icon-tile" aria-label={`Add ${ic.label.toLowerCase()}`} onClick={() => dispatch({ type: 'ADD_ICON', icon: ic.key })}>
                    <PaperIcon icon={ic.key} />
                  </button>
                </Tooltip>
              ))}
            </div>
            <label className="btn-dashed" htmlFor="svg-upload">
              <UiIcon name="upload" size={16} /> Upload your own SVG
            </label>
            <input
              id="svg-upload"
              type="file"
              className="sr-only"
              accept=".svg,image/svg+xml"
              onChange={(e) => {
                onSvg(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <hr />
            <div className="sel-actions">
              <button type="button" className="btn btn-ghost" disabled={!selected} onClick={() => dispatch({ type: 'DUPLICATE' })}>
                <UiIcon name="copy" size={16} /> Duplicate
              </button>
              <button type="button" className="btn btn-ghost btn-danger" disabled={!selected} onClick={() => dispatch({ type: 'REMOVE' })}>
                <UiIcon name="trash" size={16} /> Remove
              </button>
            </div>
            <p className="muted tiny">Tip: select something and use the arrow keys to nudge it.</p>
          </aside>
        </div>
      </div>

      <BottomBar
        left={
          <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'GO', step: bulk ? 'recipients' : 'paper' })}>
            <UiIcon name="arrowLeft" /> {bulk ? 'Recipients' : 'Change paper'}
          </button>
        }
        middle={
          bulk ? (
            <span className="bb-price">
              <strong>{chf(bulkQ.total)}</strong>
              <span className="muted">
                {bulkQ.count} × {F.label} · {chf(bulkQ.perCard)} each · {bulkQ.direct ? 'incl. postage' : 'delivered to one address'}
              </span>
            </span>
          ) : (
            <span className="bb-price">
              <strong>{chf(single.piece)}</strong>
              <span className="muted">1 × {F.label} note · delivery at checkout</span>
            </span>
          )
        }
        right={
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'GO', step: 'checkout' })}>
            Continue to checkout <UiIcon name="arrowRight" />
          </button>
        }
      />

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={bulk && recipient ? `Preview for ${recipient.first}` : 'Preview'}
        wide
        footer={<p className="muted small">The real one is written with a pen, so every line is a little different from this preview.</p>}
      >
        <div className="preview-desk">
          <PaperSurface format={state.format} look={state.look} items={state.items} recipient={recipient} width={previewWidth} className="paper-tilt" />
          {bulk && state.delivery === 'direct' && <Envelope recipient={recipient} look={state.look} width={300} />}
        </div>
        {bulk && <Pager />}
      </Modal>
    </div>
  );
}
