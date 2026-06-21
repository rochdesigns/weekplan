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
