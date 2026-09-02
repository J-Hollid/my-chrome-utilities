import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { estimatePlanMilliseconds, reportVerificationThroughput, validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { buildCanonicalTimingLedger } from "../../scripts/verification-timing-ledger.mjs";
import { closeVerificationPlanPrerequisites, focusedAcceptanceOptions, planPackageTask } from
  "../../scripts/run-focused-acceptance.mjs";
import { requireEvidenceReceiptRunIntent, verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from
  "../../scripts/verification-planner/tasks/planner.mjs";
import { createVerificationPackCardinalityAdapter } from
  "../../scripts/verification-pack-cardinality/contract.mjs";
import { loadVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import {
  blockedAggregateRouteIdentity,
  consumeBlockedAggregateObligation,
  createBlockedAggregateObligation,
  deriveConservedCorrectionDeltaIdentity,
  excludeExactBlockedAggregateIncident,
  sealBlockedAggregateObligation,
  validateBlockedAggregateLineageAdmission,
  validateInheritedBlockedAggregatePreflight,
  validateBlockedAggregateEvidenceResults,
  validateBlockedAggregateConsumption,
} from "../../scripts/verification-policy/reliability/blocked-aggregate.mjs";

assert.equal(typeof validateBlockedAggregateLineageAdmission, "function",
  "evidence promotion shares the direct immutable bound-incident admission contract");
const blockedAggregateEvidenceCoreSource = await readFile(new URL(
  "../../scripts/verification-evidence/core.mjs", import.meta.url), "utf8");
assert.match(blockedAggregateEvidenceCoreSource,
  /assertBlockedAggregateIncidentAdmission[\s\S]*?validateBlockedAggregateLineageAdmission/u,
  "evidence promotion uses the shared direct bound-incident validator");
assert.match(blockedAggregateEvidenceCoreSource,
  /assertBlockedAggregateIncidentAdmission[\s\S]*?excludeExactBlockedAggregateIncident[\s\S]*?blockingForEvidence/u,
  "evidence promotion removes a same-id evidence blocker only through exact record identity");
assert.equal(typeof excludeExactBlockedAggregateIncident, "function",
  "the evidence blocking set shares the exact bound-record exclusion contract");
assert.match(blockedAggregateEvidenceCoreSource,
  /createPendingVerificationEvidence[\s\S]*?assertBlockedAggregateIncidentAdmission/u,
  "evidence preparation revalidates the direct bound incident");
assert.match(blockedAggregateEvidenceCoreSource,
  /recordPendingVerificationEvidence[\s\S]*?assertBlockedAggregateIncidentAdmission/u,
  "evidence recording revalidates the direct bound incident");

const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);

const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});

const packs = await loadVerificationPacks();

const evidenceBlockedTask = { key:blockedAggregateRouteIdentity.parentTaskKey,
  stage:"browser-observation", packId:"shell", executable:"node",
  args:["scripts/run-browser-observation.mjs", "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"],
  target:"REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
  environment:{ REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER:"1" },
  requiredCapabilities:["local-loopback"], logicalTargetIds:["REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"],
  aliasCommands:[["node", "test/browser-packs/reorderable-editor-controls.mjs"],
    ["node", "scripts/run-browser-observation.mjs", "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"]] };
const evidenceSyntheticTask = { key:blockedAggregateRouteIdentity.syntheticTaskKey,
  stage:"unit", packId:"verification_process", executable:"node",
  args:["test/verification-contracts/execution-binding-contract-test.mjs"],
  target:"test/verification-contracts/execution-binding-contract-test.mjs",
  environment:null, requiredCapabilities:[] };
const evidenceBinding = { version:1,
  incident:{ id:blockedAggregateRouteIdentity.incidentId,
    failureDigest:blockedAggregateRouteIdentity.failureDigest,
    sourceReceipt:blockedAggregateRouteIdentity.sourceReceipt,
    receiptSha256:blockedAggregateRouteIdentity.sourceReceiptSha256,
    runId:blockedAggregateRouteIdentity.incidentRunId,
    candidateCommit:blockedAggregateRouteIdentity.incidentCandidateCommit,
    candidateTree:blockedAggregateRouteIdentity.incidentCandidateTree,
    parentTaskKey:blockedAggregateRouteIdentity.parentTaskKey,
    childTaskKey:blockedAggregateRouteIdentity.childTaskKey,
    childTaskDigest:blockedAggregateRouteIdentity.childTaskDigest,
    command:[...blockedAggregateRouteIdentity.childCommand],
    invocationEnvironments:structuredClone(blockedAggregateRouteIdentity.childInvocationEnvironments) },
  correction:{ task:blockedAggregateRouteIdentity.correctionTask,
    candidateCommit:"d".repeat(40), candidateTree:"e".repeat(40), baseCommit:"f".repeat(40),
    preparationQaCommit:"f".repeat(40), changeSetDigest:"2".repeat(64),
    planDigest:"3".repeat(64), patchId:blockedAggregateRouteIdentity.correctionPatchId,
    changedPaths:[...blockedAggregateRouteIdentity.correctionPaths],
    blockedTaskKey:blockedAggregateRouteIdentity.parentTaskKey,
    syntheticTaskKey:blockedAggregateRouteIdentity.syntheticTaskKey } };
