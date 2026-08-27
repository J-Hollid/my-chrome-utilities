import assert from "node:assert/strict";

import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";

const pack = { id:"boundary", source:["src/boundary/"], process:[], globalImpact:[],
  dependencies:[], sharedComponents:[], unit:["test/one.mjs", "test/two.mjs"], property:[],
  features:[], handlers:[], browserAdapters:[], browserAdapterModes:[], browserObservations:[],
  checkpointCommands:[] };
const plan = planVerification([pack], { changedPaths:["src/boundary/value.ts"] });
assert.deepEqual(plan.tasks.map(({ key }) => key),
  ["build:dist", "unit:test/one.mjs", "unit:test/two.mjs"],
  "task planning preserves deterministic stage and manifest order");
assert.equal(new Set(plan.tasks.map(({ key }) => key)).size, plan.tasks.length,
  "task planning emits every execution identity once");
