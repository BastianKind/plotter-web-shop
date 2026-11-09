import { useEffect, useMemo, useRef, useState } from 'react';
import type { IconoirIcon } from '../lib/iconoir';
import { Modal } from './Modal';
import { UiIcon } from './UiIcon';

const PAGE = 240;

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (icon: IconoirIcon) => void;
}

/** Searchable pop-up with the full Iconoir set. The icons load the first time it opens. */
export function IconBrowser({ open, onClose, onPick }: Props) {
  const [icons, setIcons] = useState<IconoirIcon[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch the icon set in the background shortly after the editor opens, so the pop-up is instant.
  useEffect(() => {
    if (icons) return;
    let cancelled = false;
    const load = () =>
      import('../lib/iconoir')
        .then((m) => !cancelled && setIcons(m.ICONOIR))
        .catch(() => !cancelled && setFailed(true));
    const t = window.setTimeout(load, open ? 0 : 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, icons]);

  // Each time the pop-up opens: fresh search, cursor in the search field.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setLimit(PAGE);
    setFailed(false);
    const t = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    if (!icons) return [];
    const words = query.toLowerCase().trim().split(/[\s-]+/).filter(Boolean);
    if (!words.length) return icons;
    return icons.filter((i) => words.every((w) => i.name.includes(w)));
  }, [icons, query]);

  const shown = results.slice(0, limit);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="All icons"
      wide
      footer={
        <p className="muted small">
          Icons by{' '}
          <a href="https://iconoir.com" target="_blank" rel="noreferrer">
            Iconoir
          </a>
          , free to use under the MIT license. They’re drawn in your ink colour, line by line.
        </p>
      }
    >
      <div className="icon-browser">
        <label className="ib-search">
          <UiIcon name="search" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search icons, e.g. heart, flower, coffee"
            aria-label="Search icons"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) onPick(results[0]);
            }}
          />
        </label>

        {failed ? (
          <p className="notice">
            <UiIcon name="alert" size={16} />
            <span>The icons couldn’t be loaded. Check your connection and open this window again.</span>
          </p>
        ) : !icons ? (
          <p className="ib-status muted">Loading icons…</p>
        ) : (
          <>
            <p className="ib-status muted small" aria-live="polite">
              {query ? `${results.length} ${results.length === 1 ? 'icon' : 'icons'} for “${query}”` : `${icons.length} icons`}
              {results.length > shown.length ? ` · showing ${shown.length}` : ''}
            </p>
            {results.length === 0 ? (
              <p className="ib-empty">No icons match “{query}”. Try a simpler word like “star” or “gift”.</p>
            ) : (
              <div className="ib-grid">
                {shown.map((icon) => (
                  <button key={icon.name} type="button" className="ib-tile" title={icon.label} aria-label={`Add ${icon.label.toLowerCase()}`} onClick={() => onPick(icon)}>
                    <span className="ib-svg" dangerouslySetInnerHTML={{ __html: icon.markup }} />
                    <span className="ib-name">{icon.label}</span>
                  </button>
                ))}
              </div>
            )}
            {results.length > shown.length && (
              <button type="button" className="btn btn-secondary ib-more" onClick={() => setLimit((l) => l + PAGE)}>
                Show {Math.min(PAGE, results.length - shown.length)} more
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
