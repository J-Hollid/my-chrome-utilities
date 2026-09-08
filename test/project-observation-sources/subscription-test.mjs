import assert from "node:assert/strict";
import {startObservationSourceSubscription} from "../../dist/data-layer-installed/capture/observation-sources/subscription.js";
const bus=new EventTarget(),listeners=new Set(),jobs=new Set(),entries=[],snapshots=[],statuses=[];
globalThis.addEventListener=bus.addEventListener.bind(bus);
globalThis.removeEventListener=bus.removeEventListener.bind(bus);
globalThis.dispatchEvent=bus.dispatchEvent.bind(bus);
globalThis.dataLayer=[{event:"M0"}];
let hold,release,denied=false,channel;
globalThis.chrome={runtime:{onMessage:{addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn)},
  sendMessage:async message=>{channel=message.channel;for(const fn of listeners)fn(message,{tab:{id:7}});}},
  scripting:{executeScript:async details=>{
    assert.equal(details.target.tabId,7);
    if(denied)throw new Error("Permission removed");
    const result=details.func(...details.args);
    if(details.func.name==="observationArrayHook"&&details.args[0]==="attach"&&hold){
      hold=false;await new Promise(resolve=>release=resolve);
    }
    return [{result}];
  }}};
const scheduler={schedule:fn=>{jobs.add(fn);return fn;},cancel:fn=>jobs.delete(fn)};
const options={tabId:7,historyPath:"dataLayer",onEntry:entry=>entries.push(entry),
  onSnapshot:snapshot=>snapshots.push(snapshot),onStatus:status=>statuses.push(status)};
const boundary=async predicate=>{for(let i=0;i<100&&!predicate();i++)await Promise.resolve();assert.ok(predicate(),"controlled boundary completed");};
hold=true;
const activation=startObservationSourceSubscription(options,scheduler);
await boundary(()=>release);
dataLayer.push({event:"M1"});
assert.equal(entries.length,0,"messages wait for the snapshot boundary");
release();const stop=await activation;
assert.deepEqual(snapshots[0].rawValues.map(value=>value.event),["M0"]);
assert.deepEqual(entries.map(entry=>entry.rawValue.event),["M1"]);
const oldId=entries[0].arrayId,oldListener=[...listeners][0];
globalThis.dataLayer=[{event:"R0"}];
const tick=async()=>{const job=[...jobs][0];jobs.delete(job);job();await boundary(()=>jobs.size===1||listeners.size===0);};
await tick();
assert.notEqual(snapshots.at(-1).arrayId,oldId);
oldListener({type:"twa-observation",channel,arrayId:oldId,index:99,rawValue:{event:"late"},timestamp:"t"},{tab:{id:7}});
assert.equal(entries.length,1,"old array messages are rejected after replacement");
dataLayer.push({event:"R1"});assert.equal(entries.at(-1).rawValue.event,"R1");
delete globalThis.dataLayer;await tick();assert.equal(statuses.at(-1),"Waiting for path");
globalThis.dataLayer=17;await tick();assert.equal(statuses.at(-1),"Not an array");
globalThis.dataLayer=[{event:"late array"}];await tick();
assert.equal(snapshots.at(-1).rawValues[0].event,"late array");
denied=true;await tick();assert.equal(statuses.at(-1),"Access required");
assert.equal(listeners.size,0);assert.equal(jobs.size,0);
const count=entries.length;oldListener({type:"twa-observation",channel,arrayId:oldId,index:100,rawValue:{event:"disposed"},timestamp:"t"},{tab:{id:7}});
assert.equal(entries.length,count);stop();
console.log("Controlled observation subscription tests passed");
