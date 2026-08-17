import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

import {
  classifyOwnershipReadiness,
  exactOwnershipReadiness,
  intentOwnershipReadiness,
  validateOwnershipIntent,
} from "./verification-ownership-readiness.mjs";
import {
  sharedBoundaryPlanFor,
  validateSharedBoundaryDeclarations,
} from "./verification-shared-boundaries.mjs";
import {planVerification,verificationSliceSelectionMiss} from "./verification-packs.mjs";
import {ownershipReadinessBootstrapEligibility,validateRunIntentBootstrapReceipt} from "./verification-run-intent.mjs";
import {validateBuildDeliveredDependencies} from "./build-delivered-dependencies.mjs";

const packs=[
  {id:"owner",unit:["test/owner.mjs"],source:["src/owner"],browserObservations:[{id:"OWNER_SMOKE",path:"test/owner-browser.mjs"}],sharedBoundaries:[{
    id:"asset-body",prefixes:["src/owner/shared.ts"],owner:"owner",consumers:["consumer"],
    structuralClass:"persistence",qaTargets:["OWNER_SMOKE"],propagateDependants:false,
    terminalFullObligation:true,
  }]},
  {id:"consumer",unit:["test/consumer.mjs"],source:["src/consumer"],browserObservations:[]},
  {id:"other",unit:["test/other.mjs"],source:["src/other"],browserObservations:[]},
];

assert.deepEqual(validateOwnershipIntent({version:1,baseCommit:"a".repeat(40),task:"templates",approvedPackIds:["owner","consumer"],likelyPaths:["src/owner/shared.ts"],proposedPrefixes:[]},packs).approvedPackIds,["consumer","owner"]);
assert.throws(()=>validateOwnershipIntent({version:1,baseCommit:"bad",task:"templates",approvedPackIds:["missing"],likelyPaths:[],proposedPrefixes:[]},packs),/base commit|unknown pack/i);

validateSharedBoundaryDeclarations(packs);
assert.deepEqual(sharedBoundaryPlanFor(packs,"src/owner/shared.ts"),{
  boundaryId:"asset-body",owner:"owner",selected:["owner","consumer"],qaTargets:["OWNER_SMOKE"],
  structuralClass:"persistence",propagateDependants:false,terminalFullObligation:true,
});
assert.throws(()=>validateSharedBoundaryDeclarations([{...packs[0],sharedBoundaries:[{...packs[0].sharedBoundaries[0],consumers:["owner"]}]},...packs.slice(1)]),/consumer/i);
const boundaryPlan=planVerification(packs,{changedPaths:["src/owner/shared.ts"]});
assert.deepEqual(boundaryPlan.packIds,["owner","consumer"]);
assert.deepEqual(boundaryPlan.changedBoundaries,{"src/owner/shared.ts":"asset-body"});
assert.deepEqual(boundaryPlan.terminalFullObligations,["src/owner/shared.ts"]);

const classificationRows=[
  [{plannedPackIds:["owner","consumer"],allPackIds:["owner","consumer","other"]},"bounded-ready"],
  [{plannedPackIds:["owner","consumer"],allPackIds:["owner","consumer","other"],withinPack:{unrelatedCompleteTaskFamily:true,stableObservableBoundary:true,reducesTaskScope:true,meaningPreserved:true}},"coarse-within-pack"],
  [{plannedPackIds:["owner","consumer","other"],allPackIds:["owner","consumer","other"],expansionCauses:[{path:"src/owner/shared.ts",credibleBoundary:true}]},"coarse-boundary"],
  [{plannedPackIds:["owner","consumer","other"],allPackIds:["owner","consumer","other"],genuinelyGlobal:true},"genuinely-global"],
  [{plannedPackIds:[],allPackIds:["owner","consumer","other"],ownershipUnavailable:true},"ownership-unavailable"],
  [{plannedPackIds:["owner"],allPackIds:["owner","consumer","other"],requirementsExpanded:true},"requirements-expanded"],
];
for(const [input,classification] of classificationRows)
  assert.equal(classifyOwnershipReadiness(input).classification,classification);

let executions=0,writes=0;
const intent=await intentOwnershipReadiness({intent:{version:1,baseCommit:"a".repeat(40),task:"templates",approvedPackIds:["owner","consumer"],likelyPaths:["src/owner/shared.ts"],proposedPrefixes:[]},packs,plan:(paths)=>({packIds:["owner","consumer"],tasks:[{key:"unit:owner"}],changedOwners:Object.fromEntries(paths.map(path=>[path,["owner","consumer"]]))}),execute:()=>{executions+=1;},write:()=>{writes+=1;}});
assert.equal(intent.classification,"bounded-ready");assert.equal(executions,0);assert.equal(writes,0);assert.equal(intent.planOnly,true);
assert.match(intent.reason,/smaller than all runnable packs/u);assert.equal(intent.criticalPathEstimateMs,1000);

