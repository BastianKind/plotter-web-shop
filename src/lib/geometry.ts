import type { Box, Item } from '../types';

export type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const half = (v: number) => Math.round(v * 2) / 2;

/**
 * New box after dragging by (dx, dy) millimetres. Keeps the box on the paper,
 * respects a minimum size and keeps the aspect ratio of icons and images.
 */
export function dragBox(kind: Item['kind'], mode: DragMode, o: Box, dx: number, dy: number, paperW: number, paperH: number): Box {
  if (mode === 'move') {
    return { x: half(clamp(o.x + dx, 0, paperW - o.w)), y: half(clamp(o.y + dy, 0, paperH - o.h)), w: o.w, h: o.h };
  }
  const minW = kind === 'text' ? 12 : 5;
  const minH = kind === 'text' ? 6 : 5;
  const west = mode === 'nw' || mode === 'sw';
  const north = mode === 'nw' || mode === 'ne';
  let left = o.x;
  let top = o.y;
  let right = o.x + o.w;
  let bottom = o.y + o.h;

  if (west) left = clamp(o.x + dx, 0, right - minW);
  else right = clamp(right + dx, left + minW, paperW);
  if (north) top = clamp(o.y + dy, 0, bottom - minH);
  else bottom = clamp(bottom + dy, top + minH, paperH);

  if (kind !== 'text') {
    const ratio = o.h / o.w;
    let w = right - left;
    let h = w * ratio;
    if (north) {
      top = bottom - h;
      if (top < 0) {
        top = 0;
        h = bottom;
        w = h / ratio;
      }
    } else {
      bottom = top + h;
      if (bottom > paperH) {
        bottom = paperH;
        h = paperH - top;
        w = h / ratio;
      }
    }
    if (west) left = right - w;
    else right = left + w;
  }
  return { x: half(left), y: half(top), w: half(right - left), h: half(bottom - top) };
}
