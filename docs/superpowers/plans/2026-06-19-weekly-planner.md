# Weekly Planner (Weekplan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side, no-backend weekly planner PWA (vanilla HTML/CSS/JS) that shows the current week, supports manual blocks, per-day notes, weekly targets, a mini month calendar, week navigation, and an optional (stubbed) Google Calendar connect.

**Architecture:** Static single-page app, no build step, ES modules loaded directly in the browser. `store.js` is the only module that touches `localStorage` and exposes an **async** interface (the one forward-compat hook for a future backend). Pure logic (`dates.js`, `store.js`) is unit-tested with `node --test`; DOM/render modules ship with complete code + a manual smoke checklist.

**Tech Stack:** HTML, CSS (with custom properties), Vanilla JS (ES modules), `localStorage`, PWA (`manifest.json` + service worker). Tests run on Node 18 (`node --test`). No runtime dependencies.

## Global Constraints

- **No build step, no bundler, no framework, no runtime npm dependencies.** Files load directly in the browser.
- **No backend, no auth, no network calls** except the optional Google Calendar feature (stubbed/dormant in this plan).
- **`store.js` is the only module that reads/writes `localStorage`.** All other modules call its async API.
- **All `store.js` functions are `async`** (return Promises) even though they resolve synchronously today.
- **Week starts Monday.** ISO-8601 week numbering.
- **localStorage keys (verbatim):** `weekplan:blocks:{YYYY-WW}`, `weekplan:notes:{YYYY-MM-DD}`, `weekplan:targets:{YYYY-WW}`, `weekplan:settings`. `{YYYY-WW}` = ISO year + zero-padded ISO week, e.g. `2026-25`.
- **Categories (verbatim):** `synced`, `focus`, `meeting`, `task`, `misc`.
- **Block timing:** start time + end time. **Overflow:** `+N more` badge. **Targets:** per-week, no carry-over. **Theme:** light only.
- **Color system (CSS custom properties):** synced `#E6F1FB`/`#185FA5`, focus `#EAF3DE`/`#3B6D11`, meeting `#EEEDFE`/`#534AB7`, task `#FAEEDA`/`#854F0B`, misc secondary bg/border. Today tint `#E6F1FB`.
- **Product name in UI:** `Weekplan`.
- **Commit after every task.** (If the directory is not yet a git repo, Task 1 initializes it.)

---

## File Structure

```
weekly-planner/
  index.html              app shell, all four zones, module script tags
  manifest.json           PWA manifest
  sw.js                   service worker (cache-first app shell)
  css/
    base.css              reset, layout, color custom properties, top/bottom bars, header panel
    grid.css              week grid, day columns, 30/70 split, notes
    mini-cal.css          mini month calendar
    blocks.css            event blocks, overflow badge, inline add/edit form
  js/
    dates.js              ISO-week math + formatting (pure)
    store.js              async localStorage CRUD (only localStorage consumer)
    blocks.js            block CRUD (via store) + block element + block form
    notes.js             per-day contenteditable notes
    targets.js           weekly targets list
    week.js              7-column week grid render
    mini-cal.js          mini month calendar render
    gcal.js              optional Google Calendar (stubbed)
    app.js               controller: state, data fetch, render orchestration, wiring
  icons/
    icon-192.png         PWA icon
    icon-512.png         PWA icon
  test/
    dates.test.mjs       node --test
    store.test.mjs       node --test (with localStorage polyfill)
  docs/superpowers/...    spec + this plan
```

---

## Task 1: Project scaffold, app shell, color system

**Files:**
- Create: `index.html`, `css/base.css`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: DOM anchor elements other tasks target by id — `#topbar`, `#weeklabel`, `#cal-pills`, `#targets`, `#minical`, `#weekgrid`, `#legend`; buttons `#nav-prev`, `#nav-next`, `#nav-today`, `#btn-add`. CSS custom properties: `--cat-synced-fill/-border`, `--cat-focus-fill/-border`, `--cat-meeting-fill/-border`, `--cat-task-fill/-border`, `--cat-misc-fill/-border`, `--today-tint`, `--border`, `--muted`, `--accent`.

- [ ] **Step 1: Initialize git (if needed)**

Run:
```bash
cd /c/xampp/htdocs/weekly-planner && git rev-parse --is-inside-work-tree 2>/dev/null || git init
```
Expected: prints `true` (already a repo) or `Initialized empty Git repository`.

- [ ] **Step 2: Create `.gitignore`**

