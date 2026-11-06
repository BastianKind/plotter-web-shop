import { useRef, useState } from 'react';
import { BottomBar, Pager } from '../components/Bars';
import { Envelope } from '../components/Envelope';
import { useToast } from '../components/Toast';
import { Tooltip } from '../components/Tooltip';
import { UiIcon } from '../components/UiIcon';
import { FORMATS, PRICES } from '../data/catalog';
import { bulkQuote, chf } from '../lib/pricing';
import { MAX_ROWS, downloadTemplate, isComplete, readRecipientFile } from '../lib/recipients';
import { useShop } from '../state/shop';

export function Recipients() {
  const { state, dispatch } = useShop();
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const n = state.recipients.length;
  const incomplete = state.recipients.filter((r) => !isComplete(r)).length;
  const direct = state.delivery === 'direct';
  const q = bulkQuote(state.format, state.look.hand, n, state.delivery, state.bulkEnvelopes);
  const current = state.recipients[state.previewIdx] ?? null;

  const load = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { list, cut } = await readRecipientFile(file);
      if (!list.length) throw new Error(`No recipients found in “${file.name}”. Put one person per row, with a first or last name.`);
      dispatch({ type: 'SET_RECIPIENTS', list, name: file.name, isSample: false, notes: cut ? [`Only the first ${MAX_ROWS} rows were read.`] : [] });
      toast(`${list.length} recipients loaded from ${file.name}`, 'success');
    } catch (err) {
      dispatch({ type: 'SET_LIST_NOTES', notes: [err instanceof Error ? err.message : 'That file couldn’t be read. Upload a .xlsx or .csv file with one person per row.'] });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const notes = [...state.listNotes];
  if (incomplete && direct) {
    notes.push(`${incomplete} ${incomplete === 1 ? 'row has' : 'rows have'} no complete address. Fix ${incomplete === 1 ? 'it' : 'them'} in your file, or deliver all cards to one address.`);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Bulk order</p>
          <h1 className="page-title">Who should get one?</h1>
          <p className="page-sub">Upload your list. Every card is written with the recipient’s name, and we can address and post each one for you.</p>
        </div>

        <div className="rcp-grid">
          <section className="panel" aria-labelledby="rcp-title">
            <div className="panel-head">
              <h2 id="rcp-title" className="panel-title">
                <UiIcon name="users" /> Recipients
              </h2>
              {n > 0 && <span className={`chip${state.isSample ? '' : ' chip-blue'}`}>{state.isSample ? 'Example list' : 'Your list'}</span>}
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
                <span className="muted small">One row per card. Columns: First name, Last name, Street, PLZ, City.</span>
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
              {n > 0 && (
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

            {n > 0 ? (
              <>
                <div className="list-meta">
                  <strong>{state.listName}</strong>
                  <span className="muted">
                    {n} {n === 1 ? 'recipient' : 'recipients'}
                    {incomplete ? ` · ${incomplete} without address` : ''}
                  </span>
                </div>
                <div className="table-wrap">
                  <table className="rcp-table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">First name</th>
                        <th scope="col">Last name</th>
                        <th scope="col">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.recipients.map((r, i) => {
                        const ok = isComplete(r);
                        return (
                          <tr
                            key={i}
                            className={i === state.previewIdx ? 'is-active' : undefined}
                            tabIndex={0}
                            aria-current={i === state.previewIdx ? 'true' : undefined}
                            onClick={() => dispatch({ type: 'SET_PREVIEW', idx: i })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                dispatch({ type: 'SET_PREVIEW', idx: i });
                              }
                            }}
                          >
                            <td className="num">{i + 1}</td>
                            <td>{r.first}</td>
                            <td>{r.last}</td>
                            <td className={ok ? undefined : 'bad'}>
                              {ok ? (
                                `${r.street}, ${r.plz} ${r.city}`
                              ) : (
                                <Tooltip label="This card can’t be posted without street, PLZ and city.">
                                  <span className="bad-cell">
                                    <UiIcon name="alert" size={14} /> Address missing
                                  </span>
                                </Tooltip>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty">
                <UiIcon name="users" size={28} />
                <p>No list yet. Upload a file above or use the example list to try it out.</p>
                <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'LOAD_SAMPLE' })}>
                  Use example list
                </button>
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
                    <span className="muted small">
                      Addressed by hand, stamped and posted by A-Post. {chf(PRICES.postEach)} per card, envelope included.
                    </span>
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
            <span className="muted">{q.rate ? `${Math.round(q.rate * 100)} % volume price · ` : 'Volume price from 25 pieces · '}{direct ? 'posted to each recipient' : 'delivered to one address'}</span>
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
