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

/** Starter design for each paper, so the editor never opens empty. */
export function defaultItems(format: FormatKey, mode: Mode): Item[] {
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
