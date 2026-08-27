import assert from "node:assert/strict";

import { bindVerificationChangeScope } from "../../scripts/verification-execution/runner.mjs";

const execution = { selectedPackIds:["shell"], tasks:[{ key:"unit:registry" }] };
const binding = { selectedPackIds:["shell"], tasks:[{ key:"unit:registry" }],
  changedPaths:["scripts/verification-registry/candidate-inventory.mjs"] };
const bound = bindVerificationChangeScope(execution, binding);
assert.deepEqual(bound.changedPaths, binding.changedPaths,
  "execution checkpoints retain the exact canonical change scope");
assert.deepEqual(bound.tasks, execution.tasks,
  "binding preserves the already selected execution closure rather than inventing tasks");
