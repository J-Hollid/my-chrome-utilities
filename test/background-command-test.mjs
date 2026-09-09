import assert from "node:assert/strict";

const flush = () => new Promise(resolve => setImmediate(resolve));
const events = [], opened = [], messages = [], queries = [];
let actionListener, commandListener, finishOpen, request, connectionListener;
let tabs = [{id:99}];
let rejectFocus = false;
const startupFailure = new Error("repository denied");
const errors = [];
const originalError = console.error;
const originalIndexedDB = globalThis.indexedDB;
console.error = (...args) => errors.push(args);
globalThis.indexedDB = {open(){events.push("repository");request={};return request;}};
globalThis.chrome = {
  action:{onClicked:{addListener(listener){events.push("action");actionListener=listener;}}},
  commands:{onCommand:{addListener(listener){events.push("command");commandListener=listener;}}},
  runtime:{
    sendMessage:async message=>{messages.push(message);if(rejectFocus)throw new Error("panel closed");},
    onMessage:{addListener(){assert.fail("preparation must not register a message responder");}},
    onConnect:{addListener(listener){assert.equal(connectionListener,undefined,"one Tealium connection router");connectionListener=listener;}},
  },
  sidePanel:{open(options){opened.push(options);return new Promise(resolve=>{finishOpen=resolve;});}},
  tabs:{query:async options=>{queries.push(options);return tabs;}},
};

try {
  await import(`../dist/background.js?command-test=${Date.now()}`);
  assert.deepEqual(events,["repository","action","command"],"startup precedes synchronous gesture registration");
  assert.equal(typeof connectionListener,"function");
  connectionListener({name:"unrelated",get sender(){assert.fail("unrelated connections remain untouched");}});
  request.error=startupFailure;
  request.onerror();
  await flush();
  assert.deepEqual(errors,[["Durable project repository unavailable",startupFailure]]);

  commandListener("open-side-panel",{id:42});
  assert.deepEqual(opened,[{tabId:42}],"open uses Chrome's gesture-bearing tab synchronously");
  assert.deepEqual(queries,[],"the command must not lose its user gesture to a tab lookup");
  assert.deepEqual(messages,[],"focus waits for the panel to open");
  finishOpen();await flush();
  assert.deepEqual(messages,[{type:"focus-app-hotkeys"}]);

  actionListener({id:7});
  assert.deepEqual(opened.at(-1),{tabId:7},"action uses its gesture-bearing tab");
  finishOpen();await flush();
  const openCount=opened.length;
  actionListener({});commandListener("open-side-panel",{});commandListener("unrelated",{id:8});
  assert.equal(opened.length,openCount,"missing ids and unrelated commands do not open a panel");
  assert.equal(queries.length,0,"a supplied tab without an id does not trigger fallback");

  commandListener("open-side-panel");
  await flush();
  assert.deepEqual(queries,[{active:true,currentWindow:true}]);
  assert.deepEqual(opened.at(-1),{tabId:99});
  rejectFocus=true;finishOpen();await flush();
  assert.deepEqual(messages.at(-1),{type:"focus-app-hotkeys"},"a closed receiver is harmless");
  tabs=[];commandListener("open-side-panel");await flush();
  assert.equal(opened.length,openCount+1,"empty fallback does not open a panel");
  tabs=[{}];commandListener("open-side-panel");await flush();
  assert.equal(opened.length,openCount+1,"fallback without an id does not open a panel");
  assert.equal(errors.length,1,"focus delivery rejection does not add a startup error");
} finally {
  console.error=originalError;
  if(originalIndexedDB===undefined)delete globalThis.indexedDB;
  else globalThis.indexedDB=originalIndexedDB;
}
console.log("Background startup, failure, gesture, fallback, and Hotkeys behavior conserved");