const evidenceDeltaPatch = blockedAggregateRouteIdentity.correctionPaths.map((changedPath, index) => [
  `diff --git a/${changedPath} b/${changedPath}`, `--- a/${changedPath}`,
  `+++ b/${changedPath}`, "@@ -1,0 +2 @@ base", `+route-${index}\n`,
].join("\n")).join("");
const evidenceDeltaFiles = Object.fromEntries(blockedAggregateRouteIdentity.correctionPaths
  .map((changedPath, index) => [changedPath, {
    base:`base-${index}\n`, candidate:`base-${index}\nroute-${index}\n`,
  }]));
const evidenceDeltaIdentity = deriveConservedCorrectionDeltaIdentity({
  task:blockedAggregateRouteIdentity.correctionTask,
  paths:[...blockedAggregateRouteIdentity.correctionPaths],
  source:{ baseCommit:blockedAggregateRouteIdentity.correctionSourceBase,
    baseTree:blockedAggregateRouteIdentity.correctionSourceBaseTree,
    candidateCommit:blockedAggregateRouteIdentity.correctionSourceCandidate,
    candidateTree:blockedAggregateRouteIdentity.correctionSourceCandidateTree,
    patch:evidenceDeltaPatch, files:evidenceDeltaFiles },
  destination:{ baseCommit:"f".repeat(40), baseTree:"8".repeat(40),
    candidateCommit:"d".repeat(40), candidateTree:"e".repeat(40),
    patch:evidenceDeltaPatch, files:evidenceDeltaFiles },
});
evidenceBinding.correction.deltaIdentity = evidenceDeltaIdentity;
const evidenceResults = {
  [evidenceBlockedTask.key]:{ identity:evidenceBlockedTask, status:"blocked-obligation",
    provenance:"obligation", durationMs:0, launched:false, childLaunched:false,
    output:"", stderr:"" },
  [evidenceSyntheticTask.key]:{ identity:evidenceSyntheticTask, status:"passed",
    provenance:"fresh", durationMs:1, output:"synthetic passed", stderr:"" },
  "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
    executable:"npm", args:["run", "package"], target:null, environment:null,
    requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
    output:"package passed", stderr:"" },
};
const evidencePlan = { mode:"exact", includeProperties:true,
  tasks:[evidenceBlockedTask, evidenceSyntheticTask, evidenceResults["package:extension"].identity] };
const evidencePreparedObligation = createBlockedAggregateObligation({
  binding:evidenceBinding, plan:evidencePlan,
  candidate:{ commit:"d".repeat(40), tree:"e".repeat(40), baseCommit:"f".repeat(40),
    evidenceTask:blockedAggregateRouteIdentity.correctionTask,
    changeSetDigest:"2".repeat(64) },
  planDigest:"3".repeat(64), changedPaths:evidenceBinding.correction.changedPaths,
  preparationQaAncestor:true, correctionDeltaIdentity:evidenceDeltaIdentity,
});
assert.throws(() => createBlockedAggregateObligation({
  binding:evidenceBinding, plan:evidencePlan,
  candidate:{ commit:"d".repeat(40), tree:"e".repeat(40), baseCommit:"f".repeat(40),
    evidenceTask:blockedAggregateRouteIdentity.correctionTask, changeSetDigest:"2".repeat(64) },
  planDigest:"3".repeat(64), changedPaths:evidenceBinding.correction.changedPaths,
  preparationQaAncestor:true,
  correctionDeltaIdentity:{ ...evidenceDeltaIdentity, digest:"0".repeat(64) },
}), /delta identity|digest/u,
"promotion cannot admit a patch-id-only claim or altered conserved delta");
const evidenceObligation = sealBlockedAggregateObligation(evidencePreparedObligation,
  evidenceResults);
evidenceResults[evidenceBlockedTask.key].obligationDigest = evidenceObligation.obligationDigest;

assert.equal(validateBlockedAggregateEvidenceResults({
  plan:evidencePlan,
  tasks:evidenceResults, obligation:evidenceObligation,
}).status, "blocked-obligation",
"review evidence preserves one no-launch obligation while every executable member is freshly passed");

