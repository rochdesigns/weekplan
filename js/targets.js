import * as store from './store.js';
import { openModal } from './modal.js';

export async function renderTargets(container, weekKey) {
  const targets = await store.getTargets(weekKey);
  container.innerHTML = '';

  targets.forEach(t => {
    const row = document.createElement('div');
    row.className = 'target-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!t.done;
    cb.addEventListener('change', async () => {
      t.done = cb.checked;
      await store.saveTargets(weekKey, targets);
      renderTargets(container, weekKey);
    });
    const span = document.createElement('span');
    span.className = 'target-text' + (t.done ? ' done' : '');
    span.textContent = t.text;
    const del = document.createElement('button');
    del.className = 'target-del';
    del.textContent = '×';
    del.title = 'Delete target';
    del.addEventListener('click', async () => {
      await store.saveTargets(weekKey, targets.filter(x => x.id !== t.id));
      renderTargets(container, weekKey);
    });
    row.append(cb, span, del);
    container.appendChild(row);
  });

  const add = document.createElement('button');
  add.className = 'target-add';
  add.textContent = '+ Add target';
  add.addEventListener('click', () => openTargetForm(container, weekKey, targets));
  container.appendChild(add);
}

function openTargetForm(container, weekKey, targets) {
  let close;
  const form = document.createElement('form');
  form.className = 'target-form';
  form.innerHTML = `
    <label class="bf-field"><span class="bf-lab">Target</span>
      <input type="text" name="text" placeholder="e.g. Ship plugin v2.32.0" required></label>
    <div class="bf-actions">
      <button type="button" class="bf-cancel">Cancel</button>
      <button type="submit" class="btn-primary">Add target</button>
    </div>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = new FormData(form).get('text').trim();
    if (!text) return;
    targets.push({ id: store.uuid(), text, done: false });
    await store.saveTargets(weekKey, targets);
    if (close) close();
    renderTargets(container, weekKey);
  });
  form.querySelector('.bf-cancel').addEventListener('click', () => { if (close) close(); });
  close = openModal({ title: 'New target', body: form });
}
