import { useEffect, useRef, useState, type ClipboardEvent } from 'react';
import { BottomBar, Pager } from '../components/Bars';
import { Envelope } from '../components/Envelope';
import { useToast } from '../components/Toast';
import { Tooltip } from '../components/Tooltip';
import { UiIcon } from '../components/UiIcon';
import { FORMATS, PRICES } from '../data/catalog';
import { bulkQuote, chf } from '../lib/pricing';
import { MAX_ROWS, downloadTemplate, isComplete, mapRows, parseCSV, readRecipientFile } from '../lib/recipients';
import { emptyRecipient, useShop } from '../state/shop';
import type { Recipient } from '../types';

const COLUMNS: { key: keyof Recipient; label: string; placeholder: string; width: number; numeric?: boolean }[] = [
  { key: 'first', label: 'First name', placeholder: 'First name', width: 90 },
  { key: 'last', label: 'Last name', placeholder: 'Last name', width: 96 },
  { key: 'street', label: 'Street', placeholder: 'Street and no.', width: 150 },
  { key: 'plz', label: 'PLZ', placeholder: 'PLZ', width: 54, numeric: true },
  { key: 'city', label: 'City', placeholder: 'City', width: 96 },
];

/** Long lists stay fast: only this many rows are editable until "Show all" is clicked. */
const VISIBLE_ROWS = 100;

const hasName = (r: Recipient) => Boolean(r.first.trim() || r.last.trim());

