import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import { loadVerificationPacks, planVerification } from
  "../scripts/verification-packs.mjs";
import {
  verificationPolicyContracts,
  verificationProcessCompatibilitySuccessors,
} from "../scripts/verification-policy/contracts.mjs";

for (const { testPath } of verificationPolicyContracts) {
  execFileSync(process.execPath, [testPath], { cwd:process.cwd(), stdio:"pipe" });
}
execFileSync(process.execPath, ["test/verification-candidate-inventory-test.mjs"],
  { cwd:process.cwd(), stdio:"pipe" });
execFileSync(process.execPath, ["test/verification-policy-contract-routing-test.mjs"],
  { cwd:process.cwd(), stdio:"pipe" });

const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, { changedPaths:["src/workspace-tabs-ui.ts"] });
assert.equal(shellPlan.selectedPackIds.includes("verification_process"), false,
  "product-only Shell planning excludes verification policy contracts");

const terminal = planVerification(packs, { terminalFull:true, includeProperties:true });
const taskKeys = terminal.tasks.map(({ key }) => key);
for (const successor of verificationProcessCompatibilitySuccessors.slice(0, -1)) {
  assert.equal(taskKeys.filter((key) => key === `unit:${successor}`).length, 1,
    `terminal planning conserves ${successor} exactly once`);
}
assert.equal(taskKeys.includes("unit:test/verification-process-contract-test.mjs"), false,
  "terminal planning excludes the compatibility alias");
assert.equal(taskKeys.filter((key) =>
  key === "checkpoint:verification_process:legacy-process-contract-conservation").length, 1,
"terminal planning conserves the legacy assertion leaf exactly once");

console.log(JSON.stringify({
  verificationRegistryPlannerModularization:{
    passed:true,
    boundaryContracts:verificationPolicyContracts.map(({ id }) => id),
    shellPolicyTasks:0,
    terminalSuccessors:verificationProcessCompatibilitySuccessors.length,
    runnablePacks:terminal.selectedPackIds.length,
  },
}));
