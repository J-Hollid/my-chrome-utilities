import assert from 'node:assert/strict';
import {refreshFixture, until} from './refresh-fixture.mjs';

for (const first of ['dataLayer', 'application']) {
  const second = first === 'dataLayer' ? 'application' : 'dataLayer';
  const f = refreshFixture();
  try {
    await f.start();
    f.hold(first); f.tick(first);
    await until(() => f.blocked(first));
    f.push(first, 'first receipt'); f.push(second, 'second receipt');
    f.release(first); await f.settle();
    assert.deepEqual(f.events.map(e => e.name), f.received, 'refresh must retain cross-source receipt order');
    assert.deepEqual(f.events.map(e => e.captureSequence), [1, 2]);
    // Snapshot recovery must not create duplicate observations on later polls.
    f.tick(first); f.tick(second); await f.settle();
    assert.equal(f.events.length, 2);
  } finally { await f.close(); }
}
const cancelled = refreshFixture();
try {
  await cancelled.start();
  globalThis.dataLayer = [];
  cancelled.hold('dataLayer'); cancelled.tick('dataLayer');
  await until(() => cancelled.blocked('dataLayer'));
  cancelled.push('dataLayer', 'removed source'); cancelled.push('application', 'retained source');
  cancelled.sources[0].enabled = false;
  await cancelled.start();
  assert.deepEqual(cancelled.events.map(e => e.name), ['retained source'], 'disposal releases the shared hold');
  cancelled.release('dataLayer');
  await until(() => !cancelled.blocked('dataLayer'));
  assert.deepEqual(cancelled.events.map(e => e.name), ['retained source']);
} finally { await cancelled.close(); }
const replacement = refreshFixture();
try {
  await replacement.start();
  globalThis.dataLayer = [{event: 'R0'}];
  replacement.hold('dataLayer'); replacement.tick('dataLayer');
  await until(() => replacement.blocked('dataLayer'));
  replacement.push('dataLayer', 'R1'); replacement.push('application', 'A1');
  assert.deepEqual(replacement.events, [], 'an unconfirmed array receipt holds later receipts');
  replacement.release('dataLayer'); await replacement.settle();
  assert.deepEqual(replacement.events.map(e => e.name), ['R0', 'R1', 'A1']);
} finally { await replacement.close(); }
const continuous = refreshFixture();
try {
  await continuous.start();
  for (const path of ['dataLayer', 'application']) {
    continuous.hold(path); continuous.tick(path); await until(() => continuous.blocked(path));
  }
  continuous.push('dataLayer', 'M1'); continuous.push('application', 'A1');
  for (let turn = 0; turn < 6; turn++) {
    const path = turn % 2 ? 'application' : 'dataLayer';
    continuous.release(path); await until(() => continuous.scheduled(path));
    continuous.hold(path); continuous.tick(path); await until(() => continuous.blocked(path));
    assert.deepEqual(continuous.events.map(e => e.name), continuous.received,
      'confirmed arrays continue delivery while polling overlaps');
  }
} finally { await continuous.close(); }
console.log('Controlled cross-source refresh receipt order tests passed');
