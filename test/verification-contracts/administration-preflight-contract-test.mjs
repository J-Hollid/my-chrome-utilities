import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  administrativeGitNoteLimitBytes,
  parseAdministrativeGitNote,
  runVerificationAdministrationChecks,
} from "../../scripts/verification-evidence/administration-preflight.mjs";
import { validateGovernedPrelaunchIdentities } from
  "../../scripts/verification-evidence/governed-prelaunch-identities.mjs";
import { runGovernedPrelaunchGate } from
  "../../scripts/verification-execution/governed-prelaunch-gate.mjs";
import {
  checkpointAttemptInputIdentity,
  createCheckpointAttemptStore,
} from "../../scripts/verification-checkpoint-attempt.mjs";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";

const conditionNames = [
  "candidate-plan-authority",
  "git-note-resolution",
  "incident-state",
  "promotion-capabilities",
];

const passingChecks = (calls) => conditionNames.map((name) => ({
  name,
  validate:async() => {
    calls.push(name);
    return { status:"eligible", identity:name };
  },
}));

const plannedTaskKeys = ["unit:one", "property:two", "package:extension"];
for (const failedCondition of conditionNames) {
  const calls = [];
  let launched = 0;
  const checks = passingChecks(calls).map((check) => check.name === failedCondition
    ? { ...check, validate:async() => {
      calls.push(check.name);
      throw new Error(`invalid ${check.name}`);
    } }
    : check);
  await assert.rejects(async() => {
    await runVerificationAdministrationChecks({ phase:"prelaunch", checks });
    launched += plannedTaskKeys.length;
  }, new RegExp(`prelaunch failed at ${failedCondition}: invalid ${failedCondition}`, "u"));
  assert.equal(launched, 0, `${failedCondition} stops before the first planned task`);
  assert.deepEqual(calls, conditionNames.slice(0, conditionNames.indexOf(failedCondition) + 1),
    `${failedCondition} stops later administrative work`);
}

const phaseCalls = [];
const prelaunch = await runVerificationAdministrationChecks({
  phase:"prelaunch", checks:passingChecks(phaseCalls),
});
const final = await runVerificationAdministrationChecks({
  phase:"final-evidence", checks:passingChecks(phaseCalls),
});
assert.deepEqual(prelaunch.conditionNames, conditionNames);
assert.deepEqual(final.conditionNames, conditionNames);
assert.deepEqual(plannedTaskKeys, ["unit:one", "property:two", "package:extension"],
  "a passing preflight does not remove or replace a planned task");
assert.equal(phaseCalls.length, conditionNames.length * 2,
  "final evidence repeats every administrative condition after prelaunch");

const largePayload = "x".repeat(17 * 1024 * 1024);
const largeNote = Buffer.from(JSON.stringify({ version:2, records:[], padding:largePayload }));
assert.ok(largeNote.length > 16 * 1024 * 1024);
assert.ok(largeNote.length < administrativeGitNoteLimitBytes);
assert.equal(parseAdministrativeGitNote(largeNote, { label:"large valid Git note" }).version, 2,
  "a valid Git note above the former default buffer remains readable inside the bound");
assert.throws(() => parseAdministrativeGitNote(
  Buffer.alloc(administrativeGitNoteLimitBytes + 1, 0x20), { label:"oversized Git note" }),
/exceeds the supported 64 MiB bound/u);
assert.throws(() => parseAdministrativeGitNote(Buffer.from("not-json"), {
  label:"malformed Git note",
}), /malformed Git note is not valid JSON/u);

const [runnerSource,evidenceSource,reviewSource,eligibilitySource,
  administrationHandlerSource,receiptHandlerSource] = await Promise.all([
  readFile(new URL("../../scripts/verification-execution/runner.mjs", import.meta.url), "utf8"),
  readFile(new URL("../../scripts/verification-evidence/core.mjs", import.meta.url), "utf8"),
  readFile(new URL("../../scripts/settled-final-verification.mjs", import.meta.url), "utf8"),
  readFile(new URL("../../scripts/verification-evidence/administration-eligibility.mjs",
    import.meta.url),"utf8"),
  readFile(new URL("../../acceptance/src/acceptance/verification_support/administration_preflight_handlers.clj",
    import.meta.url),"utf8"),
  readFile(new URL("../../acceptance/src/acceptance/verification_support/receipt_retention_lifecycle_handlers.clj",
    import.meta.url),"utf8"),
]);
assert.match(runnerSource,
  /checkpointPreflight[\s\S]*?validateVerificationAdministrationEligibility[\s\S]*?executeAcceptancePlan/u,
  "the runner completes shared administration eligibility before task execution");
assert.match(evidenceSource,
  /createPendingVerificationEvidence[\s\S]*?validateVerificationAdministrationEligibility/u,
  "final pending evidence repeats the shared administration eligibility validator");
assert.match(reviewSource, /currentReviewNote[\s\S]*?readAdministrativeGitNote/u,
  "review recording uses the same bounded Git-note reader as evidence administration");

