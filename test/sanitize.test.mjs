import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNotesHtml } from '../js/sanitize.js';

test('keeps allowed inline tags', () => {
  assert.equal(sanitizeNotesHtml('<b>hi</b>'), '<b>hi</b>');
  assert.equal(sanitizeNotesHtml('<i>a</i><u>b</u><em>c</em><strong>d</strong>'),
    '<i>a</i><u>b</u><em>c</em><strong>d</strong>');
});

test('keeps lists and structure', () => {
  assert.equal(sanitizeNotesHtml('<ul><li>a</li><li>b</li></ul>'), '<ul><li>a</li><li>b</li></ul>');
  assert.equal(sanitizeNotesHtml('<ol><li>x</li></ol>'), '<ol><li>x</li></ol>');
  assert.equal(sanitizeNotesHtml('<div><b>x</b></div>'), '<div><b>x</b></div>');
});

test('strips all attributes from allowed tags', () => {
  assert.equal(sanitizeNotesHtml('<b onclick="evil()">hi</b>'), '<b>hi</b>');
  assert.equal(sanitizeNotesHtml('<p style="color:red">x</p>'), '<p>x</p>');
});

test('removes script and style blocks with their content', () => {
  assert.equal(sanitizeNotesHtml('<script>alert(1)</script>hi'), 'hi');
  assert.equal(sanitizeNotesHtml('<style>.x{}</style>hi'), 'hi');
});

test('drops disallowed tags but keeps inner text', () => {
  assert.equal(sanitizeNotesHtml('<a href="x">link</a>'), 'link');
  assert.equal(sanitizeNotesHtml('<img src=x onerror=alert(1)>'), '');
});

test('normalizes br and is case-insensitive', () => {
  assert.equal(sanitizeNotesHtml('a<br>b'), 'a<br>b');
  assert.equal(sanitizeNotesHtml('a<br/>b'), 'a<br>b');
  assert.equal(sanitizeNotesHtml('<B>x</B>'), '<b>x</b>');
});

test('removes comments', () => {
  assert.equal(sanitizeNotesHtml('<!-- c -->x'), 'x');
});

test('passes through plain text and handles empty/nullish', () => {
  assert.equal(sanitizeNotesHtml('hello world'), 'hello world');
  assert.equal(sanitizeNotesHtml(''), '');
  assert.equal(sanitizeNotesHtml(null), '');
  assert.equal(sanitizeNotesHtml(undefined), '');
});
