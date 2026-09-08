import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {installFixtureObservationApi} from './browser/legacy-fixture-api.mjs';
import {projectObservationSources} from '../../dist/data-layer-project-observation-sources/settings.js';
import {createSpecificationProject} from '../../dist/data-layer-specification-project.js';

let oldListener;
const api={runtime:{onMessage:{addListener:listener=>{oldListener=listener;},removeListener:()=>{oldListener=undefined;}}},
  scripting:{executeScript:async()=>[{result:{dataLayer:[{event:'pageview'}]}}]}};
const request={target:{tabId:23},world:'MAIN',func:function observationArrayHook(){},args:['attach','dataLayer','channel','event']};
const before=await api.scripting.executeScript(request);
const preRepairResult={configuredSource:projectObservationSources(undefined).length===1,subscriptionReady:before[0].result.status==='Ready'};
assert.deepEqual(preRepairResult,{configuredSource:false,subscriptionReady:false});
const project=createSpecificationProject({name:'Permission fixture',site:'retail.test',id:kind=>kind});
project.project.eventTransport.observationHistoryPath='dataLayer';
installFixtureObservationApi(api);
const after=await api.scripting.executeScript(request);
const repairResult={configuredSource:projectObservationSources(project.project).some(source=>source.path==='dataLayer'&&source.enabled),subscriptionReady:after[0].result.status==='Ready'};
assert.deepEqual(repairResult,{configuredSource:true,subscriptionReady:true});
assert.deepEqual(after[0].result.rawValues,[{event:'pageview'}]);
const received=[],listener=(message,sender)=>received.push({message,sender});
api.runtime.onMessage.addListener(listener);
oldListener({type:'my-chrome-utilities.data-layer-history-entry',channelId:'channel',rawValue:{event:'purchase'},timestamp:'2026-09-08T00:00:00Z'},{tab:{id:23}});
assert.equal(received[0].message.index,1);assert.equal(received[0].message.arrayId,after[0].result.arrayId);
assert.equal(received[0].message.channel,'channel');assert.equal(received[0].sender.tab.id,23);
api.runtime.onMessage.removeListener(listener);assert.equal(oldListener,undefined);

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).filter(([,item])=>item!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalized(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
  const fixture={id:'single-source-consumer-fixture-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{path:'dataLayer',tabId:23},
    expectedPreRepairFailure:{configuredSource:false,subscriptionReady:false},
    expectedRepairResult:{configuredSource:true,subscriptionReady:true}};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,
    fixture,preRepairResult:{status:'failed',fixtureDigest,observed:preRepairResult},repairResult:{status:'passed',fixtureDigest,observed:repairResult}}}));
}
console.log('Existing consumer fixture source configuration and subscription protocol checks passed');
