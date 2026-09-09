import assert from 'node:assert/strict';
import {createLiveOwner} from '../../../dist/tealium/live/owner.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const saved={chrome:globalThis.chrome,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
const events=()=>({listeners:[],addListener(fn){this.listeners.push(fn);},removeListener(fn){this.listeners=this.listeners.filter(x=>x!==fn);}});
async function setup(){
  const calls=[],updated=events(),revoked=events();
  globalThis.chrome={tabs:{get:async()=>({url:'https://shop.example/',status:'complete'}),onUpdated:updated,onRemoved:events()},
    permissions:{onRemoved:revoked},scripting:{executeScript:()=>{const call=deferred();calls.push(call);return call.promise;}},
    runtime:{connect:()=>({onMessage:events(),onDisconnect:events(),postMessage(){},disconnect(){}})}};
  globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};
  const snapshots=[],owner=createLiveOwner(42,value=>snapshots.push(structuredClone(value.live)));
  await flush();return {owner,calls,updated,revoked,snapshots};
}
const frames=[{frameId:0,documentId:'document',result:'https://shop.example/'}];
try {
  const first=await setup();
  assert.equal(first.owner.session.state.accessReady,false);
  first.owner.action({name:'start'});
  assert.equal(first.owner.session.state.status,'Ready');assert.equal(first.calls.length,1);
  assert.ok(first.snapshots.every(state=>state.accessReady===false));
  first.calls[0].resolve(frames);await flush();
  assert.equal(first.owner.session.state.accessReady,true);
  first.owner.action({name:'start'});assert.equal(first.owner.session.state.status,'Observing');
  first.owner.action({name:'end'});
  first.revoked.listeners[0]();await flush();
  assert.equal(first.owner.session.state.accessReady,false);
  first.owner.action({name:'start'});assert.equal(first.owner.session.state.status,'Ended');
  first.calls.at(-1).reject(Error('Grant revoked'));await flush();
  assert.equal(first.owner.session.state.status,'Ended');
  first.owner.action({name:'access'});await flush();first.calls.at(-1).resolve(frames);await flush();
  first.owner.action({name:'start'});assert.equal(first.owner.session.state.status,'Observing');first.owner.dispose();
  const failed=await setup();failed.calls[0].reject(Error('No access'));await flush();
  assert.equal(failed.owner.session.state.status,'Permission required');
  failed.owner.action({name:'start'});assert.equal(failed.calls.length,1);
  failed.owner.action({name:'access'});await flush();failed.calls[1].resolve(frames);await flush();
  assert.equal(failed.owner.session.state.status,'Ready');assert.equal(failed.owner.session.state.accessReady,true);
  failed.owner.action({name:'start'});assert.equal(failed.owner.session.state.status,'Observing');failed.owner.dispose();
}finally{Object.assign(globalThis,saved);}
console.log('Owner access: delayed confirmation, rejection, recovery and ended restart passed');
