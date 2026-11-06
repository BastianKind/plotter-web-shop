import type { Item } from '../types';

export type Field = 'first' | 'last' | 'city';

/** Placeholders customers can type, in English or German. */
const TOKENS: Record<string, Field> = {
  first_name: 'first',
  firstname: 'first',
  vorname: 'first',
  last_name: 'last',
  lastname: 'last',
  nachname: 'last',
  city: 'city',
  ort: 'city',
};

export const FIELD_LABEL: Record<Field, string> = { first: 'first name', last: 'last name', city: 'city' };

export const INSERTABLE: { token: string; label: string }[] = [
  { token: '{first_name}', label: 'First name' },
  { token: '{last_name}', label: 'Last name' },
  { token: '{city}', label: 'City' },
];

export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'token'; field: Field }
  | { kind: 'unknown'; raw: string };

const TOKEN_RE = /\{([^{}\n]{1,30})\}/g;

export function tokenize(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ kind: 'text', value: text.slice(last, index) });
    const field = TOKENS[m[1].trim().toLowerCase()];
    out.push(field ? { kind: 'token', field } : { kind: 'unknown', raw: m[0] });
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
  return out;
}

export function unknownTokens(text: string): string[] {
  const found = new Set<string>();
  for (const s of tokenize(text)) if (s.kind === 'unknown') found.add(s.raw);
  return [...found];
}

export function usesPlaceholders(items: Item[]): boolean {
  return items.some((i) => i.kind === 'text' && tokenize(i.text).some((s) => s.kind === 'token'));
}
