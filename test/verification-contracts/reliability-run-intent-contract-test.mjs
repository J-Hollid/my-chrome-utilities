import assert from "node:assert/strict";

import { registryPlannerPreparationTaskKeys, requireVerificationRunIntent,
  verificationRunIntent, verificationRunIntents } from
  "../../scripts/verification-policy/reliability/run-intent.mjs";
import { verificationPolicyContracts } from "../../scripts/verification-policy/contracts.mjs";
import { resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, verificationTaskDigest } from
  "../../scripts/verification-policy/reliability/task-succession.mjs";

assert.equal(verificationRunIntent({ prepareEvidence:"policy-cutover" }),
  verificationRunIntents.review,
  "an evidence task receives immutable review-evidence intent");
assert.equal(requireVerificationRunIntent({ runIntent:verificationRunIntents.review },
  verificationRunIntents.review), verificationRunIntents.review,
  "matching run intent is admitted");
assert.throws(() => requireVerificationRunIntent({}, verificationRunIntents.review),
  /missing a valid immutable run intent/u, "missing intent blocks before execution");
assert.deepEqual(registryPlannerPreparationTaskKeys, [
  "unit:test/modular-utility-architecture-test.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  ...verificationPolicyContracts.map(({ testPath }) => `unit:${testPath}`),
], "preparation evidence expands the retired process alias to every modular contract");

const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
const destinations = [identity("unit:test/verification-contracts/registry-inventory-contract-test.mjs"),
  identity("unit:test/verification-contracts/ownership-impact-contract-test.mjs")];
const destinationEntries = destinations.map((current) => {
  const digest = verificationTaskDigest(current);
  const boundary = { kind:"task", taskKey:current.key, executionArgs:current.args,
    logicalTargetIds:[] };
  return { digest, boundary, boundaryDigest:taskSuccessionBoundaryDigest(boundary) };
});
const sourceDigest = verificationTaskDigest(source);
const graph = { version:1,
  identities:Object.fromEntries([[sourceDigest, source],
    ...destinations.map((current) => [verificationTaskDigest(current), current])]),
  boundaries:Object.fromEntries([[sourceDigest, { kind:"task-set", taskKey:source.key,
    successorBoundaryDigests:destinationEntries.map(({ boundaryDigest }) => boundaryDigest).sort() }],
  ...destinationEntries.map(({ digest, boundary }) => [digest, boundary])]),
  taskSetSuccessions:[{ id:"split-process-contract", sourceTaskDigest:sourceDigest,
    destinationTaskDigests:destinationEntries.map(({ digest }) => digest),
    logicalSlice:{ kind:"task" } }], edges:[] };
const succession = resolveTaskSuccessionGraph({ graph, sourceIdentity:source,
  currentIdentities:destinations, logicalSlice:{ kind:"task" } });
assert.deepEqual(succession.destinationIdentities, destinations,
  "one former task succeeds only through its complete ordered successor set");
assert.throws(() => resolveTaskSuccessionGraph({ graph, sourceIdentity:source,
  currentIdentities:destinations.slice(0, 1), logicalSlice:{ kind:"task" } }),
  /incomplete conserved boundary/u, "a missing successor blocks before execution");
