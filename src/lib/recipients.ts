import type { Recipient } from '../types';

export const MAX_ROWS = 2000;

export const isComplete = (r: Recipient) => Boolean(r.street && r.plz && r.city);
export const fullName = (r: Recipient) => `${r.first} ${r.last}`.trim();

const HEADERS: Record<keyof Recipient, string[]> = {
  first: ['first name', 'firstname', 'first', 'given name', 'vorname'],
  last: ['last name', 'lastname', 'last', 'surname', 'nachname', 'familienname', 'name'],
  street: ['street', 'street address', 'address', 'strasse', 'straße', 'adresse', 'strasse und nr', 'strasse und nr.'],
  plz: ['plz', 'zip', 'zip code', 'postcode', 'postal code', 'postleitzahl'],
  city: ['city', 'town', 'ort', 'stadt', 'wohnort'],
};

/** Parses CSV with comma, semicolon (Swiss Excel exports) or tab separators. */
export function parseCSV(text: string): string[][] {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  let sep = ',';
  let best = -1;
  for (const c of [';', ',', '\t']) {
    const n = firstLine.split(c).length - 1;
    if (n > best) {
      best = n;
      sep = c;
    }
  }
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const cellText = (c: unknown) => (c == null ? '' : c instanceof Date ? c.toLocaleDateString('de-CH') : String(c)).trim();

export function mapRows(raw: unknown[][]): { list: Recipient[]; cut: boolean } {
  const rows = raw.map((r) => r.map(cellText)).filter((r) => r.some(Boolean));
  if (!rows.length) return { list: [], cut: false };

  const head = rows[0].map((c) => c.toLowerCase().replace(/[:*]/g, '').trim());
  const col: Partial<Record<keyof Recipient, number>> = {};
  (Object.keys(HEADERS) as (keyof Recipient)[]).forEach((key) => {
    const i = head.findIndex((h) => HEADERS[key].includes(h));
    if (i >= 0) col[key] = i;
  });

  let data = rows;
  if (Object.keys(col).length >= 2) data = rows.slice(1);
  else Object.assign(col, { first: 0, last: 1, street: 2, plz: 3, city: 4 });

  const get = (r: string[], k: keyof Recipient) => (col[k] == null ? '' : r[col[k] as number] ?? '');
  const list = data
    .slice(0, MAX_ROWS)
    .map((r) => ({ first: get(r, 'first'), last: get(r, 'last'), street: get(r, 'street'), plz: get(r, 'plz'), city: get(r, 'city') }))
    .filter((r) => r.first || r.last);
  return { list, cut: data.length > MAX_ROWS };
}

async function decodeText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    // CSV exports from Excel on Swiss Windows are often Windows-1252.
    return new TextDecoder('windows-1252').decode(buf);
  }
}

export async function readRecipientFile(file: File): Promise<{ list: Recipient[]; cut: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv' || ext === 'txt') return mapRows(parseCSV(await decodeText(file)));
  if (ext === 'xlsx') {
    const { default: readXlsxFile } = await import('read-excel-file');
    return mapRows(await readXlsxFile(file));
  }
  if (ext === 'xls') throw new Error('Old .xls files can’t be read. Save the list as .xlsx or .csv and upload it again.');
  throw new Error('That file type isn’t supported. Upload a .xlsx or .csv file.');
}

export function downloadTemplate() {
  const csv = 'First name;Last name;Street;PLZ;City\nAnna;Keller;Bahnhofstrasse 1;9000;St. Gallen\nLuca;Baumann;Bergstrasse 14;9240;Uzwil\n';
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plotter-recipients-template.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
