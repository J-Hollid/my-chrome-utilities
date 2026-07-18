import assert from "node:assert/strict";

let commandListener;
const opened = [];
let queryCount = 0;
globalThis.chrome = {
  action:{onClicked:{addListener(){}}},
  commands:{onCommand:{addListener(listener){commandListener=listener;}}},
  runtime:{sendMessage:async()=>{}},
  sidePanel:{open:async(options)=>{opened.push(options);}},
  tabs:{query:async()=>{queryCount+=1;return[{id:99}];}},
};

await import(`../dist/background.js?command-test=${Date.now()}`);
commandListener("open-side-panel",{id:42});
await new Promise((resolve)=>setImmediate(resolve));

assert.deepEqual(opened,[{tabId:42}],"the command must open the panel for Chrome's gesture-bearing tab");
assert.equal(queryCount,0,"the command must not lose its user gesture to an asynchronous tab lookup");

console.log("background command opens the real side panel within its user gesture");
