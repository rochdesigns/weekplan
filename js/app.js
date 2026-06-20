import {
  startOfWeek, addDays, weekDays, toISODate, weekKey, formatWeekRange,
} from './dates.js';
import * as store from './store.js';
import { renderWeek } from './week.js';
import { renderTargets } from './targets.js';
import { renderMiniCal } from './mini-cal.js';
import { blockForm } from './blocks.js';
import { openModal } from './modal.js';
import * as gcal from './gcal.js';

const els = {
  label:   document.getElementById('weeklabel'),
  grid:    document.getElementById('weekgrid'),
  targets: document.getElementById('targets'),
  minical: document.getElementById('minical'),
  pills:   document.getElementById('cal-pills'),
};

const today = new Date();
const state = {
  monday: startOfWeek(today),
  viewYear: today.getFullYear(),
  viewMonth: today.getMonth(),
};

async function render() {
  const wk = weekKey(state.monday);
  const days = weekDays(state.monday);
  const dateStrs = days.map(toISODate);

  const blocks = await store.getBlocks(wk);
  const notes = await store.getNotesForWeek(dateStrs);

  els.label.textContent = formatWeekRange(state.monday);

  renderWeek(els.grid, {
    monday: state.monday, blocks, notes, today,
    onAdd: openAddForm,
    onEditBlock: openEditForm,
  });

  await renderTargets(els.targets, wk);

  const eventDates = new Set(blocks.map(b => b.date));
  renderMiniCal(els.minical, {
    viewYear: state.viewYear, viewMonth: state.viewMonth,
    selectedMonday: state.monday, today, eventDates,
    onPrevMonth: () => { shiftMonth(-1); },
    onNextMonth: () => { shiftMonth(1); },
    onPickDay: (d) => { state.monday = startOfWeek(d); render(); },
  });

  await renderPills();
}

function shiftMonth(delta) {
  let m = state.viewMonth + delta, y = state.viewYear;
  if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
  state.viewMonth = m; state.viewYear = y;
  render();
}

function openAddForm(dateStr) {
  let close;
  const form = blockForm({
    dateStr,
    onSaved: () => { if (close) close(); render(); },
    onCancel: () => { if (close) close(); },
  });
  close = openModal({ title: 'New block', body: form });
}

function openEditForm(block) {
  let close;
  const form = blockForm({
    block, dateStr: block.date,
    onSaved: () => { if (close) close(); render(); },
    onCancel: () => { if (close) close(); },
  });
  close = openModal({ title: 'Edit block', body: form });
}

async function renderPills() {
  const settings = await store.getSettings();
  els.pills.innerHTML = '';
  for (const cal of settings.connectedCalendars) {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = cal === 'google' ? 'Google Cal' : cal;
    els.pills.appendChild(pill);
  }
  const connected = await gcal.isConnected();
  const btn = document.createElement('button');
  btn.className = 'btn-gcal';
  btn.textContent = connected ? 'Disconnect' : 'Connect Google';
  btn.addEventListener('click', async () => {
    if (connected) {
      await gcal.disconnect();
    } else {
      const res = await gcal.connect();
      if (!res.ok && res.reason === 'not-configured') {
        alert('Google Calendar sync is optional and not configured yet.\n' +
              'Add your OAuth client ID in js/gcal.js (CLIENT_ID) to enable it.');
      }
    }
    render();
  });
  els.pills.appendChild(btn);
}

// Navigation
document.getElementById('nav-prev').addEventListener('click', () => {
  state.monday = addDays(state.monday, -7);
  state.viewYear = state.monday.getFullYear(); state.viewMonth = state.monday.getMonth();
  render();
});
document.getElementById('nav-next').addEventListener('click', () => {
  state.monday = addDays(state.monday, 7);
  state.viewYear = state.monday.getFullYear(); state.viewMonth = state.monday.getMonth();
  render();
});
document.getElementById('nav-today').addEventListener('click', () => {
  state.monday = startOfWeek(new Date());
  state.viewYear = new Date().getFullYear(); state.viewMonth = new Date().getMonth();
  render();
});
document.getElementById('btn-add').addEventListener('click', () => {
  // Default the new block to today when the current week is in view, else the viewed Monday.
  const inView = weekKey(today) === weekKey(state.monday);
  openAddForm(inView ? toISODate(today) : toISODate(state.monday));
});

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
  });
}
