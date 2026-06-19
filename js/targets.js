import * as store from './store.js';

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
  add.addEventListener('click', async () => {
    const text = prompt('New target:');
    if (text && text.trim()) {
      targets.push({ id: store.uuid(), text: text.trim(), done: false });
      await store.saveTargets(weekKey, targets);
      renderTargets(container, weekKey);
    }
  });
  container.appendChild(add);
}
