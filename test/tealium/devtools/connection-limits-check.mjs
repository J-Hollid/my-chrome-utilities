import assert from 'node:assert/strict';
import {recoverablePort} from '../../../dist/tealium/devtools/connection.js';
export function checkConnectionLimits() {
  const prior=globalThis.chrome, oldSet=globalThis.setTimeout, oldClear=globalThis.clearTimeout;
  let timers=[], attempts=0, failure='Connection refused';
  globalThis.setTimeout=(fn,delay)=>{const t={fn,delay};timers.push(t);return t;};
  globalThis.clearTimeout=t=>{if(t)t.cancelled=true;};
  globalThis.chrome={runtime:{id:'test',connect(){attempts++;throw Error(failure);}}};
  try {
    let lost=0;
    const connection=recoverablePort('test',()=>{},()=>{},()=>lost++);
    connection.start();
    for(let i=0;i<timers.length;i++){assert.ok(i<6,'Retry count is bounded');timers[i].fn();}
    assert.equal(attempts,7);assert.equal(lost,7);
    assert.deepEqual(timers.map(t=>t.delay),[500,1000,2000,4000,8000,8000]);
    connection.dispose();timers=[];attempts=0;failure='Extension context invalidated.';
    const invalid=recoverablePort('test',()=>{},()=>{},()=>{});invalid.start();
    assert.equal(attempts,1);assert.equal(timers.length,0,'Invalid context cannot retry');invalid.dispose();
  }finally{globalThis.chrome=prior;globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
}
