export function addWorkdays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return d;
}

export const shortDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });

/** "12–16 Nov" or "28 Nov – 2 Dec". */
export function dayRange(a: Date, b: Date): string {
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${month(b)}` : `${a.getDate()} ${month(a)} – ${b.getDate()} ${month(b)}`;
}

/** When an order is written, posted and delivered. Bigger bulk orders take longer to write. */
export function schedule(count: number, express: boolean, from = new Date()) {
  const writeDays = express ? 2 : count > 200 ? 5 : count > 50 ? 4 : 3;
  const start = addWorkdays(from, 1);
  const end = addWorkdays(from, writeDays);
  const posted = addWorkdays(end, 1);
  const arrives = addWorkdays(posted, 1);
  const latest = addWorkdays(arrives, 1);
  return { start, end, posted, arrives, latest };
}

export function arrivalRange(count: number, express: boolean, now = new Date()) {
  const s = schedule(count, express, now);
  return dayRange(s.arrives, s.latest);
}

export function orderNumber(now = new Date()): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `PL-${yy}${mm}-${Math.floor(1000 + Math.random() * 9000)}`;
}
