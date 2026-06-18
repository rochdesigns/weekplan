# Claude Code Handoff — Weekly Planner App

Version 0.1 · June 2026

---

## 1. Project Overview

A simple, opinionated weekly planner web app. Intentionally minimal: shows the current week, pulls in events from connected calendars, and gives users space to plan and take notes. No goals, no habits, no AI, no project management layer.

| Field | Value |
|---|---|
| Product name | Weekplan (working title) |
| Type | Progressive Web App (PWA) |
| Target user | Remote workers and freelancers who plan their week manually |
| Primary platform | Mobile-first, desktop-supported |
| Revenue model | Freemium — free core, paid calendar sync (multi-calendar, Apple, Outlook) |
| Status | UI mockup complete, ready to build |

---

## 2. UI Layout & Structure

The app is a single-page layout with four vertical zones stacked top to bottom.

### Zone 1 — Top bar

- App name / logo on the left
- Week navigation: back arrow, current week label (e.g. Jun 9 – 15, 2026), forward arrow
- Today button to jump to current week
- Connected calendar badges (e.g. Google Cal, Work) as pills
- Global Add button

### Zone 2 — Header panel

A two-column row sitting between the top bar and the week grid.

- Left column: Weekly Targets section — checkboxes, strikethrough on complete, Add target link
- Right column: Mini monthly calendar, fixed at ~200×200px

Mini calendar behavior:
- Current week highlighted as a blue band
- Event dots under days that have events
- Today visually distinct within the week highlight
- Adjacent month days grayed out
- Prev/next month navigation arrows

### Zone 3 — Week grid

Seven equal columns, one per day (Monday through Sunday). Each column has two fixed sections:

- **Events (top 30%)** — synced calendar events and manually added blocks, each with a time label, title, color category, and left border accent. Add link at the bottom of this section.
- **Notes (bottom 70%)** — freeform text area with a subtle background, Notes label, italic placeholder when empty.

All seven columns are identical in height. The 30/70 split is fixed.

### Zone 4 — Bottom bar

Color legend: Synced event (blue) · Focus block (green) · Meeting (purple) · Task/to-do (amber)

---

## 3. Color System

Block colors encode category, not sequence.

| Color | Category |
|---|---|
| Blue — `#E6F1FB` fill, `#185FA5` border | Synced calendar events |
| Green — `#EAF3DE` fill, `#3B6D11` border | Focus / deep work blocks |
| Purple — `#EEEDFE` fill, `#534AB7` border | Meetings |
| Amber — `#FAEEDA` fill, `#854F0B` border | Tasks and to-dos |
| Gray — secondary bg, secondary border | Miscellaneous / personal |

Today's column header uses a blue tint background (`#E6F1FB`). Mini calendar week highlight also uses blue tint. Event dots on mini calendar are solid blue (`#185FA5`).

---

## 4. Recommended Tech Stack

### Core

- HTML, CSS, Vanilla JS — no framework needed for V1
- PWA manifest + service worker for home screen install and offline support
- localStorage for notes, blocks, and targets — no backend in V1

### Calendar sync

- Google Calendar API (OAuth 2.0) — read-only in V1, pull events into the week view
- Do not write back to Google Calendar in V1
- Apple Calendar and Outlook sync deferred to Pro tier

### Hosting

- Static hosting: Netlify, Vercel, or Cloudflare Pages
- No backend required in V1 — all state is client-side
- Backend needed only when adding user accounts and cross-device sync (V2)

---

## 5. Data Model (V1, localStorage)

All data lives in localStorage under namespaced keys. No server, no auth in V1.

```
weekplan:blocks:{YYYY-WW}     array of block objects for the week
weekplan:notes:{YYYY-MM-DD}   string, freeform note for a day
weekplan:targets:{YYYY-WW}    array of target objects for the week
weekplan:settings             connected calendars, preferences
```

### Block object

```json
{
  "id": "uuid",
  "date": "2026-06-15",
  "time": "09:00",
  "title": "Team standup",
  "category": "meeting",
  "calendarId": "google|optional"
}
```

### Target object

```json
{
  "id": "uuid",
  "text": "Ship plugin v2.32.0",
  "done": false
}
```

---

## 6. Key Interactions to Build

### Adding a block

- Tap Add in a day column
- Inline form appears: time picker, title input, category selector
- Saves to localStorage, renders immediately

### Editing a block

- Tap an existing block to open the same inline form, pre-filled
- Include a delete option in the form

### Notes

- Tap anywhere in the notes section to focus a `contenteditable` area
- Auto-saves on blur
- Notes are per-day, not per-week

### Week navigation

- Back/forward arrows shift the view by 7 days
- Today button jumps to the current week
- Mini calendar: tapping a day jumps the week grid to that week
- Mini calendar: prev/next arrows change the displayed month independently

### Weekly targets

- Tap a checkbox to toggle done (strikethrough + green check)
- Tap Add target to append a new item inline
- Targets are per-week, not per-day
- Carry-over of incomplete targets to next week is a V2 consideration

---

## 7. Suggested Build Order

Build in this order to get something usable as fast as possible.

1. Week grid layout — seven columns, day headers, 30/70 split
2. Manual block creation — Add button, inline form, localStorage save
3. Notes — `contenteditable` area, auto-save on blur
4. Weekly targets — checkbox list, toggle done, add target
5. Mini calendar — render month grid, highlight current week, event dots
6. Week navigation — arrows, Today button, mini calendar click-to-navigate
7. Google Calendar sync — OAuth flow, read-only event pull, render as blue blocks
8. PWA — manifest, service worker, offline fallback
9. Polish — transitions, empty states, responsive mobile layout

---

## 8. Out of Scope for V1

- User accounts or authentication
- Cross-device sync
- Apple Calendar or Outlook sync
- Writing back to Google Calendar
- Recurring event support
- Drag and drop reordering
- Notifications or reminders
- Team or shared views
- Dark mode (consider for V2)

---

## 9. Suggested File Structure

```
weekplan/
  index.html
  manifest.json
  sw.js                   service worker
  css/
    base.css
    grid.css
    mini-cal.css
    blocks.css
  js/
    app.js                init, routing
    store.js              localStorage read/write
    week.js               week grid render
    mini-cal.js           mini calendar render
    blocks.js             block CRUD
    notes.js              notes CRUD
    targets.js            targets CRUD
    gcal.js               Google Calendar OAuth + fetch
```

---

## 10. Open Questions

- Should the week start on Monday or Sunday? (currently Monday in mockup)
- Should blocks support a duration/end time, or just a start time?
- What happens when a day has more events than fit in the 30% zone — scroll, overflow indicator, or truncate?
- Should incomplete targets from this week be visible when viewing next week?
- Free tier limit: 1 connected calendar, or a different constraint?
- Light/dark mode toggle from launch?

---

*Prepared by Elle · June 2026*
