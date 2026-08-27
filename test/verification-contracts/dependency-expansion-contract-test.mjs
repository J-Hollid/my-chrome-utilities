import assert from "node:assert/strict";

import { expandVerificationDependencies } from
  "../../scripts/verification-planner/dependencies/expand.mjs";

const pack = (id, overrides = {}) => ({
  id, source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
  unit:[`test/${id}-test.mjs`], property:[], features:[], handlers:[], browserAdapters:[],
  browserAdapterModes:[], browserObservations:[], checkpointCommands:[], ...overrides,
});
const packs = [pack("base"), pack("consumer", { dependencies:["base"] })];
assert.deepEqual([...expandVerificationDependencies(packs, ["consumer"])].sort(),
  ["base", "consumer"],
"dependency closure includes every transitive predecessor");
assert.throws(() => expandVerificationDependencies(packs, ["missing"]),
  /Register every direct dependency/u, "unknown dependency identities fail closed");
