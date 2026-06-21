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
