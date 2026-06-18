export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DOW_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function pad2(n) { return String(n).padStart(2, '0'); }

export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  return addDays(d, -dow);
}

export function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;        // Mon=0
  d.setUTCDate(d.getUTCDate() - dayNum + 3);     // Thursday of this week
  const isoYear = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const week = 1 + Math.round((d - week1Monday) / (7 * 86400000));
  return { year: isoYear, week };
}

export function weekKey(date) {
  const { year, week } = getISOWeek(date);
  return `${year}-${pad2(week)}`;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function formatWeekRange(monday) {
  const sun = addDays(monday, 6);
  const m1 = MONTHS[monday.getMonth()], m2 = MONTHS[sun.getMonth()];
  const y1 = monday.getFullYear(), y2 = sun.getFullYear();
  if (y1 !== y2) {
    return `${m1} ${monday.getDate()}, ${y1} – ${m2} ${sun.getDate()}, ${y2}`;
  }
  if (m1 !== m2) {
    return `${m1} ${monday.getDate()} – ${m2} ${sun.getDate()}, ${y1}`;
  }
  return `${m1} ${monday.getDate()} – ${sun.getDate()}, ${y1}`;
}
