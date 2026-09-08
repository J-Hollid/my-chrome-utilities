import assert from "node:assert/strict";
import {matrixIsolationDurabilityExpression} from "./support/documentation-matrix-durability.mjs";
import {builderDocumentationReady,waitForBuilderDocumentation,waitForBuilderPersistence} from "./support/builder-persistence-action.mjs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import vm from "node:vm";

let status="saving",polls=0,clicked=false;
await waitForBuilderPersistence(()=>status,async()=>{
  assert.equal(clicked,false,"the next action must not use the pending render");
  if(++polls===8)status="settled";
});
clicked=true;
assert.equal(polls,8,"readiness follows the save cycle, not a fixed pause");
await assert.rejects(()=>waitForBuilderPersistence(()=>"failed",async()=>{}),/save failed/);
await assert.rejects(()=>waitForBuilderPersistence(()=>"saving",async()=>{}),/did not settle/);
const dom={readyState:"complete",documentElement:{dataset:{specificationStudioPersistence:"settled"}},
  querySelector:()=>null};
assert.equal(builderDocumentationReady(dom),false,"an empty tree is not an initialized route");
dom.querySelector=()=>({});
assert.equal(builderDocumentationReady(dom),true);
dom.documentElement.dataset.specificationStudioPersistence="saving";
assert.equal(builderDocumentationReady(dom),false);
let routePolls=0;
await assert.rejects(()=>waitForBuilderDocumentation({},async()=>false,async()=>{routePolls++;}),/did not finish loading/);
assert.equal(routePolls,120,"the original reload polling budget is retained");

const original=execFileSync("git",["show",
  "9f198564d17ad4853d7b1e4673753ab8a33fa0ed:test/browser-packs/flow-table-documentation-export.mjs"],{encoding:"utf8"});
const originalPause=original.match(/const pause=(\(ms=180\)=>new Promise\(\(resolve\)=>setTimeout\(resolve,ms\)\)),q=/)?.[1];
assert.ok(originalPause,"the regression must execute the original browser pause");
async function actionAfterSave(repaired) {
  let elapsed=0,persisted=false,actionReachedCurrentProjection=false;
  const advance=async(ms)=>{elapsed+=ms;if(elapsed>=400)persisted=true;};
  if(repaired)await waitForBuilderPersistence(()=>persisted?"settled":"saving",()=>advance(25));
  else await vm.runInNewContext(originalPause,{setTimeout:(resolve,ms)=>{void advance(ms).then(resolve);}})();
  actionReachedCurrentProjection=persisted;
  return {actionReachedCurrentProjection};
}
const beforeAction=await actionAfterSave(false),afterAction=await actionAfterSave(true);
assert.deepEqual(beforeAction,{actionReachedCurrentProjection:false});
assert.deepEqual(afterAction,{actionReachedCurrentProjection:true});
const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION??"null");
if(context?.causalCategory==="other:Builder persistence action boundary") {
  const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalized(item)])):value;
  const digest=value=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
  const fixture={id:"builder-save-before-next-action-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{saveCompletesAtMs:400,originalPauseMs:180},
    expectedPreRepairFailure:beforeAction,expectedRepairResult:afterAction},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:beforeAction},
    repairResult:{status:"passed",fixtureDigest,observed:afterAction}}}));
}

const move="let moved;for(let attempt=0;attempt<120;attempt+=1){moved=await repository.loadProject(projectId);if(moved.draftSequence>before.draftSequence)break;await pause(25);}";
const deselection="let after;for(let attempt=0;attempt<120;attempt+=1){after=await repository.loadProject(projectId);if(after.draftSequence>moved.draftSequence)break;await pause(25);}const afterIds=";
const repaired=matrixIsolationDurabilityExpression(`${move}const movedIds=[];${deselection}after.state;`);

assert.match(repaired,/expectedMovedIds/);
assert.match(repaired,/Reordered matrix contexts were not durably saved/);
assert.match(repaired,/expectedCandidateIds/);
assert.match(repaired,/Deselected matrix context was not durably saved/);
assert.doesNotMatch(repaired,/draftSequence>before\.draftSequence/);
assert.doesNotMatch(repaired,/draftSequence>moved\.draftSequence/);
assert.throws(()=>matrixIsolationDurabilityExpression("unrelated probe"),/post-reorder observation/);
assert.throws(()=>matrixIsolationDurabilityExpression(move),/post-deselect observation/);

console.log("documentation matrix durability probe tests passed");
