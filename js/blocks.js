import * as store from './store.js';
import { weekKey, parseISODate } from './dates.js';

export const CATEGORIES = [
  { value: 'synced',  label: 'Synced event' },
  { value: 'focus',   label: 'Focus block' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'task',    label: 'Task / to-do' },
  { value: 'misc',    label: 'Misc' },
];

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${parseInt(h, 10)}:${m}`;
}
export function formatTimeRange(time, endTime) {
  if (!time) return '';
  return endTime ? `${fmt(time)}–${fmt(endTime)}` : fmt(time);
}

export function blockEl(block, { onClick } = {}) {
  const el = document.createElement('div');
  el.className = `block cat-${block.category}`;
  el.dataset.id = block.id;
  const range = formatTimeRange(block.time, block.endTime);
  el.textContent = range ? `${range} ${block.title}` : block.title;
  el.title = el.textContent;
  if (block.calendarId === 'google') {
    el.classList.add('synced-readonly');
  } else if (onClick) {
    el.addEventListener('click', () => onClick(block));
  }
  return el;
}

export async function addBlock(dateStr, data) {
  const wk = weekKey(parseISODate(dateStr));
  const list = await store.getBlocks(wk);
  const block = { id: store.uuid(), date: dateStr, calendarId: null, ...data };
  list.push(block);
  await store.saveBlocks(wk, list);
  return block;
}
export async function updateBlock(dateStr, id, data) {
  const wk = weekKey(parseISODate(dateStr));
  const list = await store.getBlocks(wk);
  const i = list.findIndex(b => b.id === id);
  if (i !== -1) { list[i] = { ...list[i], ...data }; await store.saveBlocks(wk, list); }
}
export async function deleteBlock(dateStr, id) {
  const wk = weekKey(parseISODate(dateStr));
  const list = await store.getBlocks(wk);
  await store.saveBlocks(wk, list.filter(b => b.id !== id));
}

// Edit a block, moving it to a new day if the date changed (preserving its id).
export async function saveBlockEdit(oldDateStr, id, data) {
  const newDate = data.date || oldDateStr;
  if (newDate === oldDateStr) {
    await updateBlock(oldDateStr, id, data);
    return;
  }
  await deleteBlock(oldDateStr, id);
  const wk = weekKey(parseISODate(newDate));
  const list = await store.getBlocks(wk);
  list.push({ id, calendarId: null, ...data, date: newDate });
  await store.saveBlocks(wk, list);
}

function escAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function blockForm({ block, dateStr, onSaved, onCancel }) {
  const editing = !!block;
  const initialDate = block?.date || dateStr;
  const form = document.createElement('form');
  form.className = 'block-form';
  form.innerHTML = `
    <label class="bf-field"><span class="bf-lab">Day</span>
      <input type="date" name="date" value="${escAttr(initialDate)}" required></label>
    <div class="bf-times">
      <label class="bf-field"><span class="bf-lab">Start</span>
        <input type="time" name="time" value="${escAttr(block?.time)}" required></label>
      <label class="bf-field"><span class="bf-lab">End</span>
        <input type="time" name="endTime" value="${escAttr(block?.endTime)}"></label>
    </div>
    <label class="bf-field"><span class="bf-lab">Title</span>
      <input type="text" name="title" value="${escAttr(block?.title)}" placeholder="e.g. Team standup" required></label>
    <label class="bf-field"><span class="bf-lab">Category</span>
      <select name="category">
        ${CATEGORIES.filter(c => c.value !== 'synced')
          .map(c => `<option value="${c.value}" ${block?.category === c.value ? 'selected' : ''}>${c.label}</option>`)
          .join('')}
      </select></label>
    <div class="bf-actions">
      ${editing ? '<button type="button" class="bf-delete">Delete</button>' : ''}
      <button type="button" class="bf-cancel">Cancel</button>
      <button type="submit" class="btn-primary">Save block</button>
    </div>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const date = fd.get('date') || initialDate;
    const data = {
      time: fd.get('time'),
      endTime: fd.get('endTime') || '',
      title: fd.get('title').trim(),
      category: fd.get('category'),
    };
    if (!data.title || !date) return;
    if (editing) await saveBlockEdit(block.date, block.id, { ...data, date });
    else await addBlock(date, data);
    onSaved && onSaved();
  });
  form.querySelector('.bf-cancel').addEventListener('click', () => onCancel && onCancel());
  if (editing) {
    form.querySelector('.bf-delete').addEventListener('click', async () => {
      await deleteBlock(block.date, block.id);
      onSaved && onSaved();
    });
  }
  return form;
}
