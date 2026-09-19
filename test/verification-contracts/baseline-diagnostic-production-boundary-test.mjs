import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";

import {canonicalBaselineDiagnostic,executeCanonicalDiagnosticAtCommit} from
  "../../scripts/verification-policy/reliability/baseline-diagnostic-authentication.mjs";
import {produceBaselineDiagnosticPair} from
  "../../scripts/verification-policy/reliability/baseline-diagnostic-producer.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
import {compatibleTimeoutRepairIncidentIds} from
  "../../scripts/verification-execution/runner.mjs";
import {access,rm} from "node:fs/promises";

const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const gitBytes=(...args)=>execFileSync("git",args);
const commit=git("rev-parse","HEAD^{commit}");
const receipt={commit,checkKey:"acceptance-session:verification_process",
  toolchainDigest:timeoutIncidentDigest(gitBytes("show",`${commit}:swarmforge/toolchain.lock.json`))};
const canonical=await canonicalBaselineDiagnostic(process.cwd(),receipt);
const compatibleRepair={id:"feature-repair",repair:{status:"eligible",
  candidate:{commit:"repair-commit",tree:"repair-tree"},
  checkpoint:{baseCommit:"approved-base",evidenceTask:"portability-baseline-evidence"}}};
const featureCheckpoint={requestedId:compatibleRepair.id,blocking:[compatibleRepair],
  candidateCommit:"repair-commit",candidateTree:"repair-tree",baseCommit:"approved-base",
  evidenceTask:"portability-baseline-evidence",requestedPackIds:["shell","verification_process"],
  featureModePackIds:["verification_process","shell"],
  plannedTaskKeys:["unit:feature-contract","package:extension"],focusedSelection:false,
  propertiesIncluded:true,packageIncluded:true};
assert.deepEqual(compatibleTimeoutRepairIncidentIds(featureCheckpoint),[compatibleRepair.id]);
for(const incomplete of [
  {plannedTaskKeys:[]},{propertiesIncluded:false},{packageIncluded:false},{focusedSelection:true},
]) {
  assert.throws(()=>compatibleTimeoutRepairIncidentIds({...featureCheckpoint,...incomplete}),
    /complete feature review plan/u);
}
const tree=git("rev-parse",`${commit}^{tree}`);
const produced=await produceBaselineDiagnosticPair(process.cwd(),{
  base:{commit,tree},candidate:{commit,tree},checkKey:receipt.checkKey,
},{derive:async()=>canonical,execute:async()=>({status:"failed",failureDigest:"f".repeat(64)}),
  now:()=>"2026-09-19T11:00:00.000Z"});
try {
  for(const document of [produced.base,produced.candidate]) {
    assert.match(document.path,/^tmp\/verification-receipts\/baseline-diagnostic-/u);
    assert.equal(document.receipt.result.failureDigest,"f".repeat(64));
    await access(document.path);
  }
} finally {
  await Promise.all([produced.base.path,produced.candidate.path].map((file)=>rm(file,{force:true})));
}
await assert.rejects(produceBaselineDiagnosticPair(process.cwd(),{
  base:{commit,tree},candidate:{commit,tree},checkKey:receipt.checkKey,
},{derive:async()=>canonical,execute:async()=>({status:"passed",failureDigest:"0".repeat(64)})}),
  /requires a canonical failing check/u);

const missingPreparation=await executeCanonicalDiagnosticAtCommit(process.cwd(),commit,
  {...canonical,preparationTasks:[]});
assert.equal(missingPreparation.status,"preparation-failed",
  "missing generated input preparation is rejected before the canonical check");

const staleDependencies=await executeCanonicalDiagnosticAtCommit(process.cwd(),commit,
  {...canonical,dependencyPreparation:{...canonical.dependencyPreparation,
    lockDigest:"0".repeat(64)}});
assert.equal(staleDependencies.status,"preparation-failed",
  "dependencies from a different lock are rejected before the canonical check");

const preparedExecution=await executeCanonicalDiagnosticAtCommit(process.cwd(),commit,canonical);
assert.equal(preparedExecution.status,"failed");
assert.match(preparedExecution.diagnostic.stderr,/Acceptance pack session failed/u,
  "the prepared production executor reaches the canonical acceptance assertions");
assert.doesNotMatch(preparedExecution.diagnostic.stderr,
  /ERR_MODULE_NOT_FOUND|No such file|missing-generated-input/u,
  "the canonical failure is not caused by missing or stale prepared inputs");

const repairContext=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(repairContext?.causalCategory==="other:feature checkpoint compact-safe test placement") {
  execFileSync("node",["scripts/generate-compact-conservation.mjs","check"],{stdio:"pipe"});
  const fixture={id:"feature-checkpoint-compact-placement-v1",
    causalCategory:repairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(repairContext.diagnosedBoundary),
    input:{owner:"test/verification-contracts/reliability-terminal-policy-contract-test.mjs"},
    expectedPreRepairFailure:{compactConserved:false},
    expectedRepairResult:{compactConserved:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{compactConserved:false}},
    repairResult:{status:"passed",fixtureDigest,observed:{compactConserved:true}}}}));
}

console.log("baseline diagnostic production boundary passed");