export function Recipients() {
  const { state, dispatch } = useShop();
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [focusRow, setFocusRow] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = state.recipients;
  const named = rows.filter(hasName);
  const n = named.length;
  const unnamed = rows.length - n;
  const direct = state.delivery === 'direct';
  const incomplete = named.filter((r) => !isComplete(r)).length;
  const q = bulkQuote(state.format, state.look.hand, n, state.delivery, state.bulkEnvelopes);
  const current = rows[state.previewIdx] ?? null;
  const visible = showAll ? rows : rows.slice(0, VISIBLE_ROWS);

  // Put the cursor into a row that was just added.
  useEffect(() => {
    if (focusRow == null) return;
    document.getElementById(`rcp-${focusRow}-first`)?.focus();
    setFocusRow(null);
  }, [focusRow, rows.length]);

  const load = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { list, cut } = await readRecipientFile(file);
      if (!list.length) throw new Error(`No recipients found in “${file.name}”. Put one person per row, with a first or last name.`);
      dispatch({ type: 'SET_RECIPIENTS', list, name: file.name, isSample: false, notes: cut ? [`Only the first ${MAX_ROWS} rows were read.`] : [] });
      setShowAll(false);
      toast(`${list.length} recipients loaded from ${file.name}`, 'success');
    } catch (err) {
      dispatch({ type: 'SET_LIST_NOTES', notes: [err instanceof Error ? err.message : 'That file couldn’t be read. Upload a .xlsx or .csv file with one person per row.'] });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addRow = (after?: number) => {
    const at = after != null ? after + 1 : rows.length;
    dispatch({ type: 'INSERT_RECIPIENTS', list: [emptyRecipient()], after });
    if (at >= VISIBLE_ROWS) setShowAll(true);
    setFocusRow(at);
  };

  // Pasting several rows (e.g. copied from Excel) fills in the table.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    const text = e.clipboardData.getData('text');
    if (!/[\t\n]/.test(text.trim())) return;
    const { list } = mapRows(parseCSV(text.trim()));
    if (!list.length) return;
    e.preventDefault();
    dispatch({ type: 'INSERT_RECIPIENTS', list, after: index, replace: index });
    toast(`${list.length} ${list.length === 1 ? 'row' : 'rows'} pasted`, 'success');
  };

  const notes = [...state.listNotes];
  if (incomplete && direct) {
    notes.push(`${incomplete} ${incomplete === 1 ? 'person has' : 'people have'} no complete address. Fill in the highlighted fields, or deliver all cards to one address.`);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Bulk order</p>
          <h1 className="page-title">Who should get one?</h1>
          <p className="page-sub">Upload your list, or type in a few names. Every card is written with the recipient’s name, and we can address and post each one for you.</p>
        </div>

        <div className="rcp-grid">
          <section className="panel" aria-labelledby="rcp-title">
            <div className="panel-head">
              <h2 id="rcp-title" className="panel-title">
                <UiIcon name="users" /> Recipients
              </h2>
              {rows.length > 0 && <span className={`chip${state.isSample ? '' : ' chip-blue'}`}>{state.isSample ? 'Example list' : 'Your list'}</span>}
            </div>

            <div
              className={`upload${dragging ? ' is-drag' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void load(e.dataTransfer.files?.[0]);
              }}
            >
              <span className="upload-ic">
                <UiIcon name="upload" size={20} />
              </span>
              <span className="upload-txt">
                <strong>{busy ? 'Reading your file…' : 'Drop your Excel or CSV file here'}</strong>
                <span className="muted small">Best for long lists. One row per card: First name, Last name, Street, PLZ, City.</span>
              </span>
              <label className="btn btn-secondary" htmlFor="rcp-file">
                Choose file
              </label>
              <input ref={fileRef} id="rcp-file" type="file" className="sr-only" accept=".xlsx,.csv,text/csv" onChange={(e) => void load(e.target.files?.[0])} />
            </div>

            <div className="list-tools">
              <button type="button" className="btn-link" onClick={downloadTemplate}>
                <UiIcon name="download" size={16} /> Download template
              </button>
              {!state.isSample && (
                <button type="button" className="btn-link" onClick={() => dispatch({ type: 'LOAD_SAMPLE' })}>
                  Use example list
                </button>
              )}
              {rows.length > 0 && (
                <button type="button" className="btn-link btn-link-muted" onClick={() => dispatch({ type: 'CLEAR_RECIPIENTS' })}>
                  Remove list
                </button>
              )}
            </div>

            {notes.length > 0 && (
              <p className="notice">
                <UiIcon name="alert" size={16} />
                <span>{notes.join(' ')}</span>
              </p>
            )}

            {rows.length > 0 ? (
              <>
                <div className="list-meta">
                  <strong>{state.listName}</strong>
                  <span className="muted">
                    {n} {n === 1 ? 'recipient' : 'recipients'}
                    {incomplete ? ` · ${incomplete} without full address` : ''}
                    {unnamed ? ` · ${unnamed} empty ${unnamed === 1 ? 'row' : 'rows'} skipped` : ''}
                  </span>
                </div>
                <div className="table-wrap">
                  <table className="rcp-table rcp-edit">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        {COLUMNS.map((c) => (
                          <th key={c.key} scope="col">
                            {c.label}
                          </th>
                        ))}
                        <th scope="col">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r, i) => {
                        const nameless = !hasName(r);
                        return (
                          <tr
                            key={i}
                            className={`${i === state.previewIdx ? 'is-active' : ''}${nameless ? ' is-unnamed' : ''}`}
                            onFocus={() => i !== state.previewIdx && dispatch({ type: 'SET_PREVIEW', idx: i })}
                            onClick={() => i !== state.previewIdx && dispatch({ type: 'SET_PREVIEW', idx: i })}
                          >
                            <td className="num">{i + 1}</td>
                            {COLUMNS.map((c) => {
                              const value = r[c.key];
                              const missing = direct && !nameless && c.key !== 'first' && c.key !== 'last' && !value.trim();
                              const badPlz = c.key === 'plz' && value.trim() !== '' && !/^\d{4}$/.test(value.trim());
                              return (
                                <td key={c.key}>
                                  <input
                                    id={`rcp-${i}-${c.key}`}
                                    className={`cell-input${missing ? ' is-missing' : ''}${badPlz ? ' is-invalid' : ''}`}
                                    style={{ minWidth: c.width }}
                                    value={value}
                                    placeholder={c.placeholder}
                                    inputMode={c.numeric ? 'numeric' : undefined}
                                    aria-label={`${c.label}, row ${i + 1}`}
                                    aria-invalid={missing || badPlz ? true : undefined}
                                    title={badPlz ? 'Swiss PLZ have 4 digits' : missing ? 'Needed for posting' : undefined}
                                    onChange={(e) => dispatch({ type: 'UPDATE_RECIPIENT', index: i, patch: { [c.key]: e.target.value } })}
                                    onPaste={(e) => onPaste(e, i)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (i === rows.length - 1) addRow();
                                        else document.getElementById(`rcp-${i + 1}-${c.key}`)?.focus();
                                      }
                                    }}
                                  />
                                </td>
                              );
                            })}
                            <td className="row-actions">
                              <Tooltip label="Remove row">
                                <button type="button" className="icon-btn row-remove" aria-label={`Remove row ${i + 1}`} onClick={() => dispatch({ type: 'REMOVE_RECIPIENT', index: i })}>
                                  <UiIcon name="trash" size={15} />
                                </button>
                              </Tooltip>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="table-foot">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => addRow()}>
                    <UiIcon name="plus" size={16} /> Add recipient
                  </button>
                  {rows.length > VISIBLE_ROWS && (
                    <button type="button" className="btn-link" onClick={() => setShowAll((v) => !v)}>
                      {showAll ? `Show the first ${VISIBLE_ROWS}` : `Show all ${rows.length} rows`}
                    </button>
                  )}
                  <span className="muted small table-tip">Tip: paste rows straight from Excel. Enter jumps to the next row.</span>
                </div>
              </>
            ) : (
              <div className="empty">
                <UiIcon name="users" size={28} />
                <p>No list yet. Upload a file above, or type in the names yourself if it’s only a few people.</p>
                <div className="empty-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      dispatch({ type: 'START_MANUAL_LIST' });
                      setFocusRow(0);
                    }}
                  >
                    <UiIcon name="plus" size={16} /> Add people by hand
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'LOAD_SAMPLE' })}>
                    Use example list
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="rcp-side">
            <section className="panel" aria-labelledby="del-title">
              <h2 id="del-title" className="panel-title">
                <UiIcon name="envelope" /> Delivery
              </h2>
              <div className="options">
                <label className="option">
                  <input type="radio" name="delivery" checked={direct} onChange={() => dispatch({ type: 'SET_DELIVERY', delivery: 'direct' })} />
                  <span>
                    <strong>Send each card to its recipient</strong>
                    <span className="muted small">Addressed by hand, stamped and posted by A-Post. {chf(PRICES.postEach)} postage per card, plus the envelope.</span>
                  </span>
                </label>
                <label className="option">
                  <input type="radio" name="delivery" checked={!direct} onChange={() => dispatch({ type: 'SET_DELIVERY', delivery: 'bundle' })} />
                  <span>
                    <strong>Deliver all cards to one address</strong>
                    <span className="muted small">To hand out yourself, for example at the graduation party. {chf(PRICES.bundleFlat)} flat.</span>
                  </span>
                </label>
              </div>
              <label className={`check${direct ? ' is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={direct || state.bulkEnvelopes}
                  disabled={direct}
                  onChange={(e) => dispatch({ type: 'SET_BULK_ENVELOPES', value: e.target.checked })}
                />
                <span>
                  Matching envelopes · {chf(PRICES.envelope)} each
                  {direct && <span className="muted"> (needed for posting)</span>}
                </span>
              </label>
            </section>

            {direct && (
              <section className="panel env-panel" aria-label="Envelope preview">
                <div className="panel-head">
                  <h2 className="panel-title">
                    <UiIcon name="eye" /> Envelope preview
                  </h2>
                </div>
                <div className="desk">
                  <Envelope recipient={current} look={state.look} width={300} />
                </div>
                <Pager />
              </section>
            )}
          </div>
        </div>
      </div>

      <BottomBar
        left={
          <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'GO', step: 'paper' })}>
            <UiIcon name="arrowLeft" /> Change paper
          </button>
        }
        middle={
          <span className="bb-price">
            <strong>
              {n} × {FORMATS[state.format].label} · {chf(q.perCard)} each
            </strong>
            <span className="muted">
              {q.rate ? `${Math.round(q.rate * 100)} % volume price · ` : 'Volume price from 25 pieces · '}
              {direct ? 'posted to each recipient' : 'delivered to one address'}
            </span>
          </span>
        }
        right={
          <button type="button" className="btn btn-primary" disabled={!n} onClick={() => dispatch({ type: 'GO', step: 'design' })}>
            Make it yours <UiIcon name="arrowRight" />
          </button>
        }
      />
    </div>
  );
}
