// Loaded on demand (dynamic import) so the ~1,400 icons don't weigh down the first page load.
// Icons: Iconoir (https://iconoir.com), MIT license.

const files = import.meta.glob('/node_modules/iconoir/icons/regular/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface IconoirIcon {
  /** File name, e.g. "coffee-cup". */
  name: string;
  /** Readable name, e.g. "Coffee cup". */
  label: string;
  /** Inline SVG that sizes to its box and draws in currentColor. */
  markup: string;
}

const toLabel = (name: string) => {
  const words = name.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const clean = (raw: string) =>
  raw
    .trim()
    .replace(/<svg\b([^>]*?)\swidth="[^"]*"/, '<svg$1')
    .replace(/<svg\b([^>]*?)\sheight="[^"]*"/, '<svg$1')
    .replace('<svg', '<svg aria-hidden="true" focusable="false"');

export const ICONOIR: IconoirIcon[] = Object.entries(files)
  .map(([path, raw]) => {
    const name = path.split('/').pop()!.replace(/\.svg$/, '');
    return { name, label: toLabel(name), markup: clean(raw) };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
