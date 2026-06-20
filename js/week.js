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
    if (isSameDay(day, today)) col.classList.add('is-today');

    const head = document.createElement('div');
    head.className = 'day-head';
    const dow = document.createElement('span');
    dow.className = 'dow';
    dow.textContent = DOW_SHORT[i].toUpperCase();
    const dnum = document.createElement('span');
    dnum.className = 'dnum';
    dnum.textContent = day.getDate();
    head.append(dow, dnum);
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
    applyOverflow(events);

    col.appendChild(notesEl(dateStr, notes[dateStr] || ''));
    root.appendChild(col);
  });
}

function applyOverflow(events) {
  // Run after the element is in the DOM so heights are measured.
  requestAnimationFrame(() => {
    if (events.classList.contains('expanded')) return;
    const add = events.querySelector('.add-block');
    const chips = [...events.querySelectorAll('.block')];
    chips.forEach(c => (c.style.display = ''));
    const existing = events.querySelector('.overflow-badge');
    if (existing) existing.remove();
    if (events.scrollHeight <= events.clientHeight) return;

    const badge = document.createElement('button');
    badge.className = 'overflow-badge';
    badge.addEventListener('click', () => {
      events.classList.add('expanded');
      chips.forEach(c => (c.style.display = ''));
      badge.remove();
    });
    events.insertBefore(badge, add);

    let hidden = 0;
    for (let i = chips.length - 1; i >= 0; i--) {
      if (events.scrollHeight <= events.clientHeight) break;
      chips[i].style.display = 'none';
      hidden++;
    }
    if (hidden === 0) { badge.remove(); return; }
    badge.textContent = `+${hidden} more`;
  });
}
