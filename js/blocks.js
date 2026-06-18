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

export function blockForm({ block, dateStr, onSaved, onCancel }) {
  const editing = !!block;
  const form = document.createElement('form');
  form.className = 'block-form';
  form.innerHTML = `
    <div class="bf-row">
      <input type="time" name="time" value="${block?.time || ''}" required>
      <span class="bf-dash">–</span>
      <input type="time" name="endTime" value="${block?.endTime || ''}">
    </div>
    <input type="text" name="title" placeholder="Title" value="${block?.title ? block.title.replace(/"/g, '&quot;') : ''}" required>
    <select name="category">
      ${CATEGORIES.filter(c => c.value !== 'synced')
        .map(c => `<option value="${c.value}" ${block?.category === c.value ? 'selected' : ''}>${c.label}</option>`)
        .join('')}
    </select>
    <div class="bf-actions">
      <button type="submit" class="btn-primary">Save</button>
      <button type="button" class="bf-cancel">Cancel</button>
      ${editing ? '<button type="button" class="bf-delete">Delete</button>' : ''}
    </div>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      time: fd.get('time'),
      endTime: fd.get('endTime') || '',
      title: fd.get('title').trim(),
      category: fd.get('category'),
    };
    if (!data.title) return;
    if (editing) await updateBlock(dateStr, block.id, data);
    else await addBlock(dateStr, data);
    onSaved && onSaved();
  });
  form.querySelector('.bf-cancel').addEventListener('click', () => onCancel && onCancel());
  if (editing) {
    form.querySelector('.bf-delete').addEventListener('click', async () => {
      await deleteBlock(dateStr, block.id);
      onSaved && onSaved();
    });
  }
  return form;
}