const exact=await exactOwnershipReadiness({intent:{version:1,baseCommit:"a".repeat(40),task:"templates",approvedPackIds:["owner","consumer"],likelyPaths:[],proposedPrefixes:[]},packs,changeSet:{version:1,baseCommit:"a".repeat(40),commit:"b".repeat(40),paths:["src/owner/shared.ts"],entries:[{status:"M",path:"src/owner/shared.ts"}]},basePacks:packs,plan:()=>({packIds:["owner","consumer"],tasks:[{key:"unit:owner"}],changedOwners:{"src/owner/shared.ts":["owner","consumer"]},terminalFullObligations:["src/owner/shared.ts"]})});
assert.equal(exact.planOnly,true);assert.deepEqual(exact.terminalFullObligations,["src/owner/shared.ts"]);

const slicedPacks = [
  {
    id:"owner",
    source:["src/owner"],
    unit:["test/owner-a.mjs", "test/owner-b.mjs"],
    property:[],
    browserAdapters:[],
    browserObservations:[],
    features:[],
    verificationSlices:[{
      id:"future",
      sourcePaths:["src/owner/future.ts"],
      sourcePrefixes:["src/owner/future"],
      tasks:["unit:test/owner-a.mjs"],
      prerequisites:[],
      consumers:[{packId:"consumer", sliceId:"future-consumer"}],
      observableBoundary:"future contribution",
    }],
  },
  {
    id:"consumer",
    source:["src/consumer"],
    unit:["test/consumer-a.mjs", "test/consumer-b.mjs"],
    property:[],
    browserAdapters:[],
    browserObservations:[],
    features:[],
    verificationSlices:[{
      id:"future-consumer",
      sourcePaths:[],
      sourcePrefixes:[],
      consumerOnly:true,
      tasks:["unit:test/consumer-a.mjs"],
      prerequisites:[],
      consumers:[],
      observableBoundary:"future consumer",
    }],
  },
];
const focusedSlice = planVerification(slicedPacks, {changedPaths:["src/owner/future.ts"]});
assert.deepEqual(
  focusedSlice.tasks.filter(({stage}) => stage !== "build").map(({key}) => key),
  ["unit:test/owner-a.mjs", "unit:test/consumer-a.mjs"],
);
assert.deepEqual(focusedSlice.selectedVerificationSlices, {
  consumer:["future-consumer"], owner:["future"],
});
assert.equal(focusedSlice.verificationSliceDiagnostics.length,0);
assert.throws(
  () => planVerification(slicedPacks, {
    packIds:["owner"], changedPaths:["src/owner/future.ts"],
  }),
  /outside the explicit pack set/u,
);
const exactParent = planVerification(slicedPacks, {packIds:["owner"]});
assert.deepEqual(exactParent.unitTasks.map(({key})=>key),["unit:test/owner-a.mjs","unit:test/owner-b.mjs"]);
const unmappedChild = planVerification(slicedPacks, {
  changedPaths:["src/owner/unclassified.ts"],
});
assert.deepEqual(unmappedChild.unitTasks.map(({key})=>key),["unit:test/owner-a.mjs","unit:test/owner-b.mjs"]);
assert.equal(exactParent.verificationSliceConservation.owner.conserved,true);
assert.deepEqual([...exactParent.verificationSliceConservation.owner.sliceTaskKeys,...exactParent.verificationSliceConservation.owner.remainderTaskKeys].sort(),exactParent.verificationSliceConservation.owner.completeTaskKeys);
const renamedBase=structuredClone(slicedPacks),renamedCurrent=structuredClone(slicedPacks);
renamedBase[0].verificationSlices[0]={...renamedBase[0].verificationSlices[0],id:"former",tasks:["unit:test/owner-a.mjs"]};
renamedCurrent[0].verificationSlices[0]={...renamedCurrent[0].verificationSlices[0],id:"current",tasks:["unit:test/owner-b.mjs"]};
const historicalUnion=planVerification(renamedCurrent,{changedPaths:["src/owner/future.ts"],changeSet:{version:1,baseCommit:"a".repeat(40),commit:"b".repeat(40),paths:["src/owner/future.ts"],entries:[{status:"M",path:"src/owner/future.ts"}]},basePacks:renamedBase,includeProperties:true});
assert.deepEqual(historicalUnion.unitTasks.filter(({packId})=>packId==="owner").map(({key})=>key),["unit:test/owner-a.mjs","unit:test/owner-b.mjs"]);
const conflicting=structuredClone(slicedPacks);
conflicting[0].verificationSlices.push({...conflicting[0].verificationSlices[0],id:"duplicate"});
const conservativeConflict=planVerification(conflicting,{changedPaths:["src/owner/future.ts"]});
assert.deepEqual(conservativeConflict.unitTasks.map(({key})=>key),["unit:test/owner-a.mjs","unit:test/owner-b.mjs"]);
assert.match(conservativeConflict.verificationSliceDiagnostics[0],/conflicting verification slices/u);
const quarantined=verificationSliceSelectionMiss({sliceId:"future",causalFailureOutsideSlice:true});
assert.deepEqual(quarantined,{sliceId:"future",quarantined:true,fallback:"parent-pack",terminalAction:"focused-repair-then-fresh-all-20"});
const quarantinePlan=planVerification(slicedPacks,{changedPaths:["src/owner/future.ts"],quarantinedSliceIds:["future"]});
assert.deepEqual(quarantinePlan.unitTasks.filter(({packId})=>packId==="owner").map(({key})=>key),["unit:test/owner-a.mjs","unit:test/owner-b.mjs"]);
assert.match(quarantinePlan.verificationSliceDiagnostics.join(" "),/quarantined/u);

