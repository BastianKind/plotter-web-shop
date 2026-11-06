import type { FormatKey, HandKey, IconKey, InkKey, SizeKey } from '../types';

export interface FormatInfo {
  label: string;
  /** Paper size in mm. */
  w: number;
  h: number;
  price: number;
  sizeLabel: string;
  blurb: string;
  orientation: 'Portrait' | 'Landscape';
  noun: string;
  badge?: string;
  /** Handwriting sizes in mm, before the handwriting style's own factor. */
  type: { small: number; medium: number; large: number; lead: number };
}

export const FORMATS: Record<FormatKey, FormatInfo> = {
  a4: {
    label: 'A4',
    w: 210,
    h: 297,
    price: 4.5,
    sizeLabel: '210 × 297 mm',
    blurb: 'For longer letters & big ideas.',
    orientation: 'Portrait',
    noun: 'note',
    type: { small: 6, medium: 8.5, large: 11, lead: 12 },
  },
  a5: {
    label: 'A5',
    w: 148,
    h: 210,
    price: 3.5,
    sizeLabel: '148 × 210 mm',
    blurb: 'A little room for something personal.',
    orientation: 'Portrait',
    noun: 'note',
    badge: 'A little favorite',
    type: { small: 4.6, medium: 6.4, large: 8.4, lead: 9 },
  },
  card: {
    label: 'Business card',
    w: 85,
    h: 55,
    price: 2,
    sizeLabel: '85 × 55 mm',
    blurb: 'Small in size. Lasting in impression.',
    orientation: 'Landscape',
    noun: 'card',
    type: { small: 2.8, medium: 4, large: 6, lead: 6.2 },
  },
};

export const FORMAT_ORDER: FormatKey[] = ['a4', 'a5', 'card'];

export interface HandInfo {
  label: string;
  short: string;
  family: string;
  /** Scales the handwriting so every style has a similar visual size. */
  factor: number;
  fee: number;
  hint?: string;
}

export const HANDS: Record<HandKey, HandInfo> = {
  jamie: { label: 'Jamie — easy & natural', short: 'Jamie', family: '"Caveat", "Segoe Print", cursive', factor: 1, fee: 0 },
  noah: { label: 'Noah — neat & upright', short: 'Noah', family: '"Kalam", "Segoe Print", cursive', factor: 0.82, fee: 0 },
  lea: { label: 'Lea — light & airy', short: 'Lea', family: '"Shadows Into Light Two", "Segoe Print", cursive', factor: 0.86, fee: 0 },
  own: {
    label: 'Your own handwriting',
    short: 'Your handwriting',
    family: '"Caveat", "Segoe Print", cursive',
    factor: 1,
    fee: 1,
    hint: '+ CHF 1.00 per piece',
  },
};

export const HAND_ORDER: HandKey[] = ['jamie', 'noah', 'lea', 'own'];

export const INKS: Record<InkKey, { label: string; color: string }> = {
  charcoal: { label: 'Charcoal', color: '#2b2d33' },
  blue: { label: 'Royal blue', color: '#1d3a9a' },
  sepia: { label: 'Sepia', color: '#5b3a22' },
};

export const SIZES: Record<SizeKey, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  mixed: 'Mixed',
};

/** Placeholder prices for the prototype, in CHF. */
export const PRICES = {
  envelope: 0.5,
  standard: 2.5,
  express: 6,
  postEach: 2.5,
  bundleFlat: 9,
};

export const ICONS: { key: IconKey; label: string; group: 'nature' | 'love' }[] = [
  { key: 'sun', label: 'Sun', group: 'nature' },
  { key: 'heart', label: 'Heart', group: 'love' },
  { key: 'flower', label: 'Flower', group: 'nature' },
  { key: 'sparkle', label: 'Sparkle', group: 'love' },
  { key: 'leaf', label: 'Leaf', group: 'nature' },
  { key: 'star', label: 'Star', group: 'nature' },
  { key: 'smile', label: 'Smile', group: 'love' },
  { key: 'cup', label: 'Coffee', group: 'love' },
  { key: 'mountain', label: 'Mountains', group: 'nature' },
  { key: 'gift', label: 'Gift', group: 'love' },
  { key: 'cake', label: 'Cake', group: 'love' },
  { key: 'music', label: 'Music', group: 'love' },
];
