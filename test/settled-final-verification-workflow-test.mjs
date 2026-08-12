import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { loadVerificationPacks, planVerification } from "../scripts/verification-packs.mjs";

import {
  createReviewReadyRecord,
  deliveryScorecard,
  finalEvidenceEffect,
  handoffReadinessPolicy,
  recordReviewReadyEvidence,
  runSettledFinalVerificationCommand,
  validateReviewReadyRecord,
  verifyQaReleaseCandidate,
  verifyReviewReadyEvidence,
} from "../scripts/settled-final-verification.mjs";

const exec = promisify(execFile);

const allPacks = [
  "branding_polish", "capture", "command-palette", "defects", "durable_project_repository",
  "event-library", "flow_export", "flow_graph", "guided_test_cases", "hotkeys",
  "layered_schema", "live_flow_testing", "project_assurance_severity",
  "project_event_transport", "project_management", "property_set_flow_sections", "replay",
  "schema_relationship_tree", "schemas", "shell",
];
const baseCommit = "1".repeat(40);
const candidateCommit = "2".repeat(40);
const candidateTree = "3".repeat(40);
const packs = await loadVerificationPacks();
for (const workflowPath of [
  "scripts/settled-final-verification.mjs",
  "scripts/settled-final-verification-policy.mjs",
  "scripts/settled-final-verification-review.mjs",
]) {
  assert.deepEqual(planVerification(packs, { changedPaths:[workflowPath] }).packIds.toSorted(), allPacks,
    `${workflowPath} retains global workflow impact`);
}
const receipt = {
  version:2,
  runId:"focused-run",
  startedAt:"2026-08-11T10:01:00.000Z",
  completedAt:"2026-08-11T10:02:30.000Z",
  candidate:{ commit:candidateCommit, tree:candidateTree },
  plan:{
    mode:"exact", requestedPackIds:["shell"], changedPaths:["scripts/workflow.mjs"],
  },
  tasks:{
    "unit:test/workflow-test.mjs":{
      identity:{ key:"unit:test/workflow-test.mjs" }, status:"passed", durationMs:90000,
    },
  },
};

const reviewRecord = createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt, receiptPath:"tmp/verification-receipts/focused.json", receiptSha256:"4".repeat(64),
  recordedAt:"2026-08-11T10:03:00.000Z",
});
assert.deepEqual(reviewRecord.focusedScope, {
  changedPaths:["scripts/workflow.mjs"], packIds:["shell"],
  taskKeys:["unit:test/workflow-test.mjs"],
});
assert.equal(reviewRecord.result, "passed");
assert.equal(reviewRecord.startedAt, receipt.startedAt);
assert.equal(reviewRecord.completedAt, receipt.completedAt);
assert.equal(validateReviewReadyRecord(reviewRecord, {
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
}), true);
assert.throws(() => validateReviewReadyRecord(reviewRecord, {
  task:"another-task", baseCommit, candidateCommit, candidateTree,
}), /task/i);
assert.throws(() => validateReviewReadyRecord({ ...reviewRecord, finalRegressionClaim:true }, {
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
}), /invalid review-ready/i);
assert.throws(() => validateReviewReadyRecord({
  ...reviewRecord, focusedScope:{ ...reviewRecord.focusedScope, taskKeys:[] },
}, { task:"future-slice", baseCommit, candidateCommit, candidateTree }), /incomplete/i);
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt:{ ...receipt, tasks:{ bad:{ identity:{ key:"bad" }, status:"failed" } } },
  receiptPath:"tmp/verification-receipts/failed.json", receiptSha256:"5".repeat(64),
}), /passed/i);
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["src/side-panel.ts"] },
  receipt, receiptPath:"tmp/verification-receipts/unrelated.json", receiptSha256:"5".repeat(64),
}), /changed paths/i);
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:2, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt, receiptPath:"tmp/verification-receipts/version.json", receiptSha256:"5".repeat(64),
}), /canonical candidate change set/i);