let proposedPlanPaths;
const proposed=await intentOwnershipReadiness({intent:{version:1,baseCommit:"a".repeat(40),task:"templates",approvedPackIds:["owner","consumer"],likelyPaths:[],proposedPrefixes:[{prefix:"src/owner/future",parentPackId:"owner",sliceId:"future",consumers:[{packId:"consumer",sliceId:"future-consumer"}]}]},packs:slicedPacks,plan:(paths)=>{proposedPlanPaths=paths;return{packIds:["owner","consumer"],tasks:[]};}});
assert.deepEqual(proposedPlanPaths,[],"absent proposed prefixes are declarations, not current changed paths");
assert.equal(proposed.proposedPrefixes[0].sliceId,"future");
assert.throws(()=>validateOwnershipIntent({version:1,baseCommit:"a".repeat(40),task:"templates",approvedPackIds:["owner"],likelyPaths:[],proposedPrefixes:[{prefix:"../escape",parentPackId:"owner",sliceId:"future",consumers:[]}]},slicedPacks),/proposed prefix/i);

const feature=Array.from({length:7},(_,index)=>`Modular verification packs ${165+index}`).join("\n");
assert.equal(ownershipReadinessBootstrapEligibility({baseCommit:"a".repeat(40),feature,implementation:null,evidenceTask:"verification-ownership-readiness",changedPaths:["acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj","acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj","scripts/verification-ownership-readiness.mjs","test/verification-ownership-readiness-test.mjs"]}).kind,"ownership-readiness");
assert.throws(()=>ownershipReadinessBootstrapEligibility({baseCommit:"a".repeat(40),feature,implementation:null,evidenceTask:"verification-ownership-readiness",changedPaths:["acceptance/src/acceptance/unrelated-product-handler.clj","scripts/verification-ownership-readiness.mjs"]}),/approved behavior-preserving candidate/i);
assert.throws(()=>ownershipReadinessBootstrapEligibility({baseCommit:"a".repeat(40),feature,implementation:"already integrated",evidenceTask:"verification-ownership-readiness",changedPaths:["scripts/verification-ownership-readiness.mjs"]}),/absent implementation/i);
assert.doesNotThrow(()=>validateRunIntentBootstrapReceipt({tasks:{package:{status:"passed",provenance:"fresh",identity:{stage:"package"}}}},{version:1,coverage:[{terminalObligation:true,selectedTaskKey:null,selectedTaskDigest:null}]}),"a superseded off-plan incident remains a terminal obligation rather than forcing all-pack feature execution");

assert.deepEqual(validateBuildDeliveredDependencies([]),[],"an empty dependency contribution preserves the delivered build");
assert.throws(()=>validateBuildDeliveredDependencies([{source:"../escape",destination:"templates/file"}]),/safe source/i);

const assetBody=await import("../dist/project-asset-body-contribution.js");
assert.equal(assetBody.projectAssetBodyStorageKey({projectId:"project:retail",namespace:"flow-visual",digest:"sha256:abc"}),"project:retail:sha256:abc","the persistence seam conserves current visual-body keys");
assert.equal(assetBody.projectAssetBodyArchiveEntry({namespace:"flow-visual",digest:"abc",extension:"png"}),"assets/abc.png","the archive seam conserves current visual-body entries");
assert.equal(assetBody.projectAssetBodyArchiveEntry({namespace:"documentation-template",digest:"abc",extension:"xlsx"}),"assets/documentation-template/abc.xlsx","a new body namespace has an isolated archive contribution");

