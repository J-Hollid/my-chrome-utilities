import assert from "node:assert/strict";

import { planVerification } from "../../scripts/verification-packs.mjs";

const packs = [{
  id:"verification_process",
  verificationOnly:{ productionOwner:"shell" },
  unit:["test/registry.mjs", "test/ownership.mjs"],
  verificationSlices:[
    { id:"registry", sourcePaths:[], sourcePrefixes:["scripts/verification-registry/"],
      tasks:["unit:test/registry.mjs"], prerequisites:[], consumers:[],
      observableBoundary:"registry" },
    { id:"ownership", sourcePaths:[], sourcePrefixes:["scripts/verification-planner/ownership/"],
      tasks:["unit:test/ownership.mjs"], prerequisites:[], consumers:[],
      observableBoundary:"ownership" },
  ],
}, { id:"shell", source:["src/workspace-tabs"], unit:["test/shell.mjs"] }];

const plan = planVerification(packs, {
  changedPaths:["scripts/verification-registry/compiler.mjs"],
});
assert.deepEqual(plan.tasks.map(({ key }) => key), ["build:dist", "unit:test/registry.mjs"],
  "changed policy paths construct only the matching slice task closure");
assert.deepEqual(plan.selectedPackIds, ["verification_process"],
  "task construction does not pull unrelated product packs into policy work");

const shellPlan = planVerification(packs, { changedPaths:["src/workspace-tabs-ui.ts"] });
assert.deepEqual(shellPlan.tasks.map(({ key }) => key), ["build:dist", "unit:test/shell.mjs"],
  "product-only Shell work retains product evidence without policy contracts");