assert.deepEqual(handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), { mode:"review", requiredEvidence:"review-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"refactorer", recipients:["architect"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), { mode:"review", requiredEvidence:"review-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"qa-ready", verified:"review-ready", allPackIds:allPacks,
}), { mode:"qa-integration", requiredEvidence:"review-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"specifier", recipients:["architect"], task:"qa-master-promotion",
  readiness:"release-candidate", verified:"qa-candidate", allPackIds:allPacks,
}), { mode:"master-integration", requiredEvidence:"qa-candidate" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), { mode:"final", requiredEvidence:"final-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"vtd015-settled-final-verification",
  readiness:undefined, verified:allPacks.join(","), allPackIds:allPacks,
}), { mode:"legacy-bootstrap", requiredEvidence:"legacy-exact" });
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"vtd015-settled-final-verification",
  readiness:undefined, verified:"review-ready", allPackIds:allPacks,
}), /legacy exact/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), /qa-ready/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), /review-ready/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["architect"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), /next review role/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"refactorer", recipients:["specifier"], task:"future-slice",
  readiness:undefined, verified:allPacks.join(","), allPackIds:allPacks,
}), /next review role/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"specifier", recipients:["coder"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), /architect.*specifier/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["refactorer"], task:"future-slice",
  readiness:"qa-ready", verified:"review-ready", allPackIds:allPacks,
}), /QA-ready.*architect-to-specifier/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"specifier", recipients:["coder"], task:"qa-master-promotion",
  readiness:"release-candidate", verified:"qa-candidate", allPackIds:allPacks,
}), /QA release candidates.*specifier-to-architect/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.slice(1).join(","), allPackIds:allPacks,
}), /every canonical verification pack/i);
assert.deepEqual(handoffReadinessPolicy({
  sender:"specifier", recipients:["coder"], task:"future-slice",
  readiness:undefined, verified:"not-required", allPackIds:allPacks,
}), { mode:"ordinary", requiredEvidence:"legacy" });

assert.deepEqual(finalEvidenceEffect({
  changedPaths:["src/side-panel.ts"], boundIdentitiesEqual:false,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["docs/scorecard.md"], boundIdentitiesEqual:true,
}), { eligible:true, action:"promote-or-integrate" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["features/changed-contract.feature"], boundIdentitiesEqual:true,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["manifest.json"], boundIdentitiesEqual:true,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["docs/scorecard.md", "verification/packs.json"], boundIdentitiesEqual:false,
}), { eligible:false, action:"settle-and-rerun-all-20" });

const scorecard = deliveryScorecard({
  approvedAt:"2026-08-11T10:00:00.000Z", integratedAt:"2026-08-11T11:00:00.000Z",
  handoffs:[
    { role:"coder", startedAt:"2026-08-11T10:00:00.000Z", completedAt:"2026-08-11T10:15:00.000Z" },
    { role:"refactorer", startedAt:"2026-08-11T10:15:00.000Z", completedAt:"2026-08-11T10:30:00.000Z" },
  ],
  receipts:[
    { kind:"review-ready", durationMs:60000, status:"passed" },
    { kind:"final-ready", durationMs:1200000, status:"passed", terminalLeavesPreserved:true },
    { kind:"final-ready", durationMs:1000000, status:"passed", invalidated:true },
    { kind:"final-ready", durationMs:10000, status:"failed", repaired:true, rerun:true },
  ],
  historicalSuccessfulFullRuns:2,
});
assert.equal(scorecard.approvalToIntegrationMs, 3600000);
assert.equal(scorecard.focusedVerificationMs, 60000);
assert.equal(scorecard.finalGateMs, 2210000);
assert.equal(scorecard.successfulFullRuns, 2);
assert.equal(scorecard.invalidatedFullRuns, 1);
assert.equal(scorecard.failures, 1);
assert.equal(scorecard.repairs, 1);
assert.equal(scorecard.reruns, 1);
assert.equal(scorecard.terminalEvidencePreserved, true);
assert.equal(scorecard.modeledAvoidedSuccessfulFullRuns, 1);
await runSettledFinalVerificationCommand([
  "validate-handoff", "coder", "refactorer", "vtd015-settled-final-verification",
  "legacy", allPacks.join(","),
]);
await assert.rejects(() => runSettledFinalVerificationCommand(["unknown"]), /use:/i);

