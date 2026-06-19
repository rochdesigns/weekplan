import { weekDays, toISODate, isSameDay, DOW_SHORT } from './dates.js';
import { blockEl } from './blocks.js';
import { notesEl } from './notes.js';

export function renderWeek(root, { monday, blocks, notes, today, onAdd, onEditBlock }) {
  root.innerHTML = '';
  const byDate = {};
  for (const b of blocks) (byDate[b.date] ||= []).push(b);
  for (const k in byDate) byDate[k].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  weekDays(monday).forEach((day, i) => {
    const dateStr = toISODate(day);
    const col = document.createElement('div');
    col.className = 'day-col';
    if (i >= 5) col.classList.add('weekend');

    const head = document.createElement('div');
    head.className = 'day-head';
    if (isSameDay(day, today)) head.classList.add('is-today');
    head.textContent = `${DOW_SHORT[i].toUpperCase()} ${day.getDate()}`;
    col.appendChild(head);

    const events = document.createElement('div');
    events.className = 'events';
    events.dataset.date = dateStr;
    (byDate[dateStr] || []).forEach(b => events.appendChild(blockEl(b, { onClick: onEditBlock })));
    const add = document.createElement('button');
    add.className = 'add-block';
    add.textContent = '+ Add';
    add.addEventListener('click', () => onAdd(dateStr));
    events.appendChild(add);
    col.appendChild(events);

    col.appendChild(notesEl(dateStr, notes[dateStr] || ''));
    root.appendChild(col);
  });
}