assert.throws(() => validateBlockedAggregateEvidenceResults({
  plan:{ mode:"focused-task", includeProperties:true,
    tasks:[evidenceBlockedTask, evidenceSyntheticTask, evidenceResults["package:extension"].identity] },
  tasks:{ ...evidenceResults,
    [evidenceSyntheticTask.key]:{ ...evidenceResults[evidenceSyntheticTask.key], provenance:"reused" } },
  obligation:evidenceObligation,
}), /exact canonical|fresh/u,
"focused substitution and reused synthetic results cannot produce blocked-aggregate evidence");

assert.throws(() => validateBlockedAggregateEvidenceResults({
  plan:evidencePlan, tasks:evidenceResults,
  obligation:{ ...evidenceObligation, obligationDigest:"0".repeat(64) },
}), /obligation digest/u,
"promotion rejects a complete-looking obligation whose digest was altered");

assert.throws(() => validateBlockedAggregateEvidenceResults({
  plan:evidencePlan, tasks:evidenceResults,
  obligation:{ ...evidenceObligation, binding:{ ...evidenceObligation.binding,
    incident:{ ...evidenceObligation.binding.incident, command:["node", "different.mjs"] } } },
}), /command or invocation identity|identity mismatch/u,
"promotion revalidates every canonical incident, command, and environment identity");

const normalizedProof = (value) => Array.isArray(value) ? value.map(normalizedProof)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .filter(([, nested]) => nested !== undefined).sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => [key, normalizedProof(nested)])) : value;
const proofDigest = (value) => createHash("sha256")
  .update(JSON.stringify(normalizedProof(value))).digest("hex");
const childIdentity = { key:blockedAggregateRouteIdentity.childTaskKey, stage:"browser",
  packId:"flow_export", executable:"node",
  args:["test/browser-packs/flow-table-documentation-export.mjs"],
  target:"test/browser-packs/flow-table-documentation-export.mjs", environment:null,
  requiredCapabilities:["local-loopback"] };
const declarationUnsigned = { id:"flow-table-documentation-export",
  executable:"node", args:["test/browser-packs/flow-table-documentation-export.mjs"],
  allowedEnvironment:["SWARMFORGE_AGGREGATE_MATRIX_WIDTH",
    "SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH"],
  canonicalTask:childIdentity, canonicalTaskDigest:proofDigest(childIdentity) };
const declarationDigest = proofDigest(declarationUnsigned);
const invocations = blockedAggregateRouteIdentity.childInvocationEnvironments.map((environment) => ({
  environment:{
    SWARMFORGE_AGGREGATE_MATRIX_WIDTH:environment.SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH,
    ...structuredClone(environment),
  },
})).map(({ environment }) => ({
  environment, id:proofDigest({ declarationDigest, environment }),
}));
const declaration = { ...declarationUnsigned, declarationDigest, invocations };
const protocolParent = { receiptRunId:"route-run", candidate:{ commit:"d".repeat(40),
  tree:"e".repeat(40) }, parentTaskKey:blockedAggregateRouteIdentity.parentTaskKey,
  parentTaskDigest:proofDigest(evidenceBlockedTask) };
const manifestUnsigned = { version:1, parent:protocolParent, declarations:[declaration] };
const manifest = { ...manifestUnsigned, digest:proofDigest(manifestUnsigned) };
const outcomes = invocations.map((invocation) => {
  const unsigned = { version:1, parent:protocolParent, manifestDigest:manifest.digest,
    declarationId:declaration.id, declarationDigest, invocationId:invocation.id,
    invocationEnvironment:invocation.environment, canonicalTask:childIdentity,
    canonicalTaskDigest:declaration.canonicalTaskDigest,
    exit:{ code:0, signal:null }, output:{ stdoutSha256:proofDigest(""), stderrSha256:proofDigest("") },
    status:"passed" };
  return { ...unsigned, digest:proofDigest(unsigned) };
});
const completionUnsigned = { version:1, parent:protocolParent, manifestDigest:manifest.digest,
  status:"passed", closedToNewLaunches:false, drained:true,
  launchedInvocationIds:outcomes.map(({ invocationId }) => invocationId).reverse(),
  outcomeDigests:outcomes.map(({ digest }) => digest), firstFailedInvocationId:null };
