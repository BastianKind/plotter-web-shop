import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { defaultItems, firstTextId, newId } from '../data/defaults';
import { SAMPLE_LIST_NAME, SAMPLE_RECIPIENTS } from '../data/sample';
import type { Delivery, FormatKey, IconKey, Item, Look, Mode, PlacedOrder, Recipient, Step } from '../types';
import { FORMATS } from '../data/catalog';

export interface ShopState {
  step: Step;
  mode: Mode;
  format: FormatKey;
  items: Item[];
  selectedId: string | null;
  /** Undo/redo history of the design. */
  past: Item[][];
  future: Item[][];
  /** Snapshot taken when a drag or text edit starts; pushed to history on the first real change. */
  pending: Item[] | null;
  look: Look;
  recipients: Recipient[];
  listName: string;
  isSample: boolean;
  listNotes: string[];
  previewIdx: number;
  delivery: Delivery;
  bulkEnvelopes: boolean;
  /** How many copies in "many copies" mode. */
  copies: number;
  order: PlacedOrder | null;
}

export const MAX_COPIES = 2000;

export type Action =
  | { type: 'GO'; step: Step }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_FORMAT'; format: FormatKey }
  | { type: 'SELECT'; id: string | null }
  | { type: 'BEGIN_CHANGE' }
  | { type: 'END_CHANGE' }
  | { type: 'UPDATE_ITEM'; id: string; patch: Partial<Item>; commit?: boolean }
  | { type: 'ADD_TEXT' }
  | { type: 'ADD_ICON'; icon: IconKey }
  | { type: 'ADD_IMAGE'; src: string; name: string }
  | { type: 'DUPLICATE' }
  | { type: 'REMOVE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_LOOK'; patch: Partial<Look> }
  | { type: 'SET_RECIPIENTS'; list: Recipient[]; name: string; isSample: boolean; notes?: string[] }
  | { type: 'LOAD_SAMPLE' }
  | { type: 'START_MANUAL_LIST' }
  | { type: 'UPDATE_RECIPIENT'; index: number; patch: Partial<Recipient> }
  /** Insert rows after `after` (or append). If the row at `replace` is empty, it is replaced. */
  | { type: 'INSERT_RECIPIENTS'; list: Recipient[]; after?: number; replace?: number }
  | { type: 'REMOVE_RECIPIENT'; index: number }
  | { type: 'CLEAR_RECIPIENTS' }
  | { type: 'SET_LIST_NOTES'; notes: string[] }
  | { type: 'SET_PREVIEW'; idx: number }
  | { type: 'SET_DELIVERY'; delivery: Delivery }
  | { type: 'SET_BULK_ENVELOPES'; value: boolean }
  | { type: 'SET_COPIES'; qty: number }
  | { type: 'PLACE_ORDER'; order: PlacedOrder }
  | { type: 'NEW_ORDER' };

const MAX_HISTORY = 60;

function initialState(): ShopState {
  const items = defaultItems('a5', 'single');
  return {
    step: 'paper',
    mode: 'single',
    format: 'a5',
    items,
    selectedId: firstTextId(items),
    past: [],
    future: [],
    pending: null,
    look: { hand: 'jamie', ink: 'charcoal' },
    recipients: [],
    listName: '',
    isSample: false,
    listNotes: [],
    previewIdx: 0,
    delivery: 'direct',
    bulkEnvelopes: true,
    copies: 50,
    order: null,
  };
}

/** Replace the design and record the old one for undo. */
function commitItems(s: ShopState, items: Item[], selectedId = s.selectedId): ShopState {
  return { ...s, items, selectedId, past: [...s.past, s.items].slice(-MAX_HISTORY), future: [], pending: null };
}

export const emptyRecipient = (): Recipient => ({ first: '', last: '', street: '', plz: '', city: '' });
const hasName = (r: Recipient) => Boolean(r.first.trim() || r.last.trim());
const isBlank = (r: Recipient) => !Object.values(r).some((v) => v.trim());

/** Any hand edit turns the example list into the customer's own list. */
function editedList(s: ShopState, recipients: Recipient[], previewIdx = s.previewIdx): ShopState {
  const listName = s.isSample ? 'Example list, edited' : s.listName || 'Added by hand';
  return { ...s, recipients, isSample: false, listName, previewIdx: Math.max(0, Math.min(previewIdx, recipients.length - 1)) };
}

function freshDesign(s: ShopState, format: FormatKey, mode: Mode): ShopState {
  const items = defaultItems(format, mode);
  return { ...s, format, mode, items, selectedId: firstTextId(items), past: [], future: [], pending: null };
}

