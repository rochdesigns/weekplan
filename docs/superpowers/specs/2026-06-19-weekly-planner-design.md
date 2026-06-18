# Weekly Planner (Weekplan) — V1 Design Spec

Date: 2026-06-19
Status: Approved for planning
Source: `weekplan-claude-code-handoff.md` v0.1 + brainstorming sessions S245–S252

---

## 1. Goal

A simple, opinionated weekly planner web app. Shows the current week, lets the
user plan manual blocks and take per-day notes, track weekly targets, and
optionally pull read-only events from Google Calendar. Mobile-first PWA,
desktop-supported. No backend in V1 — all state is client-side.

## 2. Scope decisions (locked)

All six handoff open questions are resolved:

| Question | Decision |
|---|---|
| Week start | **Monday** |
| Block timing | **Start + end time** |
| Event overflow in 30% zone | **"+N more" indicator badge** |
| Incomplete targets carry-over | **No — fresh start each week** |
| Free-tier calendar limit | **1 connected calendar (Google) free** |
| Light/dark mode | **Light only** for V1 |

### Scale strategy (decided 2026-06-19)

- **Vanilla V1 now.** No framework, no backend, no auth, no database.
- **One forward-compat hook:** `store.js` exposes an **async (Promise-based)**
  interface. Today it resolves from `localStorage`; a future backend swaps the
  internals to `fetch()` without touching UI code.
- **All other scale architecture deferred to a dedicated V2 session**
  (framework choice, DB, accounts, billing, cross-device sync, server-side OAuth
  token storage) — to be decided with real usage data.

## 3. Architecture

Static client-side PWA. No build step — files load directly in the browser
(served from XAMPP `htdocs/weekly-planner` locally; any static host in prod).

- **HTML/CSS/Vanilla JS**, ES modules, one file per concern.
- **CSS custom properties** for the color system (single source of truth).
- **`localStorage`** for all persistence, namespaced keys.
- **PWA**: `manifest.json` + `sw.js` (cache-first app shell, offline fallback).
- **Google Calendar**: optional, read-only, behind `gcal.js`. Dormant until a
  client ID is supplied. The app is fully functional without it.
- **Dates**: native `Date` + small ISO-week helpers. No date library.

### Module responsibilities

| File | Responsibility | Depends on |
|---|---|---|
| `js/app.js` | Init, wire modules, render orchestration, current-week state | store, week, mini-cal, targets, gcal |
| `js/store.js` | **Async** localStorage read/write, key namespacing, settings | — |
| `js/dates.js` | ISO-week math, week<->date helpers, formatting | — |
| `js/week.js` | Render 7-column grid, day headers, 30/70 split, overflow badge | store, dates, blocks, notes |
| `js/blocks.js` | Block CRUD + inline add/edit form | store, dates |
| `js/notes.js` | Per-day contenteditable notes, auto-save on blur | store |
| `js/targets.js` | Per-week targets list, toggle done, add/delete | store, dates |
| `js/mini-cal.js` | Month grid, week highlight, event dots, month nav, click-to-jump | store, dates |
| `js/gcal.js` | Optional OAuth (GIS) read-only pull → blue blocks. Stubbed. | store, dates |

`store.js` is the **only** module that touches `localStorage`. Every other
module calls its async API. This is the boundary that makes a backend swap a
one-file change.

## 4. Data model (localStorage)

Namespaced keys (handoff §5). `{YYYY-WW}` is ISO year + ISO week number.

```
weekplan:blocks:{YYYY-WW}     array of block objects
weekplan:notes:{YYYY-MM-DD}   string (freeform note for a day)
weekplan:targets:{YYYY-WW}    array of target objects
weekplan:settings             { connectedCalendars: [], ... }
```

### Block object

```json
{
  "id": "uuid",
  "date": "2026-06-15",
  "time": "09:00",
  "endTime": "09:30",
  "title": "Team standup",
  "category": "meeting",
  "calendarId": "google|null"
}
```

`category` ∈ `synced | focus | meeting | task | misc`.
Synced (Google) blocks carry `calendarId: "google"` and are read-only in the UI.

### Target object

```json
{ "id": "uuid", "text": "Ship plugin v2.32.0", "done": false }
```

