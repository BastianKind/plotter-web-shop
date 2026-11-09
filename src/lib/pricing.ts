import { FORMATS, HANDS, PRICES } from '../data/catalog';
import type { Delivery, FormatKey, HandKey, Shipping } from '../types';

/** Swiss prices round to 5 Rappen. */
export const r05 = (x: number) => Math.round(x * 20) / 20;

export function chf(x: number): string {
  const v = Math.round(Math.abs(x) * 100) / 100;
  return `${x < 0 ? '−' : ''}CHF ${v.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const piecePrice = (format: FormatKey, hand: HandKey) => FORMATS[format].price + HANDS[hand].fee;

export function volumeRate(count: number): number {
  if (count >= 250) return 0.2;
  if (count >= 100) return 0.15;
  if (count >= 25) return 0.1;
  return 0;
}

export interface SingleQuote {
  piece: number;
  qty: number;
  writing: number;
  envelopes: number;
  shipping: number;
  total: number;
}

export function singleQuote(format: FormatKey, hand: HandKey, qty: number, envelope: boolean, shipping: Shipping): SingleQuote {
  const piece = piecePrice(format, hand);
  const writing = piece * qty;
  const envelopes = envelope ? PRICES.envelope * qty : 0;
  const ship = shipping === 'express' ? PRICES.express : PRICES.standard;
  return { piece, qty, writing, envelopes, shipping: ship, total: writing + envelopes + ship };
}

/** Up to this many copies fit in a letter; more go as one parcel. */
export const COPIES_LETTER_MAX = 10;

export interface CopiesQuote {
  qty: number;
  base: number;
  rate: number;
  perCard: number;
  gross: number;
  discount: number;
  writing: number;
  envelopes: number;
  parcel: boolean;
  shipping: number;
  total: number;
}

/** The same design many times, all delivered to the customer. */
export function copiesQuote(format: FormatKey, hand: HandKey, qty: number, envelope: boolean, shipping: Shipping): CopiesQuote {
  const base = piecePrice(format, hand);
  const rate = volumeRate(qty);
  const perCard = r05(base * (1 - rate));
  const gross = base * qty;
  const writing = perCard * qty;
  const envelopes = envelope ? PRICES.envelope * qty : 0;
  const parcel = qty > COPIES_LETTER_MAX;
  const ship = parcel ? PRICES.bundleFlat : shipping === 'express' ? PRICES.express : PRICES.standard;
  return { qty, base, rate, perCard, gross, discount: gross - writing, writing, envelopes, parcel, shipping: ship, total: writing + envelopes + ship };
}

export interface BulkQuote {
  count: number;
  base: number;
  rate: number;
  perCard: number;
  gross: number;
  discount: number;
  writing: number;
  envelopeCount: number;
  envelopes: number;
  postage: number;
  direct: boolean;
  total: number;
}

export function bulkQuote(format: FormatKey, hand: HandKey, count: number, delivery: Delivery, envelopesWanted: boolean): BulkQuote {
  const base = piecePrice(format, hand);
  const rate = volumeRate(count);
  const perCard = r05(base * (1 - rate));
  const gross = base * count;
  const writing = perCard * count;
  const direct = delivery === 'direct';
  // Posted cards always need an envelope.
  const envelopeCount = direct || envelopesWanted ? count : 0;
  const envelopes = envelopeCount * PRICES.envelope;
  const postage = count ? (direct ? count * PRICES.postEach : PRICES.bundleFlat) : 0;
  return { count, base, rate, perCard, gross, discount: gross - writing, writing, envelopeCount, envelopes, postage, direct, total: writing + envelopes + postage };
}
