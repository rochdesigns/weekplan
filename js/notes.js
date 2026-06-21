import * as store from './store.js';
import { sanitizeNotesHtml } from './sanitize.js';

const COMMANDS = [
  { cmd: 'bold',                label: 'B',  title: 'Bold (Ctrl+B)',      style: 'font-weight:700' },
  { cmd: 'italic',              label: 'I',  title: 'Italic (Ctrl+I)',    style: 'font-style:italic' },
  { cmd: 'underline',           label: 'U',  title: 'Underline (Ctrl+U)', style: 'text-decoration:underline' },
  { cmd: 'insertUnorderedList', label: '•',  title: 'Bulleted list' },
  { cmd: 'insertOrderedList',   label: '1.', title: 'Numbered list' },
];

export function notesEl(dateStr, text) {
  const wrap = document.createElement('div');
  wrap.className = 'notes';

  const label = document.createElement('div');
  label.className = 'notes-label';
  label.textContent = 'Notes';

  const toolbar = document.createElement('div');
  toolbar.className = 'notes-toolbar';
  COMMANDS.forEach(({ cmd, label: lbl, title, style }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nt-btn';
    btn.textContent = lbl;
    btn.title = title;
    if (style) btn.setAttribute('style', style);
    // mousedown + preventDefault keeps focus in the editor, so the command applies
    // to the current selection and the editor doesn't blur (which would hide the toolbar).
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      document.execCommand(cmd, false, null);
    });
    toolbar.appendChild(btn);
  });

  const body = document.createElement('div');
  body.className = 'notes-body';
  body.contentEditable = 'true';
  body.dataset.placeholder = 'Add a note…';
  body.innerHTML = sanitizeNotesHtml(text || '');

  const setEmpty = () => body.toggleAttribute('data-empty', !body.textContent.trim());
  setEmpty();

  body.addEventListener('input', setEmpty);
  body.addEventListener('focus', () => wrap.classList.add('editing'));
  body.addEventListener('blur', async () => {
    wrap.classList.remove('editing');
    const visible = body.textContent.trim();
    await store.saveNote(dateStr, visible ? sanitizeNotesHtml(body.innerHTML) : '');
  });

  wrap.append(label, toolbar, body);
  return wrap;
}
