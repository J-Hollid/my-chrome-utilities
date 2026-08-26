import assert from "node:assert/strict";

import {
  expandVerificationDependencies,
  expandVerificationDependants,
  expandVerificationDependantsAcross,
} from "../../scripts/verification-planner/dependencies/expand.mjs";

const current = [
  { id:"base", dependencies:[], sharedComponents:[] },
  { id:"consumer", dependencies:["base"], sharedComponents:[] },
  { id:"shared-consumer", dependencies:[], sharedComponents:["base"] },
];

assert.deepEqual([...expandVerificationDependencies(current, ["consumer"])].sort(),
  ["base", "consumer"], "dependency closure includes every transitive predecessor");
assert.deepEqual([...expandVerificationDependants(current, ["base"])].sort(),
  ["base", "consumer", "shared-consumer"],
  "dependant closure includes dependency and shared-component consumers");
assert.deepEqual([...expandVerificationDependantsAcross([
  current,
  [...current, { id:"historical-consumer", dependencies:["consumer"], sharedComponents:[] }],
], ["base"])].sort(), ["base", "consumer", "historical-consumer", "shared-consumer"],
"current and historical registries contribute one conservative dependant union");
assert.throws(() => expandVerificationDependencies(current, ["missing"]),
  /Register every direct dependency/u, "unknown dependency identities fail closed");
