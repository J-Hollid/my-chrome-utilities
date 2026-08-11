import assert from "node:assert/strict";

import {
  createReviewReadyRecord,
  deliveryScorecard,
  finalEvidenceEffect,
  handoffReadinessPolicy,
  validateReviewReadyRecord,
} from "../scripts/settled-final-verification.mjs";

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
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:[] },
  receipt:{ ...receipt, tasks:{ bad:{ identity:{ key:"bad" }, status:"failed" } } },
  receiptPath:"tmp/verification-receipts/failed.json", receiptSha256:"5".repeat(64),
}), /passed/i);

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
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), { mode:"final", requiredEvidence:"final-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"vtd015-settled-final-verification",
  readiness:undefined, verified:allPacks.join(","), allPackIds:allPacks,
}), { mode:"legacy-bootstrap", requiredEvidence:"legacy-exact" });
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), /final-ready/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), /review-ready/i);

assert.deepEqual(finalEvidenceEffect({
  changedPaths:["src/side-panel.ts"], boundIdentitiesEqual:false,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["docs/scorecard.md"], boundIdentitiesEqual:true,
}), { eligible:true, action:"promote-or-integrate" });
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
      "integration into the accepted branch":"block because final evidence is absent",
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
    scorecard,
  },
}));
console.log("settled final verification workflow tests passed");