```
.superpowers/
*.log
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#185FA5">
  <title>Weekplan</title>
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/grid.css">
  <link rel="stylesheet" href="css/mini-cal.css">
  <link rel="stylesheet" href="css/blocks.css">
</head>
<body>
  <!-- Zone 1: Top bar -->
  <header id="topbar">
    <div class="brand">Weekplan</div>
    <nav class="weeknav">
      <button id="nav-prev" aria-label="Previous week">&lsaquo;</button>
      <span id="weeklabel">&nbsp;</span>
      <button id="nav-next" aria-label="Next week">&rsaquo;</button>
      <button id="nav-today" class="btn-today">Today</button>
    </nav>
    <div class="topbar-right">
      <div id="cal-pills" class="cal-pills"></div>
      <button id="btn-add" class="btn-primary">+ Add</button>
    </div>
  </header>

  <!-- Zone 2: Header panel -->
  <section id="headerpanel">
    <div class="hp-targets">
      <div class="hp-label">Weekly Targets</div>
      <div id="targets"></div>
    </div>
    <div class="hp-minical">
      <div id="minical"></div>
    </div>
  </section>

  <!-- Zone 3: Week grid -->
  <main id="weekgrid"></main>

  <!-- Zone 4: Bottom bar -->
  <footer id="legend">
    <span class="leg"><i class="swatch cat-synced"></i> Synced event</span>
    <span class="leg"><i class="swatch cat-focus"></i> Focus block</span>
    <span class="leg"><i class="swatch cat-meeting"></i> Meeting</span>
    <span class="leg"><i class="swatch cat-task"></i> Task / to-do</span>
    <span class="leg"><i class="swatch cat-misc"></i> Misc</span>
  </footer>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create `css/base.css`**

```css
:root {
  --cat-synced-fill:  #E6F1FB; --cat-synced-border:  #185FA5;
  --cat-focus-fill:   #EAF3DE; --cat-focus-border:   #3B6D11;
  --cat-meeting-fill: #EEEDFE; --cat-meeting-border: #534AB7;
  --cat-task-fill:    #FAEEDA; --cat-task-border:    #854F0B;
  --cat-misc-fill:    #f0f0f2; --cat-misc-border:    #9a9aa5;
  --today-tint: #E6F1FB;
  --accent: #185FA5;
  --border: #e0e0e0;
  --muted: #888;
  --bg: #f5f6f8;
  --panel: #fff;
  --text: #1a1a2e;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg); color: var(--text); font-size: 14px;
  display: flex; flex-direction: column; min-height: 100vh;
}
button { font: inherit; cursor: pointer; border: 1px solid var(--border);
  background: #fff; border-radius: 6px; padding: 4px 10px; }
button:hover { background: #f0f0f0; }
.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-primary:hover { filter: brightness(1.07); }

/* Zone 1 */
#topbar { display: flex; align-items: center; gap: 12px; padding: 8px 16px;
  background: var(--panel); border-bottom: 1px solid var(--border); }
.brand { font-weight: 700; font-size: 16px; }
.weeknav { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
#weeklabel { font-weight: 600; min-width: 150px; text-align: center; }
.btn-today { font-size: 12px; padding: 2px 8px; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.cal-pills { display: flex; gap: 6px; }
.pill { background: var(--cat-synced-fill); color: var(--accent);
  border: 1px solid var(--accent); border-radius: 12px; padding: 2px 10px; font-size: 12px; }

/* Zone 2 */
#headerpanel { display: flex; gap: 16px; padding: 12px 16px;
  background: var(--panel); border-bottom: 1px solid var(--border); }
.hp-targets { flex: 1; }
.hp-minical { width: 220px; flex-shrink: 0; }
.hp-label { font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }

/* Zone 4 */
#legend { margin-top: auto; display: flex; flex-wrap: wrap; gap: 16px;
  padding: 8px 16px; background: var(--panel); border-top: 1px solid var(--border);
  font-size: 12px; color: #555; }
.leg { display: inline-flex; align-items: center; gap: 6px; }
.swatch { width: 12px; height: 12px; display: inline-block; border-radius: 2px; }
.cat-synced  { background: var(--cat-synced-fill);  border-left: 3px solid var(--cat-synced-border); }
.cat-focus   { background: var(--cat-focus-fill);   border-left: 3px solid var(--cat-focus-border); }
.cat-meeting { background: var(--cat-meeting-fill);  border-left: 3px solid var(--cat-meeting-border); }
.cat-task    { background: var(--cat-task-fill);     border-left: 3px solid var(--cat-task-border); }
.cat-misc    { background: var(--cat-misc-fill);     border-left: 3px solid var(--cat-misc-border); }
```

- [ ] **Step 5: Create placeholder `js/app.js` so the page loads without 404**

```javascript
// Controller — filled in Task 9. Placeholder keeps the module script valid.
console.log('Weekplan booting…');
```

- [ ] **Step 6: Manual smoke test**

Open `http://localhost/weekly-planner/index.html` (XAMPP running). Expected: top bar with "Weekplan", week nav arrows + Today, "+ Add"; empty targets + mini-cal panel; empty grid; legend with five swatches in the right colors. No console errors except the boot log.

- [ ] **Step 7: Commit**

```bash
git add .gitignore index.html css/base.css js/app.js
git commit -m "feat: app shell, four zones, color system"
```

---

## Task 2: dates.js (ISO-week math) — TDD

**Files:**
- Create: `js/dates.js`
- Test: `test/dates.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `js/dates.js`):
  - `pad2(n) -> string`
  - `toISODate(date: Date) -> "YYYY-MM-DD"` (local date parts)
  - `parseISODate(s: "YYYY-MM-DD") -> Date` (local midnight)
  - `addDays(date: Date, n: number) -> Date`
  - `startOfWeek(date: Date) -> Date` (Monday, local midnight)
  - `weekDays(monday: Date) -> Date[]` (7 dates Mon..Sun)
  - `getISOWeek(date: Date) -> { year: number, week: number }`
  - `weekKey(date: Date) -> "YYYY-WW"` (ISO year + zero-padded ISO week)
  - `isSameDay(a: Date, b: Date) -> boolean`
  - `formatWeekRange(monday: Date) -> string` (e.g. `"Jun 9 – 15, 2026"`)
  - `MONTHS: string[]`, `DOW_SHORT: string[]` (Mon-first: `["Mon",...,"Sun"]`)

- [ ] **Step 1: Write the failing test**

Create `test/dates.test.mjs`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pad2, toISODate, parseISODate, addDays, startOfWeek, weekDays,
  getISOWeek, weekKey, isSameDay, formatWeekRange
} from '../js/dates.js';

test('pad2', () => {
  assert.equal(pad2(3), '03');
  assert.equal(pad2(12), '12');
});

test('toISODate / parseISODate round-trip', () => {
  const d = new Date(2026, 5, 9); // Jun 9 2026 (month is 0-based)
  assert.equal(toISODate(d), '2026-06-09');
  assert.ok(isSameDay(parseISODate('2026-06-09'), d));
});

test('addDays crosses month boundary', () => {
  assert.equal(toISODate(addDays(new Date(2026, 5, 29), 6)), '2026-07-05');
});

test('startOfWeek returns Monday', () => {
  // Jun 11 2026 is a Thursday -> Monday is Jun 8
  assert.equal(toISODate(startOfWeek(new Date(2026, 5, 11))), '2026-06-08');
  // Sunday Jun 14 -> same week Monday Jun 8
  assert.equal(toISODate(startOfWeek(new Date(2026, 5, 14))), '2026-06-08');
  // Monday stays
  assert.equal(toISODate(startOfWeek(new Date(2026, 5, 8))), '2026-06-08');
});

test('weekDays returns Mon..Sun', () => {
  const days = weekDays(new Date(2026, 5, 8));
  assert.equal(days.length, 7);
  assert.equal(toISODate(days[0]), '2026-06-08');
  assert.equal(toISODate(days[6]), '2026-06-14');
});

test('getISOWeek standard cases', () => {
  assert.deepEqual(getISOWeek(new Date(2026, 5, 8)), { year: 2026, week: 24 });
  // 2025-12-29 (Mon) is ISO week 1 of 2026
  assert.deepEqual(getISOWeek(new Date(2025, 11, 29)), { year: 2026, week: 1 });
  // 2027-01-01 (Fri) is ISO week 53 of 2026
  assert.deepEqual(getISOWeek(new Date(2027, 0, 1)), { year: 2026, week: 53 });
});

test('weekKey zero-pads', () => {
  assert.equal(weekKey(new Date(2026, 0, 5)), '2026-02');
  assert.equal(weekKey(new Date(2026, 5, 8)), '2026-24');
});

test('formatWeekRange', () => {
  assert.equal(formatWeekRange(new Date(2026, 5, 8)), 'Jun 8 – 14, 2026');
  assert.equal(formatWeekRange(new Date(2026, 5, 29)), 'Jun 29 – Jul 5, 2026');
  assert.equal(formatWeekRange(new Date(2026, 11, 28)), 'Dec 28, 2026 – Jan 3, 2027');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/dates.test.mjs`
Expected: FAIL — cannot import from `../js/dates.js` (module/exports missing).

- [ ] **Step 3: Write minimal implementation**

Create `js/dates.js`:
```javascript
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DOW_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function pad2(n) { return String(n).padStart(2, '0'); }

export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  return addDays(d, -dow);
}

export function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;        // Mon=0
  d.setUTCDate(d.getUTCDate() - dayNum + 3);     // Thursday of this week
  const isoYear = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const week = 1 + Math.round((d - week1Monday) / (7 * 86400000));
  return { year: isoYear, week };
}

export function weekKey(date) {
  const { year, week } = getISOWeek(date);
  return `${year}-${pad2(week)}`;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function formatWeekRange(monday) {
  const sun = addDays(monday, 6);
  const m1 = MONTHS[monday.getMonth()], m2 = MONTHS[sun.getMonth()];
  const y1 = monday.getFullYear(), y2 = sun.getFullYear();
  if (y1 !== y2) {
    return `${m1} ${monday.getDate()}, ${y1} – ${m2} ${sun.getDate()}, ${y2}`;
  }
  if (m1 !== m2) {
    return `${m1} ${monday.getDate()} – ${m2} ${sun.getDate()}, ${y1}`;
  }
  return `${m1} ${monday.getDate()} – ${sun.getDate()}, ${y1}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/dates.test.mjs`
Expected: PASS — all tests (`tests 9`, `pass 9`, `fail 0`).

- [ ] **Step 5: Commit**

```bash
git add js/dates.js test/dates.test.mjs
git commit -m "feat: dates.js ISO-week helpers with tests"
```

---

## Task 3: store.js (async localStorage) — TDD

**Files:**
- Create: `js/store.js`
- Test: `test/store.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces (all exported, all `async`):
  - `uuid() -> string` (sync helper, exported for reuse)
  - `getBlocks(weekKey) -> Promise<Block[]>`
  - `saveBlocks(weekKey, blocks) -> Promise<void>`
  - `getTargets(weekKey) -> Promise<Target[]>`
  - `saveTargets(weekKey, targets) -> Promise<void>`
  - `getNote(dateStr) -> Promise<string>`
  - `saveNote(dateStr, text) -> Promise<void>`
  - `getNotesForWeek(dateStrs: string[]) -> Promise<Record<string,string>>`
  - `getSettings() -> Promise<{connectedCalendars: string[]}>`
  - `saveSettings(settings) -> Promise<void>`
  - `Block` shape: `{ id, date, time, endTime, title, category, calendarId }`
  - `Target` shape: `{ id, text, done }`

- [ ] **Step 1: Write the failing test**

Create `test/store.test.mjs`:
```javascript
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// localStorage polyfill (Node has no DOM storage)
class MemStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
globalThis.localStorage = new MemStorage();

const store = await import('../js/store.js');

beforeEach(() => globalThis.localStorage.clear());

test('blocks round-trip and default empty', async () => {
  assert.deepEqual(await store.getBlocks('2026-24'), []);
  const blocks = [{ id: 'a', date: '2026-06-08', time: '09:00', endTime: '09:30',
    title: 'Standup', category: 'meeting', calendarId: null }];
  await store.saveBlocks('2026-24', blocks);
  assert.deepEqual(await store.getBlocks('2026-24'), blocks);
});

test('blocks are namespaced per week', async () => {
  await store.saveBlocks('2026-24', [{ id: 'a' }]);
  assert.deepEqual(await store.getBlocks('2026-25'), []);
});

test('targets round-trip', async () => {
  assert.deepEqual(await store.getTargets('2026-24'), []);
  await store.saveTargets('2026-24', [{ id: 't', text: 'Ship', done: false }]);
  assert.deepEqual(await store.getTargets('2026-24'),
    [{ id: 't', text: 'Ship', done: false }]);
});

test('note round-trip; empty removes', async () => {
  assert.equal(await store.getNote('2026-06-08'), '');
  await store.saveNote('2026-06-08', 'hello');
  assert.equal(await store.getNote('2026-06-08'), 'hello');
  await store.saveNote('2026-06-08', '');
  assert.equal(await store.getNote('2026-06-08'), '');
});

test('getNotesForWeek maps date->text', async () => {
  await store.saveNote('2026-06-08', 'mon');
  await store.saveNote('2026-06-10', 'wed');
  const map = await store.getNotesForWeek(['2026-06-08', '2026-06-09', '2026-06-10']);
  assert.deepEqual(map, { '2026-06-08': 'mon', '2026-06-09': '', '2026-06-10': 'wed' });
});

test('settings default and round-trip', async () => {
  assert.deepEqual(await store.getSettings(), { connectedCalendars: [] });
  await store.saveSettings({ connectedCalendars: ['google'] });
  assert.deepEqual(await store.getSettings(), { connectedCalendars: ['google'] });
});

test('corrupt JSON falls back to default', async () => {
  globalThis.localStorage.setItem('weekplan:blocks:2026-24', '{not json');
  assert.deepEqual(await store.getBlocks('2026-24'), []);
});

test('uuid returns a non-empty unique string', () => {
  const a = store.uuid(), b = store.uuid();
  assert.equal(typeof a, 'string');
  assert.ok(a.length > 0);
  assert.notEqual(a, b);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.mjs`
Expected: FAIL — cannot import `../js/store.js`.

- [ ] **Step 3: Write minimal implementation**

Create `js/store.js`:
```javascript
const KEY = {
  blocks:   wk => `weekplan:blocks:${wk}`,
  targets:  wk => `weekplan:targets:${wk}`,
  note:     d  => `weekplan:notes:${d}`,
  settings: 'weekplan:settings',
};

export function uuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for older browsers / Node without global webcrypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export async function getBlocks(wk)        { return readJSON(KEY.blocks(wk), []); }
export async function saveBlocks(wk, list) { writeJSON(KEY.blocks(wk), list); }

export async function getTargets(wk)        { return readJSON(KEY.targets(wk), []); }
export async function saveTargets(wk, list) { writeJSON(KEY.targets(wk), list); }

export async function getNote(dateStr) { return localStorage.getItem(KEY.note(dateStr)) || ''; }
export async function saveNote(dateStr, text) {
  if (text && text.trim()) localStorage.setItem(KEY.note(dateStr), text);
  else localStorage.removeItem(KEY.note(dateStr));
}
export async function getNotesForWeek(dateStrs) {
  const out = {};
  for (const d of dateStrs) out[d] = await getNote(d);
  return out;
}

export async function getSettings()      { return readJSON(KEY.settings, { connectedCalendars: [] }); }
export async function saveSettings(s)    { writeJSON(KEY.settings, s); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.mjs`
Expected: PASS (`tests 8`, `pass 8`, `fail 0`).

- [ ] **Step 5: Commit**

```bash
git add js/store.js test/store.test.mjs
git commit -m "feat: async localStorage store with tests"
```

---

## Task 4: blocks.js — block CRUD, element, and form

**Files:**
- Create: `js/blocks.js`, `css/blocks.css`

**Interfaces:**
- Consumes: `store.getBlocks/saveBlocks/uuid` (Task 3), `dates.weekKey/parseISODate` (Task 2).
- Produces (exported from `js/blocks.js`):
  - `CATEGORIES: [{ value, label }]` — order: synced, focus, meeting, task, misc.
  - `formatTimeRange(time, endTime) -> string` (e.g. `"9:00–9:30"`; if no endTime, just `"9:00"`; if neither, `""`).
  - `blockEl(block, { onClick }) -> HTMLElement` — display chip; calls `onClick(block)` unless `block.calendarId === 'google'` (synced = read-only).
  - `async addBlock(dateStr, data) -> Block` — data `{ time, endTime, title, category }`; computes weekKey from dateStr, creates `{id, date: dateStr, ...data, calendarId: null}`, appends, saves.
  - `async updateBlock(dateStr, id, data) -> void`
  - `async deleteBlock(dateStr, id) -> void`
  - `blockForm({ block, dateStr, onSaved, onCancel }) -> HTMLElement` — inline form; on submit calls add/update then `onSaved()`; shows Delete (calls deleteBlock then onSaved) when editing.

- [ ] **Step 1: Create `js/blocks.js`**

```javascript
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
```

- [ ] **Step 2: Create `css/blocks.css`**

```css
.block { border-left: 3px solid var(--cat-misc-border); background: var(--cat-misc-fill);
  padding: 2px 5px; margin-bottom: 3px; border-radius: 3px; font-size: 11px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.block.synced-readonly { cursor: default; }
.block.cat-synced  { background: var(--cat-synced-fill);  border-left-color: var(--cat-synced-border); }
.block.cat-focus   { background: var(--cat-focus-fill);   border-left-color: var(--cat-focus-border); }
.block.cat-meeting { background: var(--cat-meeting-fill);  border-left-color: var(--cat-meeting-border); }
.block.cat-task    { background: var(--cat-task-fill);     border-left-color: var(--cat-task-border); }
.block.cat-misc    { background: var(--cat-misc-fill);     border-left-color: var(--cat-misc-border); }

.block-form { display: flex; flex-direction: column; gap: 4px; padding: 4px;
  background: #fff; border: 1px solid var(--accent); border-radius: 4px; margin-bottom: 4px; }
.block-form input, .block-form select { font: inherit; font-size: 11px; padding: 2px 4px;
  border: 1px solid var(--border); border-radius: 3px; }
.bf-row { display: flex; align-items: center; gap: 4px; }
.bf-row input[type=time] { flex: 1; min-width: 0; }
.bf-dash { color: var(--muted); }
.bf-actions { display: flex; gap: 4px; }
.bf-actions button { font-size: 11px; padding: 2px 8px; }
.bf-delete { color: #b00; margin-left: auto; }

.overflow-badge { display: inline-block; background: var(--accent); color: #fff;
  border-radius: 8px; padding: 1px 8px; font-size: 10px; cursor: pointer; border: none; }
.overflow-badge:hover { filter: brightness(1.1); }
```

- [ ] **Step 3: Manual smoke test (temporary harness)**

Create a throwaway `test/blocks.smoke.html`, open it, and confirm in the page/console:
```html
<!DOCTYPE html><meta charset="utf-8">
<link rel="stylesheet" href="../css/base.css"><link rel="stylesheet" href="../css/blocks.css">
<div id="out" style="width:160px"></div>
<script type="module">
import { blockEl, blockForm, formatTimeRange } from '../js/blocks.js';
console.assert(formatTimeRange('09:00','09:30') === '9:00–9:30', 'range');
console.assert(formatTimeRange('09:00','') === '9:00', 'start only');
const out = document.getElementById('out');
out.appendChild(blockEl({ id:'1', title:'Standup', time:'09:00', endTime:'09:30', category:'meeting', calendarId:null }, { onClick: b => alert('edit '+b.title) }));
out.appendChild(blockForm({ dateStr:'2026-06-08', onSaved:()=>alert('saved'), onCancel:()=>alert('cancel') }));
</script>
```
Expected: a purple "9:00–9:30 Standup" chip (clicking alerts "edit Standup"); an add form with time/endTime/title/category and Save/Cancel; no console assertion failures. Delete `test/blocks.smoke.html` after verifying.

- [ ] **Step 4: Commit**

```bash
git add js/blocks.js css/blocks.css
git commit -m "feat: block CRUD, display chip, and inline form"
```

---

## Task 5: notes.js — per-day contenteditable notes

**Files:**
- Create: `js/notes.js`

**Interfaces:**
- Consumes: `store.saveNote` (Task 3).
- Produces (exported from `js/notes.js`):
  - `notesEl(dateStr, text) -> HTMLElement` — a labeled contenteditable region; saves on blur via `store.saveNote(dateStr, currentText)`. Shows an italic placeholder via CSS when empty (uses `data-empty`).

- [ ] **Step 1: Create `js/notes.js`**

```javascript
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
```

- [ ] **Step 2: Add notes styles to `css/grid.css`** (file created in Task 6; if running this task first, create the file with just this block and merge in Task 6)

```css
.notes { display: flex; flex-direction: column; height: 100%; }
.notes-label { font-size: 10px; color: var(--muted); font-style: italic; padding: 3px 5px 0; }
.notes-body { flex: 1; font-size: 11px; padding: 3px 5px; outline: none; overflow-y: auto;
  white-space: pre-wrap; }
.notes-body[data-empty]::before { content: attr(data-placeholder);
  color: #bbb; font-style: italic; pointer-events: none; }
```

- [ ] **Step 3: Manual smoke test (temporary harness)**

Create throwaway `test/notes.smoke.html`:
```html
<!DOCTYPE html><meta charset="utf-8">
<link rel="stylesheet" href="../css/base.css"><link rel="stylesheet" href="../css/grid.css">
<div style="width:160px;height:120px;border:1px solid #ccc"><div id="o" style="height:100%"></div></div>
<script type="module">
import { notesEl } from '../js/notes.js';
document.getElementById('o').appendChild(notesEl('2026-06-08', ''));
</script>
```
Expected: "Notes" label + an editable area showing italic "Add a note…" placeholder that disappears on typing. Type text, click away, reload page → text persists (saved to localStorage under `weekplan:notes:2026-06-08`). Delete the harness after verifying.

- [ ] **Step 4: Commit**

```bash
git add js/notes.js css/grid.css
git commit -m "feat: per-day contenteditable notes with auto-save"
```

---

## Task 6: week.js — 7-column week grid

**Files:**
- Create: `js/week.js`
- Modify: `css/grid.css` (append grid styles to the notes styles from Task 5)

**Interfaces:**
- Consumes: `dates.weekDays/toISODate/isSameDay/DOW_SHORT` (Task 2), `blocks.blockEl` (Task 4), `notes.notesEl` (Task 5).
- Produces (exported from `js/week.js`):
  - `renderWeek(root, { monday, blocks, notes, today, onAdd, onEditBlock }) -> void`
    - `root`: the `#weekgrid` element; cleared and re-rendered.
    - `blocks`: Block[] for the whole week; grouped by `block.date` internally, sorted by `time`.
    - `notes`: `Record<dateStr,string>`.
    - `today`: Date.
    - `onAdd(dateStr)`: called when a column's `+ Add` is clicked.
    - `onEditBlock(block)`: passed to `blockEl`.
    - Each column: header (`MON 8`, today-tinted if today), events section (`.events`, holds chips + `+ Add`), notes section (`.notes` via notesEl). Weekend columns get class `weekend`.

- [ ] **Step 1: Create `js/week.js`**

```javascript
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
```

- [ ] **Step 2: Append grid styles to `css/grid.css`**

```css
#weekgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
  padding: 10px 16px; flex: 1; align-items: stretch; }
.day-col { display: flex; flex-direction: column; background: var(--panel);
  border: 1px solid var(--border); border-radius: 6px; overflow: hidden; min-height: 320px; }
.day-col.weekend { opacity: .75; }
.day-head { font-size: 11px; font-weight: 700; padding: 5px 7px;
  border-bottom: 1px solid var(--border); color: #333; }
.day-head.is-today { background: var(--today-tint); color: var(--accent);
  border-bottom-color: #c5d8f0; }
.events { height: 30%; min-height: 90px; padding: 4px; overflow: hidden;
  position: relative; border-bottom: 1px solid var(--border); }
.events.expanded { height: auto; overflow: visible; }
.add-block { display: block; width: 100%; text-align: right; border: none;
  background: none; color: var(--accent); font-size: 11px; padding: 2px 2px 0; }
.add-block:hover { background: none; text-decoration: underline; }
.notes { background: #fafafa; flex: 1; }
```

- [ ] **Step 3: Manual smoke test** — deferred to Task 9 (week.js is exercised when `app.js` wires it). For now verify the file parses: `node --check js/week.js`. Expected: no output (valid).

- [ ] **Step 4: Commit**

```bash
git add js/week.js css/grid.css
git commit -m "feat: week grid render with day columns and 30/70 split"
```

---

## Task 7: targets.js — weekly targets

**Files:**
- Create: `js/targets.js`
- Modify: `css/base.css` (append targets styles)

**Interfaces:**
- Consumes: `store.getTargets/saveTargets/uuid` (Task 3).
- Produces (exported from `js/targets.js`):
  - `async renderTargets(container, weekKey) -> void` — loads targets for `weekKey`, renders the list + an `+ Add target` control; checkbox toggles `done` (persists), each row has a delete (×), add appends a new editable target. Re-renders itself after each mutation.

- [ ] **Step 1: Create `js/targets.js`**

```javascript
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
```

- [ ] **Step 2: Append targets styles to `css/base.css`**

```css
.target-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.target-row input[type=checkbox] { accent-color: var(--accent); }
.target-text { flex: 1; }
.target-text.done { text-decoration: line-through; color: #aaa; }
.target-del { border: none; background: none; color: #bbb; font-size: 16px;
  line-height: 1; padding: 0 4px; }
.target-del:hover { color: #b00; background: none; }
.target-add { border: none; background: none; color: var(--accent);
  font-size: 12px; padding: 4px 0 0; }
.target-add:hover { background: none; text-decoration: underline; }
```

- [ ] **Step 3: Manual smoke test** — exercised in Task 9. Verify parse now: `node --check js/targets.js`. Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add js/targets.js css/base.css
git commit -m "feat: weekly targets list with toggle, add, delete"
```

---

## Task 8: mini-cal.js — mini month calendar

**Files:**
- Create: `js/mini-cal.js`, `css/mini-cal.css`

**Interfaces:**
- Consumes: `dates.startOfWeek/weekDays/toISODate/isSameDay/weekKey/MONTHS` (Task 2).
- Produces (exported from `js/mini-cal.js`):
  - `renderMiniCal(container, { viewYear, viewMonth, selectedMonday, today, eventDates, onPrevMonth, onNextMonth, onPickDay }) -> void`
    - `viewYear`/`viewMonth` (0-based): the displayed month (navigable independently).
    - `selectedMonday`: Date — the grid's current week; days in that ISO week get the blue band.
    - `today`: Date — distinct styling within the band.
    - `eventDates`: `Set<string>` of `YYYY-MM-DD` that have events → blue dot.
    - `onPickDay(date)`: clicking a day jumps the grid to that day's week.
    - Mon-first 6-row grid; adjacent-month days grayed (`other-month`).

- [ ] **Step 1: Create `js/mini-cal.js`**

```javascript
import { startOfWeek, weekDays, toISODate, isSameDay, MONTHS } from './dates.js';

export function renderMiniCal(container, {
  viewYear, viewMonth, selectedMonday, today, eventDates,
  onPrevMonth, onNextMonth, onPickDay,
}) {
  container.innerHTML = '';
  const weekSet = new Set(weekDays(selectedMonday).map(toISODate));

  const head = document.createElement('div');
  head.className = 'mc-head';
  const prev = document.createElement('button'); prev.textContent = '‹'; prev.className = 'mc-nav';
  const title = document.createElement('span'); title.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  const next = document.createElement('button'); next.textContent = '›'; next.className = 'mc-nav';
  prev.addEventListener('click', onPrevMonth);
  next.addEventListener('click', onNextMonth);
  head.append(prev, title, next);
  container.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'mc-grid';
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
    const c = document.createElement('div'); c.className = 'mc-dow'; c.textContent = d;
    grid.appendChild(c);
  });

  // 6 weeks (42 cells) starting from the Monday on/before the 1st of the month.
  const start = startOfWeek(new Date(viewYear, viewMonth, 1));
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const cell = document.createElement('button');
    cell.className = 'mc-day';
    cell.textContent = d.getDate();
    const iso = toISODate(d);
    if (d.getMonth() !== viewMonth) cell.classList.add('other-month');
    if (weekSet.has(iso)) cell.classList.add('in-week');
    if (isSameDay(d, today)) cell.classList.add('is-today');
    if (eventDates.has(iso)) cell.classList.add('has-event');
    cell.addEventListener('click', () => onPickDay(d));
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}
```

- [ ] **Step 2: Create `css/mini-cal.css`**

```css
.mc-head { display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; font-weight: 600; color: #444; margin-bottom: 6px; }
.mc-nav { border: none; background: none; color: var(--muted); padding: 0 6px; font-size: 14px; }
.mc-nav:hover { background: none; color: var(--accent); }
.mc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; text-align: center; }
.mc-dow { font-size: 10px; color: #aaa; padding: 2px 0; }
.mc-day { position: relative; font-size: 11px; border: none; background: none;
  padding: 4px 0; border-radius: 3px; color: #333; }
.mc-day:hover { background: #eef2f7; }
.mc-day.other-month { color: #ccc; }
.mc-day.in-week { background: var(--today-tint); color: var(--accent); }
.mc-day.is-today { font-weight: 700; outline: 1px solid var(--accent); outline-offset: -1px; }
.mc-day.has-event::after { content: ''; position: absolute; bottom: 2px; left: 50%;
  transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%;
  background: var(--accent); }
```

- [ ] **Step 3: Manual smoke test** — exercised in Task 9. Verify parse now: `node --check js/mini-cal.js`. Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add js/mini-cal.js css/mini-cal.css
git commit -m "feat: mini month calendar with week band and event dots"
```

---

## Task 9: app.js — controller, data fetch, navigation wiring

**Files:**
- Modify: `js/app.js` (replace the Task 1 placeholder)

**Interfaces:**
- Consumes: everything above — `dates.*`, `store.*`, `week.renderWeek`, `targets.renderTargets`, `mini-cal.renderMiniCal`, `blocks.blockForm`.
- Produces: a running app. Internal state: `state = { monday, viewYear, viewMonth }`. Functions: `render()` (full re-render), `openAddForm(dateStr)`, `openEditForm(block)`. Navigation handlers wired to `#nav-prev/#nav-next/#nav-today/#btn-add` and mini-cal callbacks.

- [ ] **Step 1: Replace `js/app.js`**

```javascript
import {
  startOfWeek, addDays, weekDays, toISODate, weekKey, formatWeekRange,
} from './dates.js';
import * as store from './store.js';
import { renderWeek } from './week.js';
import { renderTargets } from './targets.js';
import { renderMiniCal } from './mini-cal.js';
import { blockForm } from './blocks.js';

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
  const events = els.grid.querySelector(`.events[data-date="${dateStr}"]`);
  if (!events || events.querySelector('.block-form')) return;
  const form = blockForm({
    dateStr,
    onSaved: render,
    onCancel: render,
  });
  events.insertBefore(form, events.querySelector('.add-block'));
  form.querySelector('input[name="time"]').focus();
}

function openEditForm(block) {
  const events = els.grid.querySelector(`.events[data-date="${block.date}"]`);
  if (!events || events.querySelector('.block-form')) return;
  const form = blockForm({ block, dateStr: block.date, onSaved: render, onCancel: render });
  events.insertBefore(form, events.querySelector('.add-block'));
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
  openAddForm(toISODate(state.monday));
});

render();
```

- [ ] **Step 2: Full manual smoke test** (the integration gate)

Serve via XAMPP and open `http://localhost/weekly-planner/`. Verify:
1. Week label shows the current week range; today's column header is blue-tinted.
2. `+ Add` in a column opens the inline form; saving renders a colored chip immediately; reload → chip persists.
3. Clicking a manual chip opens the pre-filled edit form; edit saves; Delete removes it.
4. Typing in a day's Notes and clicking away persists across reload.
5. Adding a target via "+ Add target", toggling its checkbox (strikethrough), and deleting all persist.
6. `‹`/`›` shift the week by 7 days; Today returns to the current week.
7. Mini-cal shows the current week as a blue band, today outlined, blue dots under days with events; clicking a day jumps the grid to that week; mini-cal `‹`/`›` change the month without moving the grid.

Expected: all pass, no console errors.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: app controller wiring grid, targets, mini-cal, navigation"
```

---

## Task 10: Overflow "+N more" badge

**Files:**
- Modify: `js/week.js` (add overflow handling after rendering events)

**Interfaces:**
- Consumes: existing `renderWeek` internals.
- Produces: after a column's events render, if their height exceeds the `.events` zone, trailing chips are hidden and a `+N more` badge is appended; clicking the badge toggles class `expanded` on `.events` (shows all). No new exports.

- [ ] **Step 1: Add an `applyOverflow` helper and call it per column in `js/week.js`**

Add this function at the bottom of `js/week.js`:
```javascript
function applyOverflow(events) {
  // Run after the element is in the DOM so heights are measured.
  requestAnimationFrame(() => {
    if (events.classList.contains('expanded')) return;
    const add = events.querySelector('.add-block');
    const chips = [...events.querySelectorAll('.block')];
    // Reset any prior hiding
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
```

- [ ] **Step 2: Call it inside the `weekDays(...).forEach` loop, right after `col.appendChild(events);`**

Change:
```javascript
    events.appendChild(add);
    col.appendChild(events);
```
to:
```javascript
    events.appendChild(add);
    col.appendChild(events);
    applyOverflow(events);
```

- [ ] **Step 3: Manual smoke test**

On the running app, add 5–6 blocks to a single day. Expected: only the chips that fit show, plus a blue `+N more` badge; clicking it expands the column to show all chips and the badge disappears. Days that fit show no badge. Other columns unaffected.

- [ ] **Step 4: Commit**

```bash
git add js/week.js
git commit -m "feat: +N more overflow badge for dense days"
```

---

## Task 11: gcal.js — optional Google Calendar (stubbed) + Connect button

**Files:**
- Create: `js/gcal.js`
- Modify: `js/app.js` (render a Connect/Disconnect control in the top bar)

**Interfaces:**
- Consumes: `store.getSettings/saveSettings` (Task 3).
- Produces (exported from `js/gcal.js`):
  - `CLIENT_ID: string` — empty string by default (`''`). When empty, `isConfigured()` is false and connecting shows an explanatory message instead of attempting OAuth.
  - `isConfigured() -> boolean`
  - `async isConnected() -> boolean` (reads settings)
  - `async connect() -> {ok: boolean, reason?: string}` — if not configured, returns `{ok:false, reason:'not-configured'}`; otherwise (future) runs GIS OAuth. For V1 it marks `google` connected in settings only when configured.
  - `async disconnect() -> void` — removes `google` from settings.
  - `async fetchWeekEvents(monday) -> Block[]` — returns `[]` while dormant; documented seam for the real read-only pull.

- [ ] **Step 1: Create `js/gcal.js`**

```javascript
import * as store from './store.js';

// Set this to your Google Cloud OAuth client ID to enable live sync.
// While empty, the feature stays dormant and the app is fully usable without it.
export const CLIENT_ID = '';

export function isConfigured() { return CLIENT_ID.trim().length > 0; }

export async function isConnected() {
  const s = await store.getSettings();
  return s.connectedCalendars.includes('google');
}

export async function connect() {
  if (!isConfigured()) {
    return { ok: false, reason: 'not-configured' };
  }
  // FUTURE: load Google Identity Services, run read-only OAuth consent here,
  // store the token, then call fetchWeekEvents() on render.
  const s = await store.getSettings();
  if (!s.connectedCalendars.includes('google')) {
    s.connectedCalendars.push('google');
    await store.saveSettings(s);
  }
  return { ok: true };
}

export async function disconnect() {
  const s = await store.getSettings();
  s.connectedCalendars = s.connectedCalendars.filter(c => c !== 'google');
  await store.saveSettings(s);
}

// Dormant seam: when wired, this fetches read-only events for the week
// (Mon..Sun of `monday`) and maps them to Block objects with category:'synced',
// calendarId:'google'. Returns [] until configured + connected.
export async function fetchWeekEvents(/* monday */) {
  return [];
}
```

- [ ] **Step 2: Add a Connect control to the top bar in `js/app.js`**

In `js/app.js`, add the import at the top:
```javascript
import * as gcal from './gcal.js';
```
Then replace the body of `renderPills()` with a version that also renders a Connect/Disconnect button:
```javascript
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
```

- [ ] **Step 3: Add a small style for `.btn-gcal` in `css/base.css`**

```css
.btn-gcal { font-size: 12px; padding: 2px 10px; }
```

- [ ] **Step 4: Manual smoke test**

On the running app, click "Connect Google". Expected (dormant/default): an alert explaining sync is optional and not configured; no pill added; no errors. (When `CLIENT_ID` is later set, clicking adds the "Google Cal" pill and toggles to "Disconnect".)

- [ ] **Step 5: Commit**

```bash
git add js/gcal.js js/app.js css/base.css
git commit -m "feat: optional Google Calendar connect (stubbed, dormant)"
```

---

## Task 12: PWA — manifest, service worker, icons

**Files:**
- Create: `manifest.json`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`
- Modify: `js/app.js` (register service worker)

**Interfaces:**
- Consumes: nothing.
- Produces: installable PWA with offline app-shell caching.

- [ ] **Step 1: Create `manifest.json`**

```json
{
  "name": "Weekplan",
  "short_name": "Weekplan",
  "description": "A simple weekly planner.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#f5f6f8",
  "theme_color": "#185FA5",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Generate placeholder PNG icons**

Run (creates solid blue square icons via Node, no dependencies):
```bash
cd /c/xampp/htdocs/weekly-planner && node -e '
const fs=require("fs");
// Minimal 1x1 blue PNG, scaled by the browser via manifest sizes.
const b64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP4z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const buf=Buffer.from(b64,"base64");
fs.mkdirSync("icons",{recursive:true});
fs.writeFileSync("icons/icon-192.png",buf);
fs.writeFileSync("icons/icon-512.png",buf);
console.log("icons written");
'
```
Expected: `icons written`. (Replace with real artwork before production; placeholders satisfy install requirements.)

- [ ] **Step 3: Create `sw.js`**

```javascript
const CACHE = 'weekplan-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/base.css', './css/grid.css', './css/mini-cal.css', './css/blocks.css',
  './js/app.js', './js/dates.js', './js/store.js', './js/blocks.js',
  './js/notes.js', './js/targets.js', './js/week.js', './js/mini-cal.js', './js/gcal.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
```

- [ ] **Step 4: Register the service worker — append to the end of `js/app.js`**

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
  });
}
```

- [ ] **Step 5: Manual smoke test**

Reload `http://localhost/weekly-planner/`. In DevTools → Application: a service worker is activated and the manifest is recognized (install icon appears). Then go offline (DevTools → Network → Offline) and reload — the app shell still loads and prior data shows. Expected: works offline; no uncaught errors.

- [ ] **Step 6: Commit**

```bash
git add manifest.json sw.js icons/icon-192.png icons/icon-512.png js/app.js
git commit -m "feat: PWA manifest, service worker, offline app shell"
```

---

## Task 13: Polish — empty states, transitions, responsive mobile

**Files:**
- Modify: `css/base.css`, `css/grid.css`

**Interfaces:**
- Consumes: existing markup/classes.
- Produces: empty-state hint when a day has no events; subtle transitions; a mobile breakpoint that stacks the grid into scrollable day cards and reflows the header panel.

- [ ] **Step 1: Append polish + responsive styles to `css/grid.css`**

```css
/* Subtle interactions */
.block, .mc-day, .add-block { transition: background-color .12s ease, filter .12s ease; }

/* Mobile: stack header panel, make week grid horizontally scrollable day cards */
@media (max-width: 720px) {
  #topbar { flex-wrap: wrap; row-gap: 6px; }
  .weeknav { order: 3; flex-basis: 100%; }
  #headerpanel { flex-direction: column; }
  .hp-minical { width: 100%; }
  #weekgrid { grid-auto-flow: column; grid-template-columns: none;
    grid-auto-columns: 78%; overflow-x: auto; scroll-snap-type: x mandatory; }
  .day-col { scroll-snap-align: start; min-height: 70vh; }
}
```

- [ ] **Step 2: Append an empty-events hint to `css/grid.css`**

```css
.events:not(.expanded):not(:has(.block)) .add-block { color: var(--accent); }
.events:not(:has(.block))::before { content: 'No events'; display: block;
  font-size: 10px; color: #c4c4c4; font-style: italic; padding: 2px 2px 4px; }
.events.expanded::before, .events:has(.block)::before { content: none; }
```

- [ ] **Step 3: Manual smoke test**

1. Desktop: a day with no events shows a faint italic "No events" hint; adding an event removes it.
2. Narrow the window below 720px (or use device emulation): the header panel stacks, and the week grid becomes horizontally swipeable day cards that snap. Notes and blocks remain usable.

Expected: both behaviors work; no layout breakage at the breakpoint.

- [ ] **Step 4: Commit**

```bash
git add css/grid.css
git commit -m "feat: empty states, transitions, responsive mobile layout"
```

---

## Final verification

- [ ] Run all unit tests: `node --test test/` → expected all pass.
- [ ] Run the full manual smoke checklist from Task 9, Step 2 once more on the finished app.
- [ ] Confirm offline load (Task 12, Step 5).
- [ ] Confirm no console errors anywhere.

---

## Self-Review (author's notes)

**Spec coverage:** Four zones (Tasks 1,6,7,8) · color system (Task 1) · async store + keys (Task 3) · block start+end timing & CRUD & edit/delete (Tasks 4,9) · notes auto-save (Task 5) · targets no-carry-over (Task 7) · mini-cal week band/dots/independent month nav (Tasks 8,9) · week navigation + Today + click-to-jump (Task 9) · overflow +N more (Task 10) · optional/stubbed Google Calendar + free-tier single calendar (Task 11) · PWA (Task 12) · responsive/empty states/light-only (Task 13) · ISO Monday weeks (Task 2). Testing approach (node --test for pure logic, manual smoke for DOM) matches spec §10.

**Out-of-scope items** (accounts, cross-device sync, Apple/Outlook, write-back, recurring, drag-drop, notifications, dark mode) are intentionally absent.

**Type consistency:** `weekKey` is a string `YYYY-WW` everywhere; Block/Target shapes match across store, blocks, week, app; render function signatures match their call sites in app.js.
