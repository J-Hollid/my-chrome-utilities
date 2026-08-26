import assert from "node:assert/strict";

import { bindVerificationChangeScope } from
  "../../scripts/run-focused-acceptance.mjs";

const execution = { selectedPackIds:["verification_process"], tasks:[{ key:"unit:registry" }] };
const binding = { selectedPackIds:["verification_process"], tasks:[{ key:"unit:registry" }],
  changedPaths:["scripts/verification-registry/compiler.mjs"] };
const bound = bindVerificationChangeScope(execution, binding);
assert.deepEqual(bound.changedPaths, binding.changedPaths,
  "execution checkpoints retain the exact canonical change scope");
assert.deepEqual(bound.tasks, execution.tasks,
  "binding preserves the already selected execution closure rather than inventing tasks");
