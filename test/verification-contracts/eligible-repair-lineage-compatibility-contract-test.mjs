import assert from "node:assert/strict";

import {
  buildEligibleRepairAdmissions,
  validateEligibleRepairAdmissionsReceipt,
} from "../../scripts/verification-run-intent.mjs";
import { timeoutIncidentDigest } from "../../scripts/verification-reliability-values.mjs";
import { verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";
import {authenticateAncestorRepairReceiptExecution} from
  "../../scripts/verification-policy/reliability/ancestor-repair-receipt-authentication.mjs";

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
const supportingTask = { ...sourceTask, key:"unit:test/supporting-repair-test.mjs",
  args:["test/supporting-repair-test.mjs"], target:"test/supporting-repair-test.mjs" };
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
    focusedTaskPlan:[{ identity:sourceTask, roles:["causal-regression","diagnosed-boundary"],
      executionArgs:[...sourceTask.args],executionLogicalTargetIds:[] }],
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
      taskPlan:incident.repair.focusedTaskPlan,
      executionTaskPlan:incident.repair.focusedTaskPlan },
    tasks:{ [sourceTask.key]:{ identity:sourceTask, status:"passed", provenance:"fresh",
      execution:{args:[...sourceTask.args],logicalTargetIds:[]} } } },
};
const baseInputs = {
  incidents:[incident], plan:{ tasks:[sourceTask, packageTask] }, packs:[],
  candidate:currentCandidate, baseCommit:"approved-base", evidenceTask:"phase-two",
  changeSetDigest:"4".repeat(64), planDigest:"5".repeat(64),
  isAncestor:async(ancestor, descendant) =>
    ancestor === repairCandidate.commit && descendant === currentCandidate.commit,
  loadReceipt:async() => receiptDocument,
  loadRepairCandidateRegistry:async()=>({tree:repairCandidate.tree,identities:[sourceTask]}),
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
  loadReceipt:async() => ({ ...receiptDocument,
    receipt:{ ...receiptDocument.receipt, completedAt:null } }),
}), /receipt identity/u, "a receipt without a valid completion fails closed");
const changedExecutionDocument=JSON.parse(JSON.stringify(receiptDocument));
changedExecutionDocument.receipt.tasks[sourceTask.key].execution.args=["changed-execution.mjs"];
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  loadReceipt:async()=>changedExecutionDocument,
}),/receipt identity/u,"a changed focused execution override fails closed");
const twoTaskPlan = [...incident.repair.focusedTaskPlan,
  { identity:supportingTask, roles:["supporting-prerequisite"] }];
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  incidents:[{ ...incident, repair:{ ...incident.repair, focusedTaskPlan:twoTaskPlan } }],
  loadReceipt:async() => ({ ...receiptDocument, receipt:{ ...receiptDocument.receipt,
    plan:{ ...receiptDocument.receipt.plan, taskPlan:twoTaskPlan } } }),
}), /receipt identity/u, "a receipt missing one focused task fails closed");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[{ ...sourceTask, args:["test/changed-regression-test.mjs"] }, packageTask] },
  canonicalIdentities:[successorTask],
  resolveSuccession:async() => { throw new Error("no authenticated succession"); },
}), /causal task/u, "an altered causal task without succession fails closed");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[sourceTask] },
}), /package:extension/u, "ancestor compatibility requires the exact package boundary");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[sourceTask, { ...packageTask, target:"build/package/changed.zip" }] },
}), /package:extension/u, "ancestor compatibility rejects a changed package target");
await assert.rejects(buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[sourceTask, { ...packageTask, requiredCapabilities:["local-loopback"] }] },
}), /package:extension/u, "ancestor compatibility rejects changed package capabilities");

const succession = { destinationTaskDigest:verificationTaskDigest(successorTask),
  conservationDigest:"7".repeat(64) };
let successionIdentities;
const successorAdmission = await buildEligibleRepairAdmissions({ ...baseInputs,
  plan:{ tasks:[successorTask, packageTask] },
  resolveSuccession:async({ currentIdentities }) => {
    successionIdentities = currentIdentities;
    return succession;
  },
});
assert.deepEqual(successionIdentities,[successorTask,packageTask],
  "succession is authenticated against the fresh exact evidence plan");