const completion = { ...completionUnsigned, digest:proofDigest(completionUnsigned) };
const protocolOutput = [
  JSON.stringify({ swarmforgeAggregateChildManifest:manifest }),
  ...outcomes.map((outcome) => JSON.stringify({ swarmforgeAggregateChildOutcome:outcome })),
  JSON.stringify({ swarmforgeAggregateChildCompletion:completion }),
].join("\n");
const consumerCanonicalPlan = planVerification(packs, {
  packIds:createVerificationPackCardinalityAdapter(packs).runnablePackIds,
  includeProperties:true,
});
const consumerPlan = planPackageTask(closeVerificationPlanPrerequisites(planVerification(packs, {
  packIds:["shell"], includeProperties:true,
}), consumerCanonicalPlan), consumerCanonicalPlan);
consumerPlan.changedPaths = [...blockedAggregateRouteIdentity.consumerChangedPaths];
consumerPlan.changeSet = { paths:[...blockedAggregateRouteIdentity.consumerChangedPaths] };
const consumerTaskIdentities = consumerPlan.tasks.map(verificationTaskIdentity);
const consumerCandidate = { commit:"d".repeat(40), tree:"e".repeat(40),
  baseCommit:"f".repeat(40), evidenceTask:blockedAggregateRouteIdentity.consumerTask,
  changeSetDigest:"8".repeat(64) };
const consumptionAdmission = validateInheritedBlockedAggregatePreflight(evidenceObligation, {
  plan:consumerPlan, taskIdentities:consumerTaskIdentities,
  planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
  candidate:consumerCandidate, patchId:blockedAggregateRouteIdentity.consumerPatchId,
});
const consumptionReceipt = { runId:"route-run", candidate:{ commit:"d".repeat(40),
  tree:"e".repeat(40), baseCommit:"f".repeat(40),
  evidenceTask:blockedAggregateRouteIdentity.consumerTask, changeSetDigest:"8".repeat(64) },
  plan:{ taskPlanDigest:blockedAggregateRouteIdentity.consumerPlanDigest },
  blockedAggregateConsumptionAdmissions:[consumptionAdmission],
  tasks:Object.fromEntries(consumerTaskIdentities.map((identity) => [identity.key, {
    identity, status:"passed", provenance:"fresh", output:"", stderr:"",
  }]).concat([[evidenceBlockedTask.key, {
  identity:evidenceBlockedTask, status:"passed", provenance:"fresh", output:protocolOutput, stderr:"",
}]])) };
const consumption = consumeBlockedAggregateObligation(evidenceObligation, consumptionReceipt, {
  originCommit:"4".repeat(40), originTree:"5".repeat(40),
  candidatePatchId:blockedAggregateRouteIdentity.consumerPatchId,
});
assert.equal(validateBlockedAggregateConsumption(consumption, evidenceObligation).status, "consumed",
"an ancestor obligation is consumed only by the exact governed child protocol and fresh aggregate pass");
assert.throws(() => consumeBlockedAggregateObligation(evidenceObligation, {
  ...consumptionReceipt, tasks:{ ...consumptionReceipt.tasks, [evidenceBlockedTask.key]:{
    ...consumptionReceipt.tasks[evidenceBlockedTask.key], output:"" } },
}, { originCommit:"4".repeat(40), originTree:"5".repeat(40),
  candidatePatchId:blockedAggregateRouteIdentity.consumerPatchId }), /lacks one exact fresh governed/u,
"ordinary descendant evidence cannot ignore its inherited blocked obligation");
assert.throws(() => consumeBlockedAggregateObligation(evidenceObligation, {
  ...consumptionReceipt, candidate:{ ...consumptionReceipt.candidate, commit:"9".repeat(40) },
}, { originCommit:"4".repeat(40), originTree:"5".repeat(40),
  candidatePatchId:blockedAggregateRouteIdentity.consumerPatchId }), /candidate.*mismatch/u,
"consumption rejects a descendant candidate that changed after prelaunch admission");
assert.throws(() => consumeBlockedAggregateObligation(evidenceObligation, {
  ...consumptionReceipt, plan:{ taskPlanDigest:"9".repeat(64) },
}, { originCommit:"4".repeat(40), originTree:"5".repeat(40),
  candidatePatchId:blockedAggregateRouteIdentity.consumerPatchId }), /plan.*mismatch/u,
"consumption rejects a canonical plan that changed after prelaunch admission");
const unrelatedTaskKey = consumerTaskIdentities.find(({ key }) =>
  key !== blockedAggregateRouteIdentity.parentTaskKey).key;
assert.throws(() => consumeBlockedAggregateObligation(evidenceObligation, {
  ...consumptionReceipt,
  tasks:Object.fromEntries(Object.entries(consumptionReceipt.tasks)
    .filter(([key]) => key !== unrelatedTaskKey)),
}, { originCommit:"4".repeat(40), originTree:"5".repeat(40),
  candidatePatchId:blockedAggregateRouteIdentity.consumerPatchId }), /task.*mismatch/u,
"consumption rejects a task set that changed after prelaunch admission");
