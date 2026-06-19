import { startOfWeek, weekDays, toISODate, isSameDay, MONTHS } from './dates.js';

export function renderMiniCal(container, {
  viewYear, viewMonth, selectedMonday, today, eventDates,
  onPrevMonth, onNextMonth, onPickDay,
}) {
  container.innerHTML = '';
  const weekSet = new Set(weekDays(selectedMonday).map(toISODate));

  const head = document.createElement('div');
  head.className = 'mc-head';
  const prev = document.createElement('button'); prev.textContent = '‹'; prev.className = 'mc-nav';
  const title = document.createElement('span'); title.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  const next = document.createElement('button'); next.textContent = '›'; next.className = 'mc-nav';
  prev.addEventListener('click', onPrevMonth);
  next.addEventListener('click', onNextMonth);
  head.append(prev, title, next);
  container.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'mc-grid';
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
    const c = document.createElement('div'); c.className = 'mc-dow'; c.textContent = d;
    grid.appendChild(c);
  });

  // 6 weeks (42 cells) starting from the Monday on/before the 1st of the month.
  const start = startOfWeek(new Date(viewYear, viewMonth, 1));
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const cell = document.createElement('button');
    cell.className = 'mc-day';
    cell.textContent = d.getDate();
    const iso = toISODate(d);
    if (d.getMonth() !== viewMonth) cell.classList.add('other-month');
    if (weekSet.has(iso)) cell.classList.add('in-week');
    if (isSameDay(d, today)) cell.classList.add('is-today');
    if (eventDates.has(iso)) cell.classList.add('has-event');
    cell.addEventListener('click', () => onPickDay(d));
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}
