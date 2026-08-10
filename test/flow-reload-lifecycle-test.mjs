import assert from "node:assert/strict";
import {
  assessFlowReloadLifecycle,
  canonicalFlowReloadIdentity,
  classifyFlowReloadModes,
  flowReloadCausalKey,
  FLOW_WORKSPACE_CONTROLS_RELOAD_SEQUENCE,
  observeFlowReloadLifecycle,
} from "../scripts/flow-reload-lifecycle.mjs";

const expected={
  targetId:"FLOW_WORKSPACE_CONTROLS_TARGET",
  pageTargetId:"page-1",
  origin:"chrome-extension://fixture",
  storageIdentity:"profile-1",
  projectId:"project:1",
  flowId:"flow:1",
  reloadSequence:["geometry:narrow", "runtime027:primary"],
};

const initialized={
  generation:"generation-2",
  expectedGeneration:"generation-2",
  initializationComplete:true,
  repositoryOpen:true,
  activeProjectId:"project:1",
  navigationKinds:["pages","flows"],
  requestedFlowId:"flow:1",
  flowMounted:true,
  flowPainted:true,
};

assert.deepEqual(assessFlowReloadLifecycle({...initialized,initializationComplete:false}),{
  ready:false,stage:"current-document-initialization",state:{generation:"generation-2",expectedGeneration:"generation-2",initializationComplete:false},
});
assert.equal(assessFlowReloadLifecycle({...initialized,repositoryOpen:false}).stage,"repository-open");
assert.equal(assessFlowReloadLifecycle({...initialized,activeProjectId:undefined}).stage,"expected-active-project");
assert.equal(assessFlowReloadLifecycle({...initialized,navigationKinds:[]}).stage,"populated-project-navigation");
assert.equal(assessFlowReloadLifecycle({...initialized,flowMounted:false,flowPainted:false}).stage,"requested-flow-painted");
assert.deepEqual(assessFlowReloadLifecycle(initialized),{ready:true,stage:"ready",state:{flowId:"flow:1",painted:true}});
assert.throws(()=>assessFlowReloadLifecycle({...initialized,initializationError:"fixture initializer failed"}),error=>error.stage==="current-document-initialization"&&error.message.includes("fixture initializer failed"));

const delayedInitialization=[
  {...initialized,initializationComplete:false},
  initialized,
];
assert.deepEqual(await observeFlowReloadLifecycle({observe:async(index)=>delayedInitialization[index-1]}),{
  ready:true,stage:"ready",state:{flowId:"flow:1",painted:true},observationCount:2,
});
const delayedActiveProject=[
  {...initialized,activeProjectId:undefined,navigationKinds:[],flowMounted:false,flowPainted:false},
  initialized,
];
assert.equal((await observeFlowReloadLifecycle({observe:async(index)=>delayedActiveProject[index-1]})).observationCount,2);
await assert.rejects(observeFlowReloadLifecycle({maximumObservations:2,observe:async()=>({...initialized,navigationKinds:[],flowMounted:false,flowPainted:false})}),error=>error.stage==="populated-project-navigation");
await assert.rejects(observeFlowReloadLifecycle({observe:async()=>({...initialized,initializationError:"injected initializer failure"})}),error=>error.stage==="current-document-initialization"&&error.message.includes("injected initializer failure"));

const ordinary=canonicalFlowReloadIdentity({...expected,runnerMode:"ordinary-focused"});
const repair=canonicalFlowReloadIdentity({...expected,runnerMode:"repair-focused"});
assert.deepEqual(ordinary,repair);
assert.deepEqual(classifyFlowReloadModes(ordinary,repair,{initializationFailed:true}),{
  domain:"product-runtime",obligation:"causal-product-repair",
});
assert.deepEqual(classifyFlowReloadModes(ordinary,{...repair,origin:"chrome-extension://different"},{initializationFailed:true}),{
  domain:"verification-execution",obligation:"canonical-mode-equivalence-repair",
});

const keyA=flowReloadCausalKey({
  targetId:expected.targetId,reloadBoundary:"runtime027:primary",stage:"populated-project-navigation",
  diagnostic:"attempt 7 at /tmp/sf-chrome/a1 after 11714ms and 43 polls",
});
const keyB=flowReloadCausalKey({
  targetId:expected.targetId,reloadBoundary:"runtime027:primary",stage:"populated-project-navigation",
  diagnostic:"attempt 91 at /tmp/sf-chrome/z9 after 88999ms and 201 polls",
});
assert.equal(keyA,keyB);
assert.notEqual(keyA,flowReloadCausalKey({targetId:expected.targetId,reloadBoundary:"runtime027:keyboard",stage:"populated-project-navigation",diagnostic:"empty navigation"}));
assert.equal(FLOW_WORKSPACE_CONTROLS_RELOAD_SEQUENCE.length,24);
assert.deepEqual(FLOW_WORKSPACE_CONTROLS_RELOAD_SEQUENCE.slice(0,3),["geometry:narrowHiddenClosed","geometry:narrowHiddenOpen","geometry:narrowVisibleClosed"]);

console.log("Flow reload lifecycle tests passed");
