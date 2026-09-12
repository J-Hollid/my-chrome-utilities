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

  const connected=[];timers=[];attempts=0;
  globalThis.setTimeout=(fn,delay)=>{const t={fn,delay};timers.push(t);return t;};
  globalThis.clearTimeout=t=>{if(t)t.cancelled=true;};
  globalThis.chrome={runtime:{id:'test',connect(){attempts++;
    const messages=[],disconnects=[];
    const port={onMessage:{addListener:fn=>messages.push(fn)},
      onDisconnect:{addListener:fn=>disconnects.push(fn)},postMessage(){},disconnect(){}};
    connected.push({port,messages,disconnects});return port;}}};
  try {
    const connection=recoverablePort('test',()=>{},()=>{},()=>{},
      value=>value?.type==='accepted');
    connection.start();
    for(let shutdown=0;shutdown<8;shutdown++){
      const active=connected.at(-1);
      active.messages[0]({type:'unrelated'});
      active.messages[0]({type:'accepted'});
      active.disconnects[0]();
      timers.at(-1).fn();
    }
    assert.equal(attempts,9,'Accepted quiet connections renew the retry allowance');
    const current=connected.at(-1);
    connected[0].messages[0]({type:'accepted'});
    current.disconnects[0]();
    assert.equal(timers.at(-1).delay,1000,'A stale confirmation cannot reset the current allowance');
    timers.at(-1).fn();
    const confirmedCurrent=connected.at(-1);
    confirmedCurrent.messages[0]({type:'accepted'});
    confirmedCurrent.disconnects[0]();
    assert.equal(timers.at(-1).delay,500,'A current confirmation resets the retry allowance');
    connection.dispose();
  }finally{globalThis.chrome=prior;globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
}
