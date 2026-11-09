export type Step = 'paper' | 'recipients' | 'design' | 'checkout' | 'done';
/** One note to one address, the same design many times (e.g. business cards), or a personal card per recipient. */
export type Mode = 'single' | 'copies' | 'bulk';
export type FormatKey = 'a4' | 'a5' | 'card';
export type HandKey = 'jamie' | 'noah' | 'lea' | 'own';
export type InkKey = 'charcoal' | 'blue' | 'sepia';
export type SizeKey = 'small' | 'medium' | 'large' | 'mixed';
export type Align = 'left' | 'center' | 'right' | 'justify';
export type Delivery = 'direct' | 'bundle';
export type Shipping = 'standard' | 'express';
export type IconKey =
  | 'sun'
  | 'flower'
  | 'leaf'
  | 'star'
  | 'mountain'
  | 'sparkle'
  | 'heart'
  | 'smile'
  | 'gift'
  | 'cake'
  | 'cup'
  | 'music';

/** Position and size on the paper, in millimetres. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextItem extends Box {
  id: string;
  kind: 'text';
  text: string;
  size: SizeKey;
  align: Align;
}

export interface IconItem extends Box {
  id: string;
  kind: 'icon';
  icon: IconKey;
}

export interface ImageItem extends Box {
  id: string;
  kind: 'image';
  src: string;
  name: string;
}

/** A line icon from the Iconoir library, drawn in the ink colour. */
export interface SvgItem extends Box {
  id: string;
  kind: 'svg';
  name: string;
  markup: string;
}

export type Item = TextItem | IconItem | ImageItem | SvgItem;

export interface Recipient {
  first: string;
  last: string;
  street: string;
  plz: string;
  city: string;
}

export interface Look {
  hand: HandKey;
  ink: InkKey;
}

export interface PlacedOrder {
  number: string;
  mode: Mode;
  firstName: string;
  email: string;
  count: number;
  total: number;
  direct: boolean;
  express: boolean;
  placedAt: number;
}