## 5. UI zones (per approved mockup)

1. **Top bar** — logo "Weekplan"; week nav `‹ Jun 9 – 15, 2026 ›`; Today button;
   connected-calendar pills; global `+ Add`.
2. **Header panel** (two columns) — left: Weekly Targets (checkbox, strikethrough
   when done, `+ Add target`); right: mini month calendar (~200px).
3. **Week grid** — 7 equal columns Mon–Sun. Each column: **Events (top 30%)** with
   time label / title / category color / left-border accent + `+ Add`, and
   **Notes (bottom 70%)** contenteditable. Today's column header uses blue tint
   (`#E6F1FB`). Overflow shows a `+N more` badge.
4. **Bottom bar** — color legend.

### Color system (CSS custom properties)

| Category | Fill | Border |
|---|---|---|
| Synced event | `#E6F1FB` | `#185FA5` |
| Focus block | `#EAF3DE` | `#3B6D11` |
| Meeting | `#EEEDFE` | `#534AB7` |
| Task / to-do | `#FAEEDA` | `#854F0B` |
| Misc / personal | secondary bg | secondary border |

Mini-cal: current-week highlight = blue tint; event dots solid `#185FA5`; today
distinct within the week band; adjacent-month days grayed.

## 6. Key interactions

- **Add block**: tap `+ Add` in a column → inline form (start time, end time,
  title, category) → save to store → re-render immediately.
- **Edit block**: tap a manual block → same form, pre-filled, with delete.
  Synced blocks are not editable.
- **Notes**: tap notes area → focus contenteditable → auto-save on blur.
  Per-day, not per-week.
- **Week navigation**: `‹`/`›` shift ±7 days; Today jumps to current week;
  mini-cal day click jumps the grid to that week; mini-cal `‹`/`›` change the
  displayed month independently of the grid.
- **Targets**: checkbox toggles done (strikethrough + green check); `+ Add target`
  appends inline; delete per item. Per-week, no carry-over.
- **Overflow**: when events exceed the 30% zone, render fitted events + a
  `+N more` badge (badge click behavior: expand the column's events — to be
  finalized in the plan; minimum viable = show all on click).

## 7. Build order

1. App shell + zones + CSS color system
2. `dates.js` (ISO-week helpers) + `store.js` (async localStorage)
3. Week grid layout — 7 columns, headers, 30/70 split
4. Manual block creation — add form, store save, render
5. Block edit/delete
6. Notes — contenteditable, auto-save on blur
7. Weekly targets — list, toggle, add, delete
8. Mini calendar — month grid, week highlight, event dots, month nav
9. Week navigation — arrows, Today, mini-cal click-to-jump
10. Overflow `+N more` badge
11. Google Calendar — `gcal.js` stub + optional Connect button (OAuth dormant)
12. PWA — manifest, service worker, offline fallback
13. Polish — transitions, empty states, responsive mobile layout

## 8. File structure

```
weekly-planner/
  index.html
  manifest.json
  sw.js
  css/
    base.css        reset, layout, color custom properties, typography
    grid.css        week grid, day columns, 30/70 split
    mini-cal.css    mini month calendar
    blocks.css      event blocks, inline add/edit form
  js/
    app.js
    store.js
    dates.js
    week.js
    blocks.js
    notes.js
    targets.js
    mini-cal.js
    gcal.js
  icons/            PWA icons (192, 512)
```

## 9. Out of scope (V1)

User accounts/auth · cross-device sync · Apple/Outlook sync · write-back to
Google · recurring events · drag-and-drop · notifications/reminders · team/shared
views · dark mode. (All revisited in the V2 scale session.)

## 10. Testing approach

No framework, so lightweight verification:

- **`dates.js`** — pure functions; small assertion-based test page
  (`test/dates.test.html`) covering ISO-week boundaries, year rollover, Mon-start.
- **`store.js`** — async round-trip tests (write → read → assert) in a test page.
- **Manual smoke checklist** per build step (add/edit/delete block, note
  persistence across reload, target toggle, week nav, overflow badge, offline
  load).

Pure logic (dates, store) gets automated assertions; DOM/interaction is verified
via the manual checklist since there's no test runner in a no-build setup.
