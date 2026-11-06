import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { UiIcon } from './UiIcon';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  /** Optional richer rendering inside the list, e.g. a handwriting sample. */
  preview?: ReactNode;
  swatch?: string;
}

interface Props<T extends string> {
  id: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  valueStyle?: CSSProperties;
}

/** A dropdown that can show previews (fonts, ink colours) in its list. */
export function Select<T extends string>({ id, value, options, onChange, valueStyle }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const choose = (v: T) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[active].value);
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={`select${open ? ' is-open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className="select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {current.swatch && <span className="swatch" style={{ background: current.swatch }} />}
        <span className="select-value" style={valueStyle}>
          {current.label}
        </span>
        <UiIcon name="chevronDown" size={16} className="select-chev" />
      </button>
      {open && (
        <ul className="select-list" role="listbox" id={`${id}-list`} aria-labelledby={id}>
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`select-opt${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o.value)}
            >
              {o.swatch && <span className="swatch" style={{ background: o.swatch }} />}
              <span className="opt-main">
                {o.preview ?? <span className="opt-label">{o.label}</span>}
                {o.hint && <span className="opt-hint">{o.hint}</span>}
              </span>
              {o.value === value && <UiIcon name="check" size={15} className="opt-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