assert.equal(successorAdmission.entries[0].coverageKind, "successor");
assert.equal(successorAdmission.entries[0].selectedTaskKey, successorTask.key);
assert.equal(successorAdmission.entries[0].ancestorRepairCompatibility.conservationDigest,
  succession.conservationDigest,
"authenticated task succession can conserve changed causal task identity");

const task=(key,prerequisiteTaskKeys=[])=>({
  key,stage:"unit",packId:"verification_process",executable:"node",args:[`${key}.mjs`],
  target:`${key}.mjs`,environment:null,requiredCapabilities:[],
  ...(prerequisiteTaskKeys.length?{prerequisiteTaskKeys}:{}),
});
const prerequisiteTasks=Array.from({length:52},(_,index)=>task(`unit:prerequisite-${index}`));
const focusedTasks=Array.from({length:35},(_,index)=>task(`unit:focused-${index}`));
focusedTasks[0]=task("unit:focused-0",prerequisiteTasks.map(({key})=>key));
const expandedIncident={...structuredClone(incident),repair:{...structuredClone(incident.repair),
  candidate:{commit:"expanded-repair",tree:"expanded-tree"},
  regression:{...structuredClone(incident.repair.regression),key:focusedTasks[0].key},
  focusedTaskPlan:focusedTasks.map((identity,index)=>({identity,roles:index===0
    ?["causal-regression","diagnosed-boundary"]:["affected-process-contract"]})),
}};
const canonicalExpanded=[...prerequisiteTasks,...focusedTasks];
const focusedByKey=new Map(expandedIncident.repair.focusedTaskPlan
  .map((descriptor)=>[descriptor.identity.key,descriptor]));
const expandedExecutionPlan=canonicalExpanded.map((identity)=>
  focusedByKey.get(identity.key)??{identity,roles:["prerequisite"]});
const expandedReceipt={plan:{executionTaskPlan:expandedExecutionPlan},
  tasks:Object.fromEntries(expandedExecutionPlan.map(({identity})=>[identity.key,{
    identity,status:"passed",provenance:"fresh",
  }]))};
const expandedRegistryLoader=async()=>({tree:"expanded-tree",identities:canonicalExpanded});
assert.equal((await authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:expandedReceipt,
  registryLoader:expandedRegistryLoader,
})).length,87,"a 35-task repair declaration authenticates its exact 87-task closure");

const extraReceipt=structuredClone(expandedReceipt);
extraReceipt.tasks["unit:arbitrary-88"]={identity:task("unit:arbitrary-88"),
  status:"passed",provenance:"fresh"};
await assert.rejects(authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:extraReceipt,
  registryLoader:expandedRegistryLoader,
}),/task closure changed/u,"an arbitrary 88th receipt task fails closed");

const missingReceipt=structuredClone(expandedReceipt);
delete missingReceipt.tasks[prerequisiteTasks[0].key];
await assert.rejects(authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:missingReceipt,
  registryLoader:expandedRegistryLoader,
}),/task closure changed/u,"a missing canonical prerequisite fails closed");

const alteredIdentityReceipt=JSON.parse(JSON.stringify(expandedReceipt));
alteredIdentityReceipt.tasks[prerequisiteTasks[0].key].identity.args=["changed.mjs"];
await assert.rejects(authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:alteredIdentityReceipt,
  registryLoader:expandedRegistryLoader,
}),/task identity changed/u,"an altered prerequisite identity fails closed");

const changedRegistry=structuredClone(canonicalExpanded);
changedRegistry[0].args=["changed-registry.mjs"];
await assert.rejects(authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:expandedReceipt,
  registryLoader:async()=>({tree:"expanded-tree",identities:changedRegistry}),
}),/expanded plan identity changed/u,"a changed repair-candidate registry fails closed");

const changedPlanReceipt=structuredClone(expandedReceipt);
changedPlanReceipt.plan.executionTaskPlan[0].roles=["invented-role"];
await assert.rejects(authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:changedPlanReceipt,
  registryLoader:expandedRegistryLoader,
}),/expanded plan identity changed/u,"a changed expanded-plan identity fails closed");

await assert.rejects(authenticateAncestorRepairReceiptExecution({
  root:"fixture",incident:expandedIncident,receipt:expandedReceipt,
  registryLoader:async()=>({tree:"changed-tree",identities:canonicalExpanded}),
}),/candidate registry identity changed/u,"a changed repair-candidate tree fails closed");

console.log("eligible repair lineage compatibility contract tests passed");
