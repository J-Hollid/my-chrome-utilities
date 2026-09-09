import assert from 'node:assert/strict';
import { resolveTagSource } from '../../../dist/tealium/devtools/source.js';
import { sourceStep } from '../../../dist/tealium/devtools/deadline.js';
const senderSource = 'function send(){return "tag-21";}';
const row = {senderSource, requestUrls: []};
const url = 'https://assets.shop.example/payload.js?revision=original';
assert.deepEqual(resolveTagSource(row, [{url, content: '\n' + senderSource}]),
  {url, line: 1, column: 0, status: 'Resolved', detail: 'Unique registered tag code'});
assert.equal(resolveTagSource(row, [{url, content: senderSource},
  {url: url + '2', content: senderSource}]).status, 'Ambiguous');
assert.equal(resolveTagSource(row, [{url, content: senderSource + senderSource}]).status, 'Ambiguous');
assert.equal(resolveTagSource(row, []).status, 'Unresolved');
assert.equal(resolveTagSource(row,[{url,content:senderSource},{url,content:senderSource}]).status,'Resolved','Identical frame copies identify one URL and location');
assert.equal(resolveTagSource(row, [{url,content:senderSource},{url,content:'another frame version'}]).status,'Ambiguous');
assert.equal(resolveTagSource({...row, requestUrls: [url]}, [{url, content: ''}]).status, 'Unresolved');
const fallback = resolveTagSource({...row, requestUrls: [url]}, [{url, content: 'wrapped tag code'}]);
assert.equal(fallback.url, url);
assert.equal(fallback.line, 0);
assert.match(fallback.detail, /location unavailable/);
const controller=new AbortController();let release,continued=false;
const operation=sourceStep(new Promise(resolve=>{release=resolve;}),controller.signal).then(()=>{continued=true;});
controller.abort();
await assert.rejects(()=>operation,/did not finish/);
release('late');await new Promise(resolve=>setImmediate(resolve));
assert.equal(continued,false,'Late source callbacks cannot continue an expired action');
console.log('Tealium source evidence: unique, ambiguous, missing, and wrapped sources passed');