const evidenceRepository = await mkdtemp(path.join(os.tmpdir(), "review-ready-evidence-"));
try {
  await exec("git", ["init", "-q"], { cwd:evidenceRepository });
  await exec("git", ["config", "user.name", "Review Evidence Test"], { cwd:evidenceRepository });
  await exec("git", ["config", "user.email", "review-evidence@example.test"], { cwd:evidenceRepository });
  await writeFile(path.join(evidenceRepository, ".gitignore"), "tmp/\n");
  await writeFile(path.join(evidenceRepository, "README.md"), "base\n");
  await exec("git", ["add", ".gitignore", "README.md"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "base"], { cwd:evidenceRepository });
  const { stdout:base } = await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository });
  await mkdir(path.join(evidenceRepository, "scripts"));
  await writeFile(path.join(evidenceRepository, "scripts", "workflow.mjs"), "export const ready = true;\n");
  await exec("git", ["add", "scripts/workflow.mjs"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "candidate"], { cwd:evidenceRepository });
  const [{ stdout:candidate }, { stdout:tree }] = await Promise.all([
    exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository }),
    exec("git", ["rev-parse", "HEAD^{tree}"], { cwd:evidenceRepository }),
  ]);
  const receiptDirectory = path.join(evidenceRepository, "tmp", "verification-receipts");
  await mkdir(receiptDirectory, { recursive:true });
  const receiptFile = path.join(receiptDirectory, "focused.json");
  await writeFile(receiptFile, JSON.stringify({
    ...receipt,
    candidate:{ commit:candidate.trim(), tree:tree.trim() },
  }));
  const recorded = await recordReviewReadyEvidence(
    receiptFile, base.trim(), "future-slice", { repositoryRoot:evidenceRepository },
  );
  assert.equal(recorded.changeSet.paths[0], "scripts/workflow.mjs");
  const verified = await verifyReviewReadyEvidence(
    candidate.trim(), base.trim(), "future-slice", { repositoryRoot:evidenceRepository },
  );
  assert.equal(verified.receipt.sha256, recorded.receipt.sha256);
  await assert.rejects(() => verifyReviewReadyEvidence(
    candidate.trim(), base.trim(), "another-task", { repositoryRoot:evidenceRepository },
  ), /no bound review-ready evidence/i);
} finally {
  await rm(evidenceRepository, { recursive:true, force:true });
}

const releaseRepository = await mkdtemp(path.join(os.tmpdir(), "qa-release-candidate-"));
try {
  await exec("git", ["init", "-q", "--initial-branch=master"], { cwd:releaseRepository });
  await exec("git", ["config", "user.name", "QA Release Test"], { cwd:releaseRepository });
  await exec("git", ["config", "user.email", "qa-release@example.test"], { cwd:releaseRepository });
  await writeFile(path.join(releaseRepository, "README.md"), "master\n");
  await exec("git", ["add", "README.md"], { cwd:releaseRepository });
  await exec("git", ["commit", "-qm", "master base"], { cwd:releaseRepository });
  const { stdout:releaseBase } = await exec("git", ["rev-parse", "HEAD"], { cwd:releaseRepository });
  await exec("git", ["switch", "-q", "-c", "qa"], { cwd:releaseRepository });
  await writeFile(path.join(releaseRepository, "feature.txt"), "qa feature\n");
  await exec("git", ["add", "feature.txt"], { cwd:releaseRepository });
  await exec("git", ["commit", "-qm", "QA feature"], { cwd:releaseRepository });
  const { stdout:releaseCandidate } = await exec("git", ["rev-parse", "HEAD"], { cwd:releaseRepository });
  const verifiedRelease = await verifyQaReleaseCandidate(
    releaseCandidate.trim(), releaseBase.trim(), { repositoryRoot:releaseRepository },
  );
  assert.equal(verifiedRelease.qaHead, releaseCandidate.trim());
  assert.equal(verifiedRelease.masterHead, releaseBase.trim());
  await assert.rejects(() => verifyQaReleaseCandidate(
    releaseBase.trim(), releaseBase.trim(), { repositoryRoot:releaseRepository },
  ), /exact QA head/u);
} finally {
  await rm(releaseRepository, { recursive:true, force:true });
}

