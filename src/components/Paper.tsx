import type { CSSProperties } from 'react';
import { FORMATS, HANDS, INKS } from '../data/catalog';
import { FIELD_LABEL, tokenize } from '../lib/personalize';
import type { FormatKey, Item, Look, Recipient, TextItem } from '../types';
import { PaperIcon } from './PaperIcon';

function Line({ line, recipient }: { line: string; recipient: Recipient | null }) {
  return (
    <>
      {tokenize(line).map((s, i) => {
        if (s.kind === 'text') return <span key={i}>{s.value}</span>;
        if (s.kind === 'unknown')
          return (
            <mark key={i} className="unk">
              {s.raw}
            </mark>
          );
        return recipient ? (
          <span key={i}>{recipient[s.field]}</span>
        ) : (
          <mark key={i} className="tok">
            {FIELD_LABEL[s.field]}
          </mark>
        );
      })}
    </>
  );
}

function TextContent({ item, format, look, recipient, scale }: { item: TextItem; format: FormatKey; look: Look; recipient: Recipient | null; scale: number }) {
  const sizes = FORMATS[format].type;
  const factor = HANDS[look.hand].factor;
  const body = (item.size === 'mixed' ? sizes.medium : sizes[item.size]) * factor * scale;
  const lines = item.text.split('\n');
  const leadIdx = item.size === 'mixed' ? lines.findIndex((l) => l.trim() !== '') : -1;
  return (
    <div className="pt" style={{ fontFamily: HANDS[look.hand].family, color: INKS[look.ink].color, fontSize: body, textAlign: item.align }}>
      {lines.map((line, i) => (
        <div key={i} className="pt-line" style={i === leadIdx ? { fontSize: sizes.lead * factor * scale } : undefined}>
          {line === '' ? ' ' : <Line line={line} recipient={recipient} />}
        </div>
      ))}
    </div>
  );
}

export function ItemContent({ item, format, look, recipient, scale }: { item: Item; format: FormatKey; look: Look; recipient: Recipient | null; scale: number }) {
  if (item.kind === 'text') return <TextContent item={item} format={format} look={look} recipient={recipient} scale={scale} />;
  if (item.kind === 'icon') return <PaperIcon icon={item.icon} color={INKS[look.ink].color} />;
  // Markup comes from the bundled Iconoir package, not from users.
  if (item.kind === 'svg') return <span className="psvg" style={{ color: INKS[look.ink].color }} dangerouslySetInnerHTML={{ __html: item.markup }} />;
  return <img className="pimg" src={item.src} alt={item.name} draggable={false} />;
}

interface SurfaceProps {
  format: FormatKey;
  look: Look;
  items: Item[];
  width: number;
  recipient?: Recipient | null;
  className?: string;
  style?: CSSProperties;
}

/** A finished note, drawn to scale. Used for previews and thumbnails. */
export function PaperSurface({ format, look, items, width, recipient = null, className = '', style }: SurfaceProps) {
  const F = FORMATS[format];
  const scale = width / F.w;
  return (
    <div className={`paper ${className}`} style={{ width, height: F.h * scale, ...style }}>
      {items.map((it) => (
        <div key={it.id} className="pitem" style={{ left: it.x * scale, top: it.y * scale, width: it.w * scale, height: it.h * scale }}>
          <ItemContent item={it} format={format} look={look} recipient={recipient} scale={scale} />
        </div>
      ))}
    </div>
  );
}
