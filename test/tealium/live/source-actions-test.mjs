import assert from 'node:assert/strict';
import {checkSourceSelection} from './source-selection-check.mjs';
import {sourceActions} from '../../../dist/tealium/live/source-actions.js';
await checkSourceSelection();
const messages=[],listeners=[];const prior=globalThis.chrome;
globalThis.chrome={runtime:{connect:()=>({postMessage:message=>messages.push(message),
  onMessage:{addListener:fn=>listeners.push(fn)},onDisconnect:{addListener(){}},disconnect(){}})}};
const live={status:'Observing',sessionId:'s',selected:'tag',rows:[{key:'tag',senderSource:'send',requestUrls:['https://shop.example/utag.js'],codeState:'Registered'}]};
try{
  const actions=sourceActions(42,()=>live,()=>{});actions.update();listeners[0]({type:'connection',connected:true});
  assert.equal(messages.filter(m=>m.type==='source').length,1);
  live.status='Permission required';actions.update();listeners[0]({type:'connection',connected:true});
  actions.show();assert.equal(messages.filter(m=>m.type==='source').length,1,'Invalid binding cannot request source');
  live.status='Observing';actions.update();listeners[0]({type:'connection',connected:true});
  assert.equal(messages.filter(m=>m.type==='source').length,2,'Retained selection is resolved on restored binding');
  actions.update();listeners[0]({type:'connection',connected:true});
  assert.equal(messages.filter(m=>m.type==='source').length,2,'Unchanged connection does not duplicate resolution');
  actions.dispose();
}finally{globalThis.chrome=prior;}
console.log('Source actions re-resolve a retained selection after binding recovery');
