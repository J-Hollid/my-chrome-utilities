import assert from "node:assert/strict";

import {
  buildEligibleRepairAdmissions,
  validateEligibleRepairAdmissionsReceipt,
} from "../../scripts/verification-run-intent.mjs";
import { timeoutIncidentDigest } from "../../scripts/verification-reliability-values.mjs";
import { verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";

const sourceTask = {
  key:"unit:test/repair-regression-test.mjs", stage:"unit", packId:"verification_process",
  executable:"node", args:["test/repair-regression-test.mjs"],
  target:"test/repair-regression-test.mjs", environment:null, requiredCapabilities:[],
};
const packageTask = {
  key:"package:extension", stage:"package", packId:null, executable:"node",
  args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
  environment:null, requiredCapabilities:[],
};
const successorTask = { ...sourceTask, key:"unit:test/current-repair-regression-test.mjs",
  args:["test/current-repair-regression-test.mjs"],
  target:"test/current-repair-regression-test.mjs" };
const repairCandidate = { commit:"repair-candidate", tree:"repair-tree" };
const currentCandidate = { commit:"current-candidate", tree:"current-tree" };
const receiptSha256 = "3".repeat(64);
const incident = {
  id:"ancestor-repair", state:"unresolved", failureDigest:"1".repeat(64),
  failure:{ task:sourceTask, causalKey:"2".repeat(64) },
  repair:{ status:"eligible", candidate:repairCandidate,
    checkpoint:{ baseCommit:"approved-base", evidenceTask:"phase-two" },
    causalCategory:"other:bounded repair", causalExplanation:"The exact defect was repaired.",
    regression:{ key:sourceTask.key, status:"passed", commit:repairCandidate.commit,
      receiptPath:"tmp/verification-receipts/repair.json", receiptSha256 },
    focusedReceipt:{ status:"passed", commit:repairCandidate.commit, provenance:"fresh",
      receiptPath:"tmp/verification-receipts/repair.json", receiptSha256 },
    causalProtocol:{ version:2, incidentId:"ancestor-repair", failureDigest:"1".repeat(64),
      preRepairResult:{ status:"failed" }, repairResult:{ status:"passed" } },
    focusedTaskPlan:[{ identity:sourceTask, roles:["causal-regression","diagnosed-boundary"] }],
  },
};
const receiptDocument = {
  sha256:receiptSha256,
  receipt:{ completedAt:"2026-09-03T00:00:00.000Z", runIntent:"repair-focused",
    candidate:{ ...repairCandidate, baseCommit:incident.repair.checkpoint.baseCommit,
      evidenceTask:incident.repair.checkpoint.evidenceTask },
    plan:{ mode:"timeout-repair-focused", incidentId:incident.id,
      causalCategory:incident.repair.causalCategory,
      causalExplanation:incident.repair.causalExplanation,
      taskPlan:incident.repair.focusedTaskPlan },
    tasks:{ [sourceTask.key]:{ identity:sourceTask, status:"passed", provenance:"fresh" } } },
};
const baseInputs = {
  incidents:[incident], plan:{ tasks:[sourceTask, packageTask] }, packs:[],
  candidate:currentCandidate, baseCommit:"approved-base", evidenceTask:"phase-two",
  changeSetDigest:"4".repeat(64), planDigest:"5".repeat(64),
  isAncestor:async(ancestor, descendant) =>
    ancestor === repairCandidate.commit && descendant === currentCandidate.commit,
  loadReceipt:async() => receiptDocument,
};

const admission = await buildEligibleRepairAdmissions(baseInputs);
const compatibility = admission.entries[0].ancestorRepairCompatibility;
assert.equal(compatibility.repairCandidateCommit, repairCandidate.commit);
assert.equal(compatibility.currentCandidateCommit, currentCandidate.commit);
assert.equal(compatibility.sourceTaskDigest, verificationTaskDigest(sourceTask));
assert.equal(compatibility.selectedTaskDigest, verificationTaskDigest(sourceTask));
assert.equal(compatibility.packageTaskDigest, verificationTaskDigest(packageTask));
assert.equal(compatibility.digest,
  timeoutIncidentDigest({ ...compatibility, digest:undefined }),
"an ancestor repair records its immutable receipt, task, package, and lineage identity");
const currentReceipt = {
  candidate:{ ...currentCandidate, baseCommit:"approved-base", evidenceTask:"phase-two",
    changeSetDigest:"4".repeat(64) },
  plan:{ changeSetDigest:"4".repeat(64), taskPlanDigest:"5".repeat(64) },
  tasks:{
    [sourceTask.key]:{ identity:sourceTask, status:"passed", provenance:"fresh" },
    [packageTask.key]:{ identity:packageTask, status:"passed", provenance:"fresh" },
  },
};
assert.equal(validateEligibleRepairAdmissionsReceipt(currentReceipt, admission), admission,
  "the current receipt retains the authenticated ancestor compatibility");
assert.throws(() => validateEligibleRepairAdmissionsReceipt(currentReceipt, {
  ...admission, entries:[{ ...admission.entries[0], ancestorRepairCompatibility:{
    ...compatibility, repairCandidateTree:"changed-tree",
  } }],
}), /malformed or causally conflicting/u,
"an altered persisted ancestor compatibility fails closed");

await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  isAncestor:async() => false,
}), /ancestor/u, "a non-ancestral repair candidate fails closed");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  loadReceipt:async() => ({ ...receiptDocument, sha256:"6".repeat(64) }),
}), /receipt identity/u, "an altered repair receipt fails closed");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[{ ...sourceTask, args:["test/changed-regression-test.mjs"] }, packageTask] },
  canonicalIdentities:[successorTask],
  resolveSuccession:async() => { throw new Error("no authenticated succession"); },
}), /causal task/u, "an altered causal task without succession fails closed");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[sourceTask] },
}), /package:extension/u, "ancestor compatibility requires the exact package boundary");

const succession = { destinationTaskDigest:verificationTaskDigest(successorTask),
  conservationDigest:"7".repeat(64) };
const successorAdmission = await buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[successorTask, packageTask] }, canonicalIdentities:[successorTask],
  resolveSuccession:async() => succession,
});
assert.equal(successorAdmission.entries[0].coverageKind, "successor");
assert.equal(successorAdmission.entries[0].selectedTaskKey, successorTask.key);
assert.equal(successorAdmission.entries[0].ancestorRepairCompatibility.conservationDigest,
  succession.conservationDigest,
"authenticated task succession can conserve changed causal task identity");

console.log("eligible repair lineage compatibility contract tests passed");
