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
console.log('Controlled cross-source refresh receipt order tests passed');
