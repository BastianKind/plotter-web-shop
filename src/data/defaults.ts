import type { FormatKey, Item, Mode } from '../types';

export const newId = () => Math.random().toString(36).slice(2, 10);

const A4_SINGLE = `Dear you,

Some things deserve
a little more than
a message on a screen.

Here's to new stories,
slow mornings, and
letters worth keeping.

Yours, always`;

const A4_BULK = `Dear {first_name},

congratulations on finishing
your apprenticeship! Three years
of early mornings and hard work,
and it shows.

All the best for what comes next.

Your training team`;

const A5_SINGLE = `Dear Alex,

A little note to say a big thank you.
Life is brighter with you in it.

With love,
Jamie`;

const A5_BULK = `Dear {first_name},

Congratulations on your
apprenticeship! It was great
having you with us.

All the best,
Your training team`;

const A4_COPIES = `You're invited!

Summer evening at Keller Florals
Saturday, 4 July, from 5 pm
Bahnhofstrasse 1, St. Gallen

Flowers, drinks and good company.
We'd love to see you there.`;

const A5_COPIES = `Thank you for your order!

Every piece is made by hand
in our little shop. We hope
it brings you joy.

Lena & the Keller Florals team`;

/** Same design for every copy: a business card with logo, business, name, role and contact. */
function copiesItems(format: FormatKey): Item[] {
  if (format === 'a4') {
    return [
      { id: newId(), kind: 'icon', icon: 'sun', x: 22, y: 22, w: 20, h: 20 },
      { id: newId(), kind: 'text', x: 22, y: 50, w: 166, h: 200, size: 'mixed', align: 'left', text: A4_COPIES },
    ];
  }
  if (format === 'a5') {
    return [
      { id: newId(), kind: 'icon', icon: 'flower', x: 64, y: 16, w: 20, h: 20 },
      { id: newId(), kind: 'text', x: 20, y: 46, w: 108, h: 120, size: 'medium', align: 'left', text: A5_COPIES },
    ];
  }
  return [
    { id: newId(), kind: 'icon', icon: 'flower', x: 5, y: 5, w: 11, h: 11 },
    { id: newId(), kind: 'text', x: 20, y: 6.5, w: 60, h: 8, size: 'medium', align: 'right', text: 'Keller Florals' },
    { id: newId(), kind: 'text', x: 5, y: 23, w: 75, h: 9, size: 'large', align: 'left', text: 'Lena Keller' },
    { id: newId(), kind: 'text', x: 5, y: 32, w: 75, h: 6, size: 'small', align: 'left', text: 'Florist & Owner' },
    { id: newId(), kind: 'text', x: 5, y: 44, w: 75, h: 6, size: 'small', align: 'left', text: 'lena@kellerflorals.ch · 071 222 33 44' },
  ];
}

/** Starter design for each paper, so the editor never opens empty. */
export function defaultItems(format: FormatKey, mode: Mode): Item[] {
  if (mode === 'copies') return copiesItems(format);
  const bulk = mode === 'bulk';
  if (format === 'a4') {
    return [{ id: newId(), kind: 'text', x: 22, y: 22, w: 166, h: 236, size: 'mixed', align: 'left', text: bulk ? A4_BULK : A4_SINGLE }];
  }
  if (format === 'a5') {
    return [
      { id: newId(), kind: 'icon', icon: 'sun', x: 64, y: 16, w: 20, h: 20 },
      { id: newId(), kind: 'text', x: 20, y: 46, w: 108, h: 120, size: 'medium', align: 'left', text: bulk ? A5_BULK : A5_SINGLE },
    ];
  }
  return [
    { id: newId(), kind: 'icon', icon: 'sparkle', x: 38, y: 5, w: 9, h: 9 },
    { id: newId(), kind: 'text', x: 6, y: 16, w: 73, h: 15, size: 'large', align: 'center', text: bulk ? 'Thank you, {first_name}!' : 'Nice to meet you.' },
    {
      id: newId(),
      kind: 'text',
      x: 6,
      y: 37,
      w: 73,
      h: 8,
      size: 'small',
      align: 'center',
      text: bulk ? 'plotter studio · St. Gallen' : 'Jamie Park · hello@jamie.studio',
    },
  ];
}

export function firstTextId(items: Item[]): string | null {
  return items.find((i) => i.kind === 'text')?.id ?? null;
}