console.log(JSON.stringify({
  vtd015Acceptance:{
    reviewReady:{
      bound:true, focusedOnly:true, finalClaim:false,
      roles:{ coder:"refactorer", refactorer:"architect" },
      fields:["task", "baseCommit", "candidateCommit", "candidateTree", "changeSet",
        "focusedScope", "result", "startedAt", "completedAt", "recordedAt"],
    },
    finalReady:{
      packCount:allPacks.length, propertyRequired:true, packageRequired:true,
      terminalEvidencePreserved:true, sealedTreeOnly:true,
      bindings:["base", "task", "candidateTree", "completePlan", "artifact", "toolchain",
        "receipt", "timestamps"],
    },
    invalidation:{
      rows:{
        "production, test, build, registry, runner, or workflow input changes":{
          effect:"final evidence is invalid", action:"settle the changed tree and run all 20 packs freshly" },
        "documentation-only recording preserves every bound identity":{
          effect:"final product evidence remains eligible", action:"promote or integrate without another product run" },
      },
    },
    failure:{ recorded:true, causalFocusedProof:true, freshAll20:true, package:true,
      noRetry:true, noLowerConcurrency:true, noCarriedLeaf:true, noUnrelatedReceipt:true },
    actions:{
      "focused refactorer or architect review":"permit the next named review role",
      "QA integration after an exact architect QA-ready handoff":"permit only the QA fast-forward",
      "integration into master":"block because final evidence is absent",
      "completion broadcast to the specifier":"block because final evidence is absent",
      "promotion of another task or base receipt as final":"block because its bound identity does not match",
    },
    historical:{
      "Command Palette controller":{ successfulFullRuns:3, avoidedFullRuns:2 },
      "workspace-tabs controller":{ successfulFullRuns:2, avoidedFullRuns:1 },
    },
    bootstrap:{ task:"vtd015-settled-final-verification", mode:"legacy-bootstrap",
      inactiveUntilIntegration:true, firstPayback:"VTD-012", noBypass:true },
    completedFeatureDelta:0,
    recommendationRequired:true,
    qaPilot:{
      qaReady:{ exactTreeOnly:true, focusedOnly:true, boundFocusedEvidence:true,
        qaFastForwardOnly:true, fullRegressionClaim:false, masterCompletionClaim:false },
      masterIntegration:{ explicitUserRequest:true, qaHeadFrozen:true, masterBaseBound:true,
        cleanLineage:true, exactPromotionOnly:true, branchesConverge:true,
        bindings:["masterBase", "releaseTask", "candidateTree", "completePlan", "artifact",
          "toolchain", "receipt", "timestamps"] },
      scorecard:{
        deliveryIntervals:{ approvalToQa:true, qaQueue:true, approvalToMaster:true },
        verificationMeasures:{ focused:true, finalAttempts:true, failures:true, repairs:true,
          reverts:true, reruns:true, amortizedFinalGate:true },
        baselineComparison:true, userControlsPromotion:true,
      },
    },
    scorecard,
  },
}));
console.log("settled final verification workflow tests passed");
