import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { FORMATS, ICONS } from '../data/catalog';
import { clamp, dragBox, type DragMode } from '../lib/geometry';
import { useShop } from '../state/shop';
import type { Box, FormatKey, Item, Look, Recipient } from '../types';
import { ItemContent } from './Paper';

const HANDLES: Exclude<DragMode, 'move'>[] = ['nw', 'ne', 'sw', 'se'];

function itemLabel(item: Item) {
  if (item.kind === 'text') return 'Message · text';
  if (item.kind === 'icon') return `Icon · ${ICONS.find((i) => i.key === item.icon)?.label ?? item.icon}`;
  return `Image · ${item.name}`;
}

interface BoxProps {
  item: Item;
  selected: boolean;
  scale: number;
  format: FormatKey;
  look: Look;
  recipient: Recipient | null;
  onStart: (e: ReactPointerEvent, item: Item, mode: DragMode) => void;
  onKey: (e: KeyboardEvent, item: Item) => void;
  onFocus: (item: Item) => void;
}

function ItemBox({ item, selected, scale, format, look, recipient, onStart, onKey, onFocus }: BoxProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  // Warn when the words no longer fit their box.
  useLayoutEffect(() => {
    const el = innerRef.current?.firstElementChild as HTMLElement | null;
    setOverflow(item.kind === 'text' && !!el && el.scrollHeight > el.clientHeight + 2);
  });

  return (
    <div
      className={`pitem editable-item${selected ? ' is-selected' : ''}${overflow ? ' is-overflowing' : ''}`}
      style={{ left: item.x * scale, top: item.y * scale, width: item.w * scale, height: item.h * scale }}
      tabIndex={0}
      role="button"
      aria-label={`${itemLabel(item)}. Arrow keys move it, Delete removes it.`}
      aria-pressed={selected}
      onPointerDown={(e) => onStart(e, item, 'move')}
      onKeyDown={(e) => onKey(e, item)}
      onFocus={() => onFocus(item)}
    >
      <div className="pitem-inner" ref={innerRef}>
        <ItemContent item={item} format={format} look={look} recipient={recipient} scale={scale} />
      </div>
      {selected && (
        <>
          <span className="pitem-tag">{itemLabel(item)}</span>
          {HANDLES.map((m) => (
            <span key={m} className={`handle h-${m}`} onPointerDown={(e) => onStart(e, item, m)} aria-hidden="true" />
          ))}
        </>
      )}
      {overflow && <span className="pitem-warn">Text doesn’t fit. Drag a corner to make the box bigger.</span>}
    </div>
  );
}

/** The paper in the editor: select, drag and resize items in millimetres. */
export function PaperEditor({ scale, recipient }: { scale: number; recipient: Recipient | null }) {
  const { state, dispatch } = useShop();
  const F = FORMATS[state.format];
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const listeners = useRef<{ move?: (e: PointerEvent) => void; up?: () => void }>({});

  const detach = () => {
    const { move, up } = listeners.current;
    if (move) window.removeEventListener('pointermove', move);
    if (up) {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    }
    listeners.current = {};
  };
  useEffect(() => detach, []);

  const start = (e: ReactPointerEvent, item: Item, mode: DragMode) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).closest<HTMLElement>('.editable-item')?.focus({ preventScroll: true });
    dispatch({ type: 'SELECT', id: item.id });
    dispatch({ type: 'BEGIN_CHANGE' });
    const origin: Box = { x: item.x, y: item.y, w: item.w, h: item.h };
    const sx = e.clientX;
    const sy = e.clientY;
    const move = (ev: PointerEvent) => {
      const box = dragBox(item.kind, mode, origin, (ev.clientX - sx) / scaleRef.current, (ev.clientY - sy) / scaleRef.current, F.w, F.h);
      dispatch({ type: 'UPDATE_ITEM', id: item.id, patch: box });
    };
    const up = () => {
      detach();
      dispatch({ type: 'END_CHANGE' });
    };
    detach();
    listeners.current = { move, up };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onKey = (e: KeyboardEvent, item: Item) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      dispatch({ type: 'REMOVE' });
      return;
    }
    const step = e.shiftKey ? 5 : 1;
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    dispatch({ type: 'UPDATE_ITEM', id: item.id, commit: true, patch: { x: clamp(item.x + d[0], 0, F.w - item.w), y: clamp(item.y + d[1], 0, F.h - item.h) } });
  };

  return (
    <div
      className="paper editable"
      style={{ width: F.w * scale, height: F.h * scale }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) dispatch({ type: 'SELECT', id: null });
      }}
    >
      {state.items.map((item) => (
        <ItemBox
          key={item.id}
          item={item}
          selected={item.id === state.selectedId}
          scale={scale}
          format={state.format}
          look={state.look}
          recipient={recipient}
          onStart={start}
          onKey={onKey}
          onFocus={(it) => dispatch({ type: 'SELECT', id: it.id })}
        />
      ))}
    </div>
  );
}
