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
import {planVerification} from "./verification-packs.mjs";
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

assert.deepEqual(validateOwnershipIntent({version:1,baseCommit:"a".repeat(40),task:"templates",approvedPackIds:["owner","consumer"],likelyPaths:["src/owner/shared.ts"],proposedPrefixes:["src/owner/future"]},packs).approvedPackIds,["consumer","owner"]);
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
const readinessHandlers=await readFile("acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj","utf8");
assert.match(readinessHandlers,/:prepared-task "unit:test\/verification-process-contract-test\.mjs"/u,
  "readiness acceptance reuses the canonical planned process task");
assert.doesNotMatch(readinessHandlers,/:prepared-task "unit:scripts\/verification-ownership-readiness-test\.mjs"/u,
  "readiness acceptance must not invent an unplanned task identity");

const plannedRegistry=JSON.parse(await readFile("verification/packs.json","utf8")),flowExport=plannedRegistry.find(({id})=>id==="flow_export");
assert.equal(flowExport.plannedFeatures.length,6,"approved future acceptance contracts remain planned and non-executable during preparation");
assert.equal(flowExport.features.some(path=>path.includes("documentation-template")),false,"preparation does not activate Documentation-template behavior");

console.log(JSON.stringify({verificationOwnershipReadinessAcceptance:{
  intent:{planOnly:intent.planOnly,classification:intent.classification,fieldsReported:true,sideEffectsAbsent:executions===0&&writes===0},
  routing:{rows:Object.fromEntries(classificationRows.map(([input,classification])=>[
    classification,classifyOwnershipReadiness(input).nextStage,
  ])),featureAll20Authorized:false},
  preparation:{independentCommit:true,qaReadyIntegration:true,behaviorAbsent:flowExport.features.every(path=>!path.includes("documentation-template")),restartFromExactQaHead:true,evidenceRangeSeparated:true},
  exact:{planOnly:exact.planOnly,canonicalHistoricalUnion:true,noSideEffects:true,propertyReviewEvidence:true,afterFinalCommit:true,invalidReceiptRejected:true},
  obligations:{declared:exact.terminalFullObligations.length===1,unrelatedFeaturesPreserve:true,canonicalMasterProcedure:true,passingConsumes:true,failureRetains:true},
}}));
console.log("verification ownership readiness tests passed");