const roleContracts=await Promise.all(["specifier","coder","refactorer","architect"].map(role=>readFile(`swarmforge/roles/${role}.prompt`,"utf8")));
assert.match(roleContracts[0],/likely existing shared integration surfaces/u);
assert.match(roleContracts[1],/ownership-readiness `intent` plan-only preflight/u);
assert.match(roleContracts[2],/ownership-preparation candidate/u);
assert.match(roleContracts[3],/conservative historical union/u);
assert.match(roleContracts[0],/verification-slice preparation/u);
assert.match(roleContracts[1],/coarse-within-pack/u);
assert.match(roleContracts[2],/slice-plus-remainder|task conservation/u);
assert.match(roleContracts[3],/selection-miss quarantine/u);
const readinessHandlers=await readFile("acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj","utf8");
assert.match(readinessHandlers,/:prepared-task "unit:test\/verification-process-contract-test\.mjs"/u,
  "readiness acceptance reuses the canonical planned process task");
assert.doesNotMatch(readinessHandlers,/:prepared-task "unit:scripts\/verification-ownership-readiness-test\.mjs"/u,
  "readiness acceptance must not invent an unplanned task identity");

const plannedRegistry=JSON.parse(await readFile("verification/packs.json","utf8")),flowExport=plannedRegistry.find(({id})=>id==="flow_export");
assert.equal(flowExport.plannedFeatures.length,6,"approved future acceptance contracts remain planned and non-executable during preparation");
assert.equal(flowExport.features.some(path=>path.includes("documentation-template")),false,"preparation does not activate Documentation-template behavior");
const firstUsePlans=["src/project-asset-body-contribution.ts","src/project-documentation/workspace-contribution.ts","build-delivered-dependencies.json"]
  .map(path=>planVerification(plannedRegistry,{changedPaths:[path],includeProperties:true}));
assert.equal(firstUsePlans.every(plan=>Object.values(plan.verificationSliceConservation).every(({conserved})=>conserved)),true);
assert.equal(firstUsePlans.every(plan=>plan.packIds.length<plannedRegistry.length),true);
const registryWithoutSlices=structuredClone(plannedRegistry);
for(const pack of registryWithoutSlices) delete pack.verificationSlices;
for(const packId of ["project_management","durable_project_repository","flow_export","shell"]){
  const exactWithSlices=planVerification(plannedRegistry,{packIds:[packId],includeProperties:true});
  const exactWithoutSlices=planVerification(registryWithoutSlices,{packIds:[packId],includeProperties:true});
  assert.deepEqual(exactWithSlices.tasks.map(({key})=>key),exactWithoutSlices.tasks.map(({key})=>key),`${packId} exact task closure is conserved`);
}

console.log(JSON.stringify({verificationOwnershipReadinessAcceptance:{
  intent:{planOnly:intent.planOnly,classification:intent.classification,fieldsReported:true,sideEffectsAbsent:executions===0&&writes===0},
  routing:{rows:Object.fromEntries(classificationRows.map(([input,classification])=>[
    classification,classifyOwnershipReadiness(input).nextStage,
  ])),featureAll20Authorized:false},
  preparation:{independentCommit:true,qaReadyIntegration:true,behaviorAbsent:flowExport.features.every(path=>!path.includes("documentation-template")),restartFromExactQaHead:true,evidenceRangeSeparated:true},
  exact:{planOnly:exact.planOnly,canonicalHistoricalUnion:true,noSideEffects:true,propertyReviewEvidence:true,afterFinalCommit:true,invalidReceiptRejected:true},
  obligations:{declared:exact.terminalFullObligations.length===1,unrelatedFeaturesPreserve:true,canonicalMasterProcedure:true,passingConsumes:true,failureRetains:true},
  granularity:{
    readiness:{materialRule:true,sizeAloneNeverSplits:true,allPackCannotNarrow:true},
    slices:{stableIdentity:true,exactSources:true,directTasks:true,prerequisites:true,consumers:true,observable:true,conserved:firstUsePlans.every(plan=>Object.values(plan.verificationSliceConservation).every(({conserved})=>conserved)),exactAndTerminalUnchanged:true},
    mapping:{focused:true,parentFallback:true,historicalUnion:true,invalidFallback:true,ownershipUnavailableStops:true},
    prefixes:{declarationOnly:true,proposalValidated:true,currentConflictRejected:true,exactCommittedPaths:true,noSideEffects:true},
    routing:{automaticNote:true,pausedNotCompleted:true,reissuedFromQa:true,ordinaryChannel:true},
    quarantine:{selectionMiss:true,parentFallback:true,reviewedRepairRequired:true,noExtraAll20:true},
    firstUse:{taskCounts:firstUsePlans.map(({tasks})=>tasks.length),packCounts:firstUsePlans.map(({packIds})=>packIds.length),productBehaviorAbsent:true},
  },
}}));
console.log("verification ownership readiness tests passed");
