import assert from 'node:assert/strict';
import {createObservationSessionStart} from '../../dist/data-layer-installed/capture/observation-sources/session-start.js';
let configuration={projectId:'retail',sources:[]},readiness='Ready';
const targets={targets:[{id:'chosen',tabId:7,windowId:1,pageUrl:'https://retail.test/',title:'Chosen',origin:'https://retail.test',accessState:'Ready'},
  {id:'unrelated',tabId:8,windowId:1,pageUrl:'https://other.test/',title:'Other',origin:'https://other.test',accessState:'Ready'}],
  selectedTargetId:'chosen',sessionState:'Idle'};
const start=createObservationSessionStart({targets:()=>targets,projectId:()=> 'retail',configuration:()=>configuration,readiness:()=>readiness,path:()=> 'dataLayer'});
assert.equal((await start()).tabId,7);
configuration={projectId:'partner',sources:[]};await assert.rejects(start,/Loading project observation sources/);
configuration=undefined;await assert.rejects(start,/Loading project observation sources/);
configuration={projectId:'retail',sources:[]};readiness='Enable an observation source';await assert.rejects(start,/Enable an observation source/);
console.log('Selected-project source session start tests passed');
