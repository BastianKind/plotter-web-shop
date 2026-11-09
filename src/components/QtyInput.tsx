import { useEffect, useState } from 'react';
import { UiIcon } from './UiIcon';

interface Props {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Quantity field with − and + buttons; typing a number works too. */
export function QtyInput({ id, label, value, onChange, min = 1, max = 2000 }: Props) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (text: string) => {
    const n = parseInt(text, 10);
    const next = Number.isNaN(n) ? value : Math.max(min, Math.min(max, n));
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div className="qty">
      <button type="button" className="icon-btn" aria-label="One less" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <UiIcon name="minus" size={16} />
      </button>
      <input
        id={id}
        className="qty-input"
        inputMode="numeric"
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(draft);
        }}
      />
      <button type="button" className="icon-btn" aria-label="One more" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <UiIcon name="plus" size={16} />
      </button>
    </div>
  );
}
