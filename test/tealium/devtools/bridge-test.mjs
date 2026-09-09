import assert from 'node:assert/strict';
import { installTealiumBridge } from '../../../dist/tealium/devtools/broker.js';
const listeners = [], validators = [];
const runtime = {id: 'extension', getURL: path => 'chrome-extension://extension/' + path,
  onConnect: {addListener: fn => listeners.push(fn)}};
installTealiumBridge(runtime, async row => validators.push(row));
function port(name, url) {
  const messages = [], incoming = [], closed = [];
  return {name, sender: {id: 'extension', url}, messages, incoming, closed,
    onMessage: {addListener: fn => incoming.push(fn)},
    onDisconnect: {addListener: fn => closed.push(fn)},
    postMessage: message => messages.push(message), disconnect() {this.disconnected = true;}};
}
const wrong = port('tealium-devtools', 'https://shop.example/');
listeners[0](wrong); assert.equal(wrong.disconnected, true);
const owner = port('tealium-live', runtime.getURL('tealium/live/index.html'));
const devtools = port('tealium-devtools', runtime.getURL('tealium/devtools/index.html'));
listeners[0](owner); listeners[0](devtools);
await owner.incoming[0]({type: 'bind', tabId: 42, sessionId: 'one'});
await devtools.incoming[0]({type: 'hello', tabId: 99});
assert.equal(owner.messages.at(-1).connected, false);
await devtools.incoming[0]({type: 'hello', tabId: 42});
assert.equal(owner.messages.at(-1).connected, true);
await owner.incoming[0]({type: 'source', requestId: 'a', sessionId: 'old', row: {tabId: 42}});
assert.equal(validators.length, 0);
await owner.incoming[0]({type: 'source', requestId: 'b', sessionId: 'one', row: {tabId: 99}});
assert.equal(validators.length, 0);
const row = {tabId: 42, documentId: 'document', frameId: 0, profile: 'shop', uid: '21'};
await owner.incoming[0]({type: 'source', requestId: 'c', sessionId: 'one', row});
assert.equal(validators.length, 1);
assert.equal(devtools.messages.at(-1).row.uid, '21');
devtools.closed[0]();
assert.equal(owner.messages.at(-1).connected, false);
console.log('Tealium bridge: sender, target, session, and disconnect boundaries passed');