const administrationPlan = planVerification(await loadVerificationPacks(), {
  changedPaths:["scripts/verification-evidence/core.mjs"], includeProperties:true,
});
const administrationTaskKeys = new Set(administrationPlan.tasks.map(({ key }) => key));
for (const key of [
  "unit:test/verification-contracts/administration-acceptance-dependencies-test.mjs",
  "acceptance-session:verification_process",
]) {
  assert.ok(administrationTaskKeys.has(key),
    `the administration slice prepares the modular acceptance command ${key}`);
}

const repositoryRoot=path.resolve(new URL("../..",import.meta.url).pathname),
  currentPacks=await loadVerificationPacks();
const governed=await validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest});
assert.equal(governed.applicable,true);
assert.equal(governed.blockedAggregate.matches,true);
assert.equal(governed.phase2.matches,true,
  "current governed identities pass the shared prelaunch validator");
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,blockedIdentity:null}),
/authenticated blocked-aggregate consumer-plan authority is missing/iu,
"missing blocked-aggregate authority fails closed");
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  blockedIdentity:{...governed.blockedAggregate.declaration,consumerSourceTree:"invalid"}}),
/authenticated blocked-aggregate consumer-plan authority is malformed/iu,
"malformed blocked-aggregate authority fails closed");
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  blockedIdentity:{...governed.blockedAggregate.declaration,consumerPlanDigest:"0".repeat(64)}}),
/authenticated blocked-aggregate consumer-plan digest.*expected.*observed/iu,
"a stale blocked-aggregate plan digest fails with both values");
const duplicateGraph=structuredClone(governed.phase2.graph);
duplicateGraph.edges.push({...duplicateGraph.edges.find(({incidentId})=>
  incidentId===governed.phase2.authority.incidentId),id:"duplicate-phase2-edge"});
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  loadSuccessionGraph:async()=>duplicateGraph}),
/Phase 2 incident-scoped task-succession edge.*duplicate/iu,
"duplicate Phase 2 authority fails closed");
const missingGraph=structuredClone(governed.phase2.graph);
missingGraph.edges=missingGraph.edges.filter(({incidentId})=>
  incidentId!==governed.phase2.authority.incidentId);
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  loadSuccessionGraph:async()=>missingGraph}),
/Phase 2 incident-scoped task-succession edge is missing/iu,
"missing Phase 2 authority fails closed");
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  derivePhase2Sessions:async()=>[governed.phase2.identity,governed.phase2.identity]}),
/Phase 2 current acceptance-session task identity.*ambiguous/iu,
"ambiguous current Phase 2 identity fails closed");
const staleGraph=structuredClone(governed.phase2.graph),phase2Edge=staleGraph.edges.find(({incidentId})=>
  incidentId===governed.phase2.authority.incidentId);
staleGraph.boundaries["0".repeat(64)]=structuredClone(
  staleGraph.boundaries[phase2Edge.destinationTaskDigest]);
phase2Edge.destinationTaskDigest="0".repeat(64);
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  loadSuccessionGraph:async()=>staleGraph}),
/Phase 2 receipt-bound acceptance-session destination digest.*prerequisite counts/iu,
"a stale Phase 2 destination reports its identity and prerequisite counts");
const stalePrerequisiteGraph=structuredClone(governed.phase2.graph);
stalePrerequisiteGraph.edges.find(({incidentId})=>
  incidentId===governed.phase2.authority.incidentId).destinationPrerequisiteTaskCount=1;
await assert.rejects(validateGovernedPrelaunchIdentities({plan:administrationPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest,
  loadSuccessionGraph:async()=>stalePrerequisiteGraph}),
/Phase 2 receipt-bound acceptance-session destination digest.*expected 0, observed 1/iu,
"a stale Phase 2 prerequisite count fails at the digest boundary");
const unrelatedPlan=planVerification(currentPacks,{packIds:["command-palette"]});
assert.deepEqual(await validateGovernedPrelaunchIdentities({plan:unrelatedPlan,
  packs:currentPacks,repositoryRoot,digest:verificationDigest}),{applicable:false},
"an unrelated product plan does not use governed verification-process identities");

const noEvidenceTaskCalls=[];
assert.deepEqual(await runGovernedPrelaunchGate({
  plan:administrationPlan,packs:currentPacks,repositoryRoot,digest:verificationDigest,
  validate:async({plan})=>{
    noEvidenceTaskCalls.push("validate");
    assert.equal(plan,administrationPlan);
    return {applicable:true};
  },
  recover:async()=>{noEvidenceTaskCalls.push("recover");},
}),{applicable:true},
"a governed plan without an evidence task still uses the identity gate");
assert.deepEqual(noEvidenceTaskCalls,["validate","recover"],
  "governed validation completes before mutable startup recovery");
