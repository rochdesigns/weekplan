# Contributing to Weekplan

Thanks for helping out! Weekplan is intentionally small and dependency-free — please keep it that way.

## Ground rules

- **No build step, no framework, no runtime dependencies.** Plain HTML/CSS/JS ES modules that run directly in the browser. Don't introduce npm packages that ship to the client or a bundler/transpiler step.
- **`store.js` is the only module that touches `localStorage`.** Everything else goes through its **async** API. Keep it that way — it's the seam for a future backend.
- **Category colours are semantic** (synced=blue, focus=green, meeting=purple, task=amber, misc=gray). Don't repurpose them for decoration.
- Match the existing style: small focused modules, clear names, comments only where intent isn't obvious.

## Run it locally

ES modules + a service worker mean it must be **served over HTTP** (opening `index.html` as a `file://` won't work):

```bash
npx serve .            # or: python -m http.server 8000
```

Then open the printed `http://localhost:…` URL. `localhost` is a secure context, so the PWA/service worker work without HTTPS.

## Tests

Pure logic (dates, storage, the notes sanitizer, block moves) is unit-tested with the built-in Node test runner — no install needed:

```bash
node --test test/      # Node 18+
# or
npm test
```

Please add/extend tests when you change pure logic. UI/interaction changes are verified manually in the browser — note in your PR what you checked.

## Project layout

```
index.html            app shell
css/                  base · grid · mini-cal · blocks · modal
js/   app · store · dates · week · blocks · notes · sanitize · targets · mini-cal · gcal · modal
test/                 node --test (dates · store · sanitize)
```

## Pull requests

1. Branch off `main` (e.g. `feature/note-export`, `fix/overflow-badge`).
2. Keep changes focused; one concern per PR.
3. Run `node --test test/` and make sure it passes.
4. For UI changes, describe how you verified in the browser (and a screenshot helps).
5. Open the PR against `main` with a short description of the what and why.

## Reporting bugs / ideas

Open an issue with steps to reproduce (for bugs) or the problem you're trying to solve (for features). Since all data is local to the browser, mention your browser and whether it reproduces in a fresh profile.

## Scope

In scope: anything that improves the single-week planning experience client-side. Deferred to a future version (see the README roadmap): accounts, cross-device sync, a backend, billing, Apple/Outlook calendars, recurring events, dark mode. Happy to discuss in an issue before you build something large.
