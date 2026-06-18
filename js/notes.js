import * as store from './store.js';

export function notesEl(dateStr, text) {
  const wrap = document.createElement('div');
  wrap.className = 'notes';
  const label = document.createElement('div');
  label.className = 'notes-label';
  label.textContent = 'Notes';
  const body = document.createElement('div');
  body.className = 'notes-body';
  body.contentEditable = 'true';
  body.dataset.placeholder = 'Add a note…';
  body.textContent = text || '';
  body.toggleAttribute('data-empty', !(text && text.trim()));
  body.addEventListener('input', () => {
    body.toggleAttribute('data-empty', !body.textContent.trim());
  });
  body.addEventListener('blur', async () => {
    await store.saveNote(dateStr, body.textContent.trim());
  });
  wrap.append(label, body);
  return wrap;
}
