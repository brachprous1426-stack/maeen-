import { test } from 'node:test';
import assert from 'node:assert/strict';
import { achievementTotals, canAdjust, durationSeconds } from './achievement-totals';
const book = { type: 'BOOK', pageCount: 120, duration: null };
const audio = { type: 'AUDIO', pageCount: null, duration: '1:02:30' };
test('only approved completions contribute; signed corrections remain separate', () => {
  const stats = achievementTotals({ progress: [
    { status: 'APPROVED', content: book }, { status: 'APPROVED', content: audio },
    { status: 'PENDING', content: book }, { status: 'REJECTED', content: audio },
  ], achievements: [{ type: 'READING', amount: 20 }, { type: 'READING', amount: -5 }, { type: 'LISTENING', amount: -2 }] });
  assert.equal(stats.readingTotal, 135); assert.equal(stats.readingAuto, 120);
  assert.equal(stats.listeningTotal, 60.5); assert.equal(stats.books, 1); assert.equal(stats.audio, 1);
});
test('removal recomputes totals without residual credit and negative totals are clamped', () => {
  assert.equal(achievementTotals({ progress: [], achievements: [{ type: 'READING', amount: -50 }] }).readingTotal, 0);
  const stats = achievementTotals({ progress: [{ status: 'APPROVED', content: book }], achievements: [{ type: 'READING', amount: -150 }] });
  assert.equal(stats.readingManual, -150); assert.equal(stats.readingTotal, 0);
});
test('unknown measurements are visible and become credit when supplied', () => {
  const input = { progress: [{ status: 'APPROVED', content: { ...book, pageCount: null } }, { status: 'APPROVED', content: { ...audio, duration: '20 مقطع' } }], achievements: [] };
  const stats = achievementTotals(input);
  assert.equal(stats.missingBooks, 1); assert.equal(stats.missingAudio, 1); assert.equal(stats.listeningTotal, 0);
  assert.equal(achievementTotals({ ...input, progress: [{ status: 'APPROVED', content: book }] }).readingTotal, 120);
});
test('duration parsing does not confuse clip counts or malformed time with minutes', () => {
  assert.equal(durationSeconds('1:02:30'), 3750); assert.equal(durationSeconds('٠٢:٣٠'), 150);
  assert.equal(durationSeconds('90 دقيقة'), 5400); assert.equal(durationSeconds('25.5'), 1530);
  for (const invalid of ['20 مقطع', 'ساعتان تقريبا', '1:99', '0', '-20', '', 'NaN']) assert.equal(durationSeconds(invalid), null);
});
test('manual adjustments respect student role and supervisor membership', () => {
  assert.equal(canAdjust({ id: 'a', role: 'SUPERVISOR' }, { role: 'USER', supervisorId: 'a' }), true);
  assert.equal(canAdjust({ id: 'a', role: 'SUPERVISOR' }, { role: 'USER', supervisorId: 'b' }), false);
  assert.equal(canAdjust({ id: 'a', role: 'USER' }, { role: 'USER', supervisorId: 'a' }), false);
  assert.equal(canAdjust({ id: 'a', role: 'ADMIN' }, { role: 'SUPERVISOR', supervisorId: 'a' }), false);
  assert.equal(canAdjust({ id: 'a', role: 'ADMIN' }, { role: 'USER', supervisorId: null }), true);
});
