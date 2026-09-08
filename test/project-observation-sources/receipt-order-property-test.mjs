import assert from 'node:assert/strict';
import {refreshFixture, until} from './refresh-fixture.mjs';

let seed = 20260908;
const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
for (let trial = 0; trial < 60; trial++) {
  const activation = trial % 2 === 0;
  const f = refreshFixture({initial: true});
  try {
    if (activation) f.hold('application');
    const started = f.start();
    if (activation) await until(() => f.blocked('application'));
    else await started;
    f.hold('dataLayer'); f.tick('dataLayer');
    await until(() => f.blocked('dataLayer'));
    if (!activation) { f.hold('application'); f.tick('application'); await until(() => f.blocked('application')); }
    const releaseOrder = random(2) ? ['dataLayer', 'application'] : ['application', 'dataLayer'];
    let serial = 0;
    const push = () => { const path = random(2) ? 'dataLayer' : 'application'; f.push(path, `event-${++serial}`); };
    for (let n = 0, count = 1 + random(6); n < count; n++) push();
    f.release(releaseOrder[0]);
    await until(() => !f.blocked(releaseOrder[0]));
    for (let n = 0, count = 1 + random(6); n < count; n++) push();
    f.release(releaseOrder[1]); await started; await f.settle();
    for (let n = 0, count = 1 + random(6); n < count; n++) push();
    f.tick('dataLayer'); f.tick('application'); await f.settle();
    assert.deepEqual(f.events.map(e => e.name), ['M0', 'A0', ...f.received], `schedule ${trial}`);
    assert.deepEqual(f.events.map(e => e.captureSequence), f.events.map((_, i) => i + 1));
    assert.equal(new Set(f.events.map(e => `${e.sourceId}:${e.arrayId}:${e.entryIndex}`)).size, f.events.length);
  } finally { await f.close(); }
}
console.log(JSON.stringify({sourceReceiptProperties: {schedules: 60, activation: true, polling: true, receiptOrder: true, exactlyOnce: true}}));
