import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readTealiumPage } from '../../../dist/tealium/detection/page-reader.js';

const source = `(${readTealiumPage.toString()})()`;
function observe(utag, scripts = []) {
  return JSON.parse(JSON.stringify(vm.runInNewContext(source, {
    window: { utag }, location: { href: 'https://shop.example/cart' },
    document: { scripts, querySelectorAll: () => [] }, performance: { getEntriesByType: () => [] }, URL,
  })));
}
let calls = 0;
const forbidden = () => { calls++; throw Error('Observation called page code'); };
const runtime = (uid, title) => ({view: forbidden, link: forbidden,
  cfg: {v: '4.51', noload: true}, handler: {iflag: 1},
  loader: {cfg: {[uid]: {title}}, LOAD: forbidden},
  sender: {[uid]: {send: forbidden}}});
assert.equal(observe(undefined).state, 'Not detected');
assert.equal(observe({name: 'utag'}).state, 'Not detected');
assert.equal(observe({view: forbidden, e: []}).state, 'Initializing');
assert.equal(observe({view: forbidden, link: forbidden, loader: 42}).state, 'Unsupported runtime');
const one = runtime('32', '<img src=x onerror=run>');
const two = runtime('32', 'Second profile');
one.o = {'shop.main': one, alias: one, 'shop.other': two};
const result = observe(one, [{src: 'https://tags.shop.example/custom/payload.js?revision=7', id: 'utag_shop.main_32'}]);
assert.equal(result.state, 'Detected');
assert.equal(result.tags.length, 2);
assert.deepEqual(result.tags.map(tag => tag.profile), ['shop.main', 'shop.other']);
assert.equal(result.tags[0].name, '<img src=x onerror=run>');
assert.equal(result.tags[0].codeState, 'Code registered');
assert.equal(result.tags[0].loadingSuppressed, true);
assert.deepEqual(result.tags[0].requestUrls, ['https://tags.shop.example/custom/payload.js?revision=7']);
assert.equal(result.tags[0].account, null);
assert.equal(result.tags[0].version, '4.51');
const senderOnly = runtime('115');
delete senderOnly.loader.cfg;
assert.equal(observe(senderOnly).tags[0]?.uid, '115', 'Registered code remains visible before tag configuration is available');
const configured = runtime('21');
configured.sender = {};
assert.equal(observe(configured).tags[0].codeState, 'Configured');
assert.equal(observe(configured).tags[0].name, 'Tag 21');
Object.defineProperty(configured.loader, 'cfg', {get: forbidden});
assert.equal(observe(configured).state, 'Unsupported runtime');
assert.equal(calls, 0);
console.log('Tealium page reader: identity, evidence, metadata, and no page calls passed');
