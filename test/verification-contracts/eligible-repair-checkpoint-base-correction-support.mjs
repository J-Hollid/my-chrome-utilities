import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {planVerification, verificationTaskIdentity} from
  "../../scripts/verification-packs.mjs";
import {loadVerificationPacks} from
  "../../scripts/verification-registry/validation.mjs";
import {
  createEligibleRepairCheckpointCorrection,
  effectiveEligibleRepair,
  eligibleRepairStateDigest,
  validateInitialRepairCheckpoint,
} from "../../scripts/verification-policy/reliability/eligible-repair-checkpoint-correction.mjs";
import {buildEligibleRepairAdmissions} from
  "../../scripts/verification-run-intent.mjs";
import {validateIncident} from
  "../../scripts/verification-reliability-persistence.mjs";
import {timeoutIncidentDigest} from
  "../../scripts/verification-reliability-values.mjs";
import {appendEligibleRepairCheckpointCorrection, repairProposalDiagnosticStateCompatible} from
  "../../scripts/verification-reliability-repair-store-operation.mjs";

export const eligibleRepairCheckpointBaseCorrectionEvidence = await (async() => {
const packs = await loadVerificationPacks();
const plan = planVerification(packs, {packIds:["verification_process"]});
const task = verificationTaskIdentity(plan.tasks.find(({stage}) => stage === "unit"));
const candidate = {commit:"repair-commit", tree:"repair-tree"};
const approvedCheckpoint = {
  baseCommit:"approved-base",
  evidenceTask:"side-panel-schema-editor-reachability",
};
const rejectedCheckpoint = {...approvedCheckpoint, baseCommit:"intermediate-base"};
const failureDigest = "1".repeat(64);
const causalKey = "2".repeat(64);
const originalReceipt = {
  path:"tmp/verification-receipts/original.json",
  sha256:"3".repeat(64),
};
const correctedReceipt = {
  path:"tmp/verification-receipts/corrected.json",
  sha256:"4".repeat(64),
};
const incident = {
  id:"schema-editor-checkpoint", state:"unresolved", failureDigest,
  failure:{lineage:{...candidate, ...approvedCheckpoint}, task, causalKey},
  repair:{status:"eligible", candidate, checkpoint:rejectedCheckpoint,
    causalCategory:"other:verification fixture ownership and immutable migration ledger",
    causalExplanation:"The migration identity followed the changed manifest.",
    regression:{key:task.key, status:"passed", commit:candidate.commit,
      receiptPath:originalReceipt.path, receiptSha256:originalReceipt.sha256},
    focusedReceipt:{status:"passed", commit:candidate.commit, provenance:"fresh",
      receiptPath:originalReceipt.path, receiptSha256:originalReceipt.sha256},
    diagnosedBoundary:{kind:"task", taskKey:task.key, executionArgs:task.args},
    causalProtocol:{version:2, incidentId:"schema-editor-checkpoint", failureDigest,
      preRepairResult:{status:"failed"}, repairResult:{status:"passed"}},
    focusedTaskPlan:[{identity:task, roles:["causal-regression", "diagnosed-boundary"]}]},
};
const correctedRepair = {...structuredClone(incident.repair), checkpoint:approvedCheckpoint,
  regression:{...incident.repair.regression, receiptPath:correctedReceipt.path,
    receiptSha256:correctedReceipt.sha256},
  focusedReceipt:{...incident.repair.focusedReceipt, receiptPath:correctedReceipt.path,
    receiptSha256:correctedReceipt.sha256}};

assert.equal(validateInitialRepairCheckpoint({
  ...incident, repair:undefined,
}, approvedCheckpoint), approvedCheckpoint,
"a first repair proposal accepts the approved failure-lineage checkpoint");
assert.throws(() => validateInitialRepairCheckpoint({
  ...incident, repair:undefined,
}, rejectedCheckpoint), /failure lineage/u,
"a first repair proposal rejects an intermediate checkpoint base");

const correction = createEligibleRepairCheckpointCorrection(incident, correctedRepair, {
  correctedAt:"2026-09-04T00:45:00.000Z",
});
assert.deepEqual(correction.priorCheckpoint, rejectedCheckpoint,
  "the correction retains the rejected prior binding");
assert.deepEqual(correction.effectiveCheckpoint, approvedCheckpoint,
  "the correction binds the approved failure-lineage checkpoint");
assert.equal(correction.correctedEvidence.focusedReceipt.receiptSha256,
  correctedReceipt.sha256, "the correction binds the fresh correct-base receipt");

const correctedIncident = {...structuredClone(incident),
  repairCheckpointCorrection:correction};
const effective = effectiveEligibleRepair(correctedIncident);
assert.deepEqual(effective.checkpoint, approvedCheckpoint);
assert.equal(effective.focusedReceipt.receiptSha256, correctedReceipt.sha256);
assert.notEqual(eligibleRepairStateDigest(correctedIncident),
  eligibleRepairStateDigest(incident), "the append-only correction changes repair proof identity");

for (const [name, mutate] of [
  ["base", (repair) => { repair.checkpoint.baseCommit = "other-base"; }],
  ["task", (repair) => { repair.checkpoint.evidenceTask = "other-task"; }],
  ["candidate", (repair) => { repair.candidate.commit = "other-commit"; }],
  ["tree", (repair) => { repair.candidate.tree = "other-tree"; }],
  ["causal proof", (repair) => { repair.causalProtocol.repairResult.status = "failed"; }],
  ["regression", (repair) => { repair.regression.key = "unit:other"; }],
  ["receipt", (repair) => {
    repair.focusedReceipt = structuredClone(incident.repair.focusedReceipt);
    repair.regression = structuredClone(incident.repair.regression);
  }],
]) {
  const changed = structuredClone(correctedRepair);
  mutate(changed);
  assert.throws(() => createEligibleRepairCheckpointCorrection(incident, changed, {
    correctedAt:"2026-09-04T00:45:00.000Z",
  }), /checkpoint correction/u, `${name} drift fails checkpoint correction closed`);
}

assert.throws(() => createEligibleRepairCheckpointCorrection(correctedIncident,
  correctedRepair, {correctedAt:"2026-09-04T00:46:00.000Z"}), /one correction/u,
"an incident cannot append a second checkpoint correction");

const persistentFailure = {lineage:{...candidate, ...approvedCheckpoint}, task};
const persistentFailureDigest = timeoutIncidentDigest(persistentFailure);
const persistentIncident = {...structuredClone(incident),
  createdAt:"2026-09-04T00:43:00.000Z", failure:persistentFailure,
  failureDigest:persistentFailureDigest,
  retry:{status:"invalidated-by-repair", classification:"not-retried-repaired",
    invalidatedAt:"2026-09-04T00:44:00.000Z"},
  transitions:[{type:"repair-proposed", at:"2026-09-04T00:44:00.000Z",
    commit:candidate.commit}]};
persistentIncident.repair.causalProtocol.failureDigest = persistentFailureDigest;
assert.equal(repairProposalDiagnosticStateCompatible(persistentIncident, {
  checkpointCorrectionRequired:true,
}), true, "an invalidated repair retry permits its exact checkpoint correction");
const persistentCorrectedRepair = {...structuredClone(persistentIncident.repair),
  checkpoint:approvedCheckpoint,
  regression:structuredClone(correctedRepair.regression),
  focusedReceipt:structuredClone(correctedRepair.focusedReceipt)};
const correctedPersistentIncident = appendEligibleRepairCheckpointCorrection(
  persistentIncident, persistentCorrectedRepair, "2026-09-04T00:45:00.000Z");
assert.equal(validateIncident(correctedPersistentIncident), correctedPersistentIncident,
  "persistence accepts one append-only exact checkpoint correction");
const changedHistory = structuredClone(correctedPersistentIncident);
changedHistory.repairCheckpointCorrection.effectiveCheckpoint.baseCommit = "other-base";
assert.throws(() => validateIncident(changedHistory), /checkpoint correction/u,
  "persistence rejects a changed effective correction binding");

const admissions = await buildEligibleRepairAdmissions({
  incidents:[correctedIncident], plan, packs, candidate,
  baseCommit:approvedCheckpoint.baseCommit,
  evidenceTask:approvedCheckpoint.evidenceTask,
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
});
assert.equal(admissions.entries[0].repairDigest,
  eligibleRepairStateDigest(correctedIncident),
"normal evidence admission binds the effective corrected repair state");
await assert.rejects(() => buildEligibleRepairAdmissions({
  incidents:[correctedIncident], plan, packs, candidate,
  baseCommit:rejectedCheckpoint.baseCommit,
  evidenceTask:approvedCheckpoint.evidenceTask,
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
}), /review checkpoint/u,
"the rejected intermediate base cannot enter normal evidence admission");

return {eligibleRepairCheckpointBaseCorrection:{
  passed:true, priorBase:rejectedCheckpoint.baseCommit,
  effectiveBase:approvedCheckpoint.baseCommit, failClosedMutations:8,
}};
})();

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(eligibleRepairCheckpointBaseCorrectionEvidence));
}
