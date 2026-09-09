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
const previousTimers={setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
const timers=new Map();let sequence=0,connect,releaseValidation;
globalThis.setTimeout=(callback,ms)=>{const id=++sequence;timers.set(id,{callback,ms});return id;};
globalThis.clearTimeout=id=>timers.delete(id);
try{
  const boundedRuntime={...runtime,onConnect:{addListener:fn=>{connect=fn;}}};
  installTealiumBridge(boundedRuntime,()=>new Promise(resolve=>{releaseValidation=resolve;}));
  const live=port('tealium-live',runtime.getURL('tealium/live/index.html'));
  const bridge=port('tealium-devtools',runtime.getURL('tealium/devtools/index.html'));
  connect(live);connect(bridge);await live.incoming[0]({type:'bind',tabId:42,sessionId:'s'});
  await bridge.incoming[0]({type:'hello',tabId:42});
  const operation=live.incoming[0]({type:'source',requestId:'held',sessionId:'s',row,open:true});
  assert.equal(timers.size,1,'Deadline starts before the first validation');
  const timer=[...timers.values()][0];assert.equal(timer.ms,8000);timer.callback();
  assert.match(live.messages.at(-1).error,/did not finish/);
  releaseValidation();await operation;
  assert.equal(bridge.messages.filter(message=>message.type==='source').length,0,'Late validation cannot open a source');
  await live.incoming[0]({type:'bind',tabId:42,sessionId:''});
  assert.equal(live.messages.at(-1).connected,false,'An empty session is not a source connection');
}finally{Object.assign(globalThis,previousTimers);}