function reducer(s: ShopState, a: Action): ShopState {
  switch (a.type) {
    case 'GO': {
      if (a.step === 'recipients' && s.mode !== 'bulk') return s;
      const selectedId = a.step === 'design' && !s.items.some((i) => i.id === s.selectedId) ? firstTextId(s.items) : s.selectedId;
      // Rows without a name are dropped once the customer leaves the list.
      if (s.step === 'recipients' && a.step !== 'recipients' && s.recipients.some((r) => !hasName(r))) {
        const recipients = s.recipients.filter(hasName);
        return { ...s, step: a.step, selectedId, recipients, previewIdx: Math.min(s.previewIdx, Math.max(0, recipients.length - 1)) };
      }
      return { ...s, step: a.step, selectedId };
    }
    case 'SET_MODE': {
      const next = freshDesign(s, s.format, a.mode);
      if (a.mode === 'bulk' && !s.recipients.length) {
        return { ...next, recipients: SAMPLE_RECIPIENTS.map((r) => ({ ...r })), listName: SAMPLE_LIST_NAME, isSample: true, listNotes: [], previewIdx: 0 };
      }
      return next;
    }
    case 'SET_FORMAT':
      return freshDesign(s, a.format, s.mode);
    case 'SELECT':
      return s.selectedId === a.id ? s : { ...s, selectedId: a.id };
    case 'BEGIN_CHANGE':
      return { ...s, pending: s.items };
    case 'END_CHANGE':
      return s.pending ? { ...s, pending: null } : s;
    case 'UPDATE_ITEM': {
      const items = s.items.map((it) => (it.id === a.id ? ({ ...it, ...a.patch } as Item) : it));
      if (a.commit) return commitItems(s, items);
      if (s.pending) return { ...s, items, past: [...s.past, s.pending].slice(-MAX_HISTORY), future: [], pending: null };
      return { ...s, items };
    }
    case 'ADD_TEXT': {
      const F = FORMATS[s.format];
      const w = Math.round(F.w * 0.6);
      const h = Math.round(F.h * 0.12);
      const item: Item = { id: newId(), kind: 'text', x: Math.round((F.w - w) / 2), y: Math.round((F.h - h) / 2), w, h, size: 'medium', align: 'left', text: 'A few more words' };
      return commitItems(s, [...s.items, item], item.id);
    }
    case 'ADD_ICON':
    case 'ADD_IMAGE': {
      const F = FORMATS[s.format];
      const size = Math.round(Math.min(F.w, F.h) * 0.16);
      // Line new marks up along the top edge so they don't land on top of each other.
      const slot = s.items.filter((i) => i.kind !== 'text').length % 4;
      const base = { id: newId(), x: Math.round(F.w * 0.1 + slot * (size + 4)), y: Math.round(F.h * 0.06), w: size, h: size };
      const item: Item = a.type === 'ADD_ICON' ? { ...base, kind: 'icon', icon: a.icon } : { ...base, kind: 'image', src: a.src, name: a.name };
      return commitItems(s, [...s.items, item], item.id);
    }
    case 'DUPLICATE': {
      const src = s.items.find((i) => i.id === s.selectedId);
      if (!src) return s;
      const F = FORMATS[s.format];
      const copy = { ...src, id: newId(), x: Math.min(src.x + 6, F.w - src.w), y: Math.min(src.y + 6, F.h - src.h) } as Item;
      return commitItems(s, [...s.items, copy], copy.id);
    }
    case 'REMOVE':
      if (!s.selectedId) return s;
      return commitItems(
        s,
        s.items.filter((i) => i.id !== s.selectedId),
        null,
      );
    case 'UNDO': {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return { ...s, items: prev, past: s.past.slice(0, -1), future: [s.items, ...s.future], pending: null, selectedId: prev.some((i) => i.id === s.selectedId) ? s.selectedId : null };
    }
    case 'REDO': {
      if (!s.future.length) return s;
      const next = s.future[0];
      return { ...s, items: next, past: [...s.past, s.items], future: s.future.slice(1), pending: null, selectedId: next.some((i) => i.id === s.selectedId) ? s.selectedId : null };
    }
    case 'SET_LOOK':
      return { ...s, look: { ...s.look, ...a.patch } };
    case 'SET_RECIPIENTS':
      return { ...s, recipients: a.list, listName: a.name, isSample: a.isSample, listNotes: a.notes ?? [], previewIdx: 0 };
    case 'LOAD_SAMPLE':
      return { ...s, recipients: SAMPLE_RECIPIENTS.map((r) => ({ ...r })), listName: SAMPLE_LIST_NAME, isSample: true, listNotes: [], previewIdx: 0 };
    case 'START_MANUAL_LIST':
      return { ...s, recipients: [emptyRecipient()], listName: 'Added by hand', isSample: false, listNotes: [], previewIdx: 0 };
    case 'UPDATE_RECIPIENT': {
      if (!s.recipients[a.index]) return s;
      const recipients = s.recipients.map((r, i) => (i === a.index ? { ...r, ...a.patch } : r));
      return editedList(s, recipients, a.index);
    }
    case 'INSERT_RECIPIENTS': {
      const list = [...s.recipients];
      let at: number;
      if (a.replace != null && list[a.replace] && isBlank(list[a.replace])) {
        list.splice(a.replace, 1, ...a.list);
        at = a.replace;
      } else {
        at = a.after != null ? a.after + 1 : list.length;
        list.splice(at, 0, ...a.list);
      }
      return editedList(s, list, at);
    }
    case 'REMOVE_RECIPIENT': {
      const recipients = s.recipients.filter((_, i) => i !== a.index);
      const next = editedList(s, recipients, a.index <= s.previewIdx ? s.previewIdx - 1 : s.previewIdx);
      return recipients.length ? next : { ...next, listName: '' };
    }
    case 'CLEAR_RECIPIENTS':
      return { ...s, recipients: [], listName: '', isSample: false, listNotes: [], previewIdx: 0 };
    case 'SET_LIST_NOTES':
      return { ...s, listNotes: a.notes };
    case 'SET_PREVIEW':
      return { ...s, previewIdx: Math.max(0, Math.min(a.idx, s.recipients.length - 1)) };
    case 'SET_DELIVERY':
      return { ...s, delivery: a.delivery };
    case 'SET_BULK_ENVELOPES':
      return { ...s, bulkEnvelopes: a.value };
    case 'SET_COPIES':
      return { ...s, copies: Math.max(1, Math.min(MAX_COPIES, Math.round(a.qty) || 1)) };
    case 'PLACE_ORDER':
      return { ...s, order: a.order, step: 'done' };
    case 'NEW_ORDER':
      return initialState();
    default:
      return s;
  }
}

const ShopContext = createContext<{ state: ShopState; dispatch: Dispatch<Action> } | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  return <ShopContext.Provider value={{ state, dispatch }}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}