const staleIdentityCalls=[];
await assert.rejects(runGovernedPrelaunchGate({
  plan:administrationPlan,packs:currentPacks,repositoryRoot,digest:verificationDigest,
  validate:async()=>{
    staleIdentityCalls.push("validate");
    throw new Error("stale governed identity");
  },
  recover:async()=>{staleIdentityCalls.push("recover");},
}),/stale governed identity/u);
assert.deepEqual(staleIdentityCalls,["validate"],
  "a stale governed identity invokes no mutable startup recovery");

const durableState={receipt:"unchanged",checkpoint:"unchanged",incident:"unchanged",
  note:"unchanged",pending:"unchanged"},durableBefore=JSON.stringify(durableState),
  governedCalls=[];
await assert.rejects(runVerificationAdministrationChecks({phase:"prelaunch",checks:[
  {name:"candidate-plan-authority",validate:async()=>{
    governedCalls.push("candidate-plan-authority");
    return validateGovernedPrelaunchIdentities({plan:administrationPlan,packs:currentPacks,
      repositoryRoot,digest:verificationDigest,
      blockedIdentity:{...governed.blockedAggregate.declaration,consumerPlanDigest:"0".repeat(64)}});
  }},
  ...passingChecks(governedCalls).slice(1),
]}),/candidate-plan-authority.*authenticated blocked-aggregate/iu);
assert.deepEqual(governedCalls,["candidate-plan-authority"]);
assert.equal(JSON.stringify(durableState),durableBefore,
  "a governed identity failure creates or changes no administrative record");
assert.match(runnerSource,
  /validateExactSliceSuccessor[\s\S]*?await runGovernedPrelaunchGate\(\{plan,packs[\s\S]*?const context = createVerificationReceiptContext/u,
"the unconditional governed identity gate runs before receipt and checkpoint creation");
assert.match(eligibilitySource,
  /candidatePacks[\s\S]*?validateGovernedIdentities[\s\S]*?git-note-resolution/u,
  "final evidence repeats the governed identity check in candidate-plan-authority");
assert.doesNotMatch(administrationHandlerSource,/receipt-lifecycle-task-key-binding/u,
  "administration preflight handlers do not own receipt lifecycle repair logic");
assert.match(receiptHandlerSource,/receipt-lifecycle-task-key-binding/u,
  "the focused receipt handler owns its causal repair protocol");

const recoveryRoot = await mkdtemp(path.join(os.tmpdir(), "administration-preflight-recovery-"));
try {
  const identity = checkpointAttemptInputIdentity({
    candidate:{ commit:"1".repeat(40), tree:"2".repeat(40) },
    baseCommit:"3".repeat(40), evidenceTask:"verification-administration-preflight",
    planDigest:"4".repeat(64), artifactInputDigest:"5".repeat(64),
    registryDigest:"6".repeat(64), toolchainDigest:"7".repeat(64),
    environmentClass:"8".repeat(64),
    capabilityRoutes:{ "unit:proof":"workspace-sandbox" },
  });
  const task = { key:"unit:proof", stage:"unit", packId:"verification_process",
    executable:"node", args:["proof.mjs"], target:"proof.mjs", environment:null,
    requiredCapabilities:[] };
  let tick = Date.parse("2026-09-01T00:00:00.000Z");
  const store = createCheckpointAttemptStore({ directory:recoveryRoot,
    now:() => new Date(tick++).toISOString(), ownerAlive:async() => false });
  const owner = { pid:91, token:"owner-91" };
  const created = await store.claim(identity, [task.key], owner);
  await store.bindArtifactIdentity(created.attempt.id, {
    artifactOutputDigest:"9".repeat(64), artifactBuildIdentity:"a".repeat(64),
  }, owner);
  await store.recordTask(created.attempt.id, task.key, {
    status:"passed", identityDigest:verificationDigest(task),
    receiptTask:{ identity:task, status:"passed", provenance:"fresh", durationMs:1,
      output:"", stderr:"", executionPrerequisites:{ requiredCapabilities:[],
        launchRoute:"workspace-sandbox" } },
  }, owner);
  await store.markTasksComplete(created.attempt.id, owner);
  assert.equal((await store.claim(identity, [task.key], { pid:92, token:"owner-92" })).action,
    "promotion-only", "completed verification tasks are not rerun after a promotion failure");
  await store.markPromotion(created.attempt.id, "receipt-finalized");
  assert.equal((await store.recovery(created.attempt.id)).scope, "pending-evidence");
  await store.markPromotion(created.attempt.id, "pending-evidence-created");
  assert.equal((await store.recovery(created.attempt.id)).scope, "git-note-recording");
  await store.markPromotion(created.attempt.id, "git-note-recorded");
  assert.equal((await store.recovery(created.attempt.id)).scope, "handoff-eligibility",
    "a review-record failure resumes after durable Git-note recording");
  await assert.rejects(store.assertIdentity(created.attempt.id, {
    ...identity, candidate:{ ...identity.candidate, tree:"b".repeat(40) },
  }), /identity drift/u, "identity drift blocks promotion-only reuse");
} finally {
  await rm(recoveryRoot, { recursive:true, force:true });
}

console.log("verification administration preflight contract tests passed");
