import assert from 'node:assert/strict';
import {sourceActions} from '../../../dist/tealium/live/source-actions.js';
export async function checkSourceRecovery() {
  const prior=globalThis.chrome, ports=[], timers=[], oldSet=globalThis.setTimeout, oldClear=globalThis.clearTimeout;
  let refuse=false;
  globalThis.setTimeout=(fn,delay)=>{const t={fn,delay};timers.push(t);return t;};
  globalThis.clearTimeout=t=>{if(t)t.cancelled=true;};
  globalThis.chrome={runtime:{id:'test',connect:()=>{
    if(refuse)throw Error('Connection refused');
    const p={messages:[],onMessage:{addListener:fn=>p.receive=fn},onDisconnect:{addListener:fn=>p.lost=fn},postMessage:m=>p.messages.push(m),disconnect(){p.lost();}};
    ports.push(p);return p;
  }}};
  const live={status:'Observing',sessionId:'s',selected:'tag',rows:[{key:'tag',senderSource:'send',requestUrls:[],codeState:'Registered'}]};
  let state; let actions;
  try {
    actions=sourceActions(42,()=>live,s=>state={...s});actions.update();
    ports[0].receive({type:'connection',connected:false});ports[0].lost();
    assert.equal(state.feedback,'DevTools connection ended',
      'An accepted Live transport is not a previously confirmed DevTools connection');
    actions.dispose();ports.length=0;timers.length=0;
    actions=sourceActions(42,()=>live,s=>state={...s});actions.update();
    ports[0].receive({type:'connection',connected:true});actions.show();
    const old=ports[0].messages.at(-1).requestId;
    ports[0].lost();
    assert.equal(state.connected,false);assert.equal(state.resolution,null);
    assert.equal(state.feedback,'Reconnecting to DevTools...');
    assert.equal(ports.length,1,'Disconnect must not retry in a tight loop');
    const timer=timers.find(t=>!t.cancelled);assert.ok(timer,'Disconnect schedules recovery');assert.ok(timer.delay>=500);timer.fn();
    assert.equal(ports.length,2);
    assert.deepEqual(ports[1].messages[0],{type:'bind',tabId:42,sessionId:'s'});
    ports[0].receive({type:'result',requestId:old,resolution:{status:'Resolved',url:'old'},opened:true});
    assert.equal(state.resolution,null,'Late old-port response is rejected');
    ports[1].receive({type:'connection',connected:true});
    assert.equal(ports[1].messages.filter(m=>m.type==='source').length,1);
    assert.equal(ports[1].messages.at(-1).open,false,'Recovery never replays an open action');
    assert.equal(live.selected,'tag');
    ports[1].lost();
    live.sessionId='replacement';live.selected='new-tag';live.rows=[{...live.rows[0],key:'new-tag'}];
    timers.at(-1).fn();
    assert.deepEqual(ports[2].messages[0],{type:'bind',tabId:42,sessionId:'replacement'},'Reconnect reads the current session');
    ports[2].receive({type:'connection',connected:true});
    assert.equal(ports[2].messages.at(-1).row.key,'new-tag');
    const exhaustionStart=timers.length;refuse=true;ports[2].lost();
    assert.equal(state.feedback,'Reconnecting to DevTools...');
    for(let index=exhaustionStart;index<timers.length;index++)timers[index].fn();
    assert.equal(state.feedback,'Cannot connect to DevTools for this website.');
    assert.deepEqual(timers.slice(exhaustionStart).map(timer=>timer.delay),[500,1000,2000,4000,8000,8000]);
    actions.dispose();
    for(const t of timers)if(!t.cancelled)t.fn();
    assert.equal(ports.length,3,'Disposal stops retries');
  } finally {actions?.dispose();globalThis.chrome=prior;globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
}
