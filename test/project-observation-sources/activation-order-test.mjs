import assert from 'node:assert/strict';
import {createObservationSourceCoordinator} from '../../dist/data-layer-installed/capture/observation-sources/coordinator.js';
const sources=[{id:'m',name:'Marketing',path:'dataLayer',enabled:true},{id:'a',name:'Application',path:'event.history',enabled:true}];
const callbacks=[],events=[];let release;
const coordinator=createObservationSourceCoordinator({
  start:async options=>{
    callbacks.push(options);options.onSnapshot({historyPath:options.historyPath,arrayId:options.historyPath,rawValues:[{event:callbacks.length===1?'M0':'A0'}]});
    if(callbacks.length===2)await new Promise(resolve=>release=resolve);
    return()=>{};
  },event:event=>events.push(event),status:()=>{},now:()=> 'tied',
});
const activation=coordinator.synchronize({projectId:'retail',sessionId:'session',tabId:7,pageUrl:'https://retail.test/',pageLoadId:'page'},sources);
while(!release)await Promise.resolve();
// The second source's earlier receipt was buffered below the coordinator.
callbacks[0].onEntry({arrayId:'dataLayer',index:1,rawValue:{event:'M1'},timestamp:'tied',receiptSequence:2});
callbacks[1].onEntry({arrayId:'event.history',index:1,rawValue:{event:'A1'},timestamp:'tied',receiptSequence:1});
callbacks[0].onSnapshot({historyPath:'dataLayer',arrayId:'dataLayer',rawValues:[{event:'M0'},{event:'M1'}]});
release();await activation;
assert.deepEqual(events.map(event=>event.name),['M0','A0','A1','M1']);
assert.deepEqual(events.map(event=>event.captureSequence),[1,2,3,4]);
console.log('Cross-source activation receipt order tests passed');
