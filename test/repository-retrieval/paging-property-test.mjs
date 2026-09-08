import assert from 'node:assert/strict';
import {query} from '../../swarmforge/scripts/retrieval/query.mjs';
import {page} from '../../swarmforge/scripts/retrieval/page.mjs';
import {options} from '../../swarmforge/scripts/retrieval/options.mjs';
import {fixture} from './fixture.mjs';

let seed = 0x91c4;
const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
const alphabet = ['a', '\n', '\r\n', '🙂', 'é', '漢字', '\t', '\ufeff', 'x'.repeat(200)];
const f = await fixture();
try {
  for (let trial = 0; trial < 60; trial++) {
    const expected = (trial === 0 ? '\ufeff' : '') + Array.from({length: random(1400)}, () => alphabet[random(alphabet.length)]).join('');
    await f.put('input.txt', expected);
    let request = options(['read', 'input.txt']), result = '', pages = 0;
    const snapshot = await query(request, f.root);
    for (;;) {
      const p = page(snapshot, request);
      assert.equal(p.position.startByte, Buffer.byteLength(result));
      assert.equal(p.position.startLine, result.split('\n').length);
      assert.ok(Buffer.byteLength(p.body) <= 12288);
      assert.ok(p.body.split('\n').length - Number(p.body.endsWith('\n')) <= 80);
      result += p.body;
      assert.ok(++pages < 100);
      if (p.complete) break;
      assert.ok(p.body.length > 0);
      request = options(p.continuation.args);
    }
    assert.equal(result, expected, `trial ${trial}`);
  }
  console.log(JSON.stringify({retrievalPagingProperties: {trials: 60, exactText: true, boundedPages: true}}));
} finally { await f.close(); }
