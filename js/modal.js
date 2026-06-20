// Reusable accessible modal. One modal open at a time. Returns a close() fn.
let activeClose = null;

export function openModal({ title, body, onClose }) {
  if (activeClose) activeClose();
  const prevFocus = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  if (title) dialog.setAttribute('aria-label', title);

  const head = document.createElement('div');
  head.className = 'modal-head';
  const h = document.createElement('h2');
  h.className = 'modal-title';
  h.textContent = title || '';
  const x = document.createElement('button');
  x.className = 'modal-close';
  x.type = 'button';
  x.setAttribute('aria-label', 'Close');
  x.textContent = '×';
  x.addEventListener('click', () => close());
  head.append(h, x);

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'modal-body';
  if (body) bodyWrap.appendChild(body);

  dialog.append(head, bodyWrap);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const focusables = () => [...dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    if (activeClose === close) activeClose = null;
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    onClose && onClose();
  }
  activeClose = close;

  const first = focusables().find(el => !el.classList.contains('modal-close')) || focusables()[0];
  if (first && first.focus) first.focus();

  return close;
}
