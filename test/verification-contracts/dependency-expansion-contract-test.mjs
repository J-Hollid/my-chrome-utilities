import assert from "node:assert/strict";
import path from "node:path";
import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";

function pack(id, overrides = {}) {
  return {
    id,
    source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
    verificationInputs:[], runtimeInputs:[],
    unit:[`test/${id}-one-test.mjs`, `test/${id}-two-test.mjs`], property:[],
    features:[`features/${id}-one.feature`, `features/${id}-two.feature`],
    handlers:[`acceptance/src/acceptance/steps/${id}.clj`], browserAdapters:[],
    browserAdapterModes:[], browserObservations:[], checkpointCommands:[],
    ...overrides,
  };
}

const synthetic = [
  pack("alpha", {
    browserObservations:[{
      id:"ALPHA_BROWSER_ADAPTER", path:"test/alpha-browser-test.mjs",
      environment:{ ALPHA_BROWSER_ADAPTER:"1" }, observationKeys:["alpha"],
      features:["features/alpha-one.feature"],
    }],
    checkpointCommands:[{
      id:"alpha-check", executable:"node", args:["acceptance/runtime/alpha.mjs"],
      features:["features/alpha-one.feature"],
    }],
  }),
  pack("beta", { dependencies:["alpha"] }),
  pack("process", {
    source:[], process:["scripts/", "acceptance/src/acceptance/"],
    globalImpact:["acceptance/src/acceptance/pack_session.clj"],
    features:[], handlers:[], unit:["test/process-test.mjs"],
    verificationOnly:{productionOwner:"alpha"},
  }),
  pack("empty", {
    source:[], unit:[], features:[], handlers:[], dependencies:["alpha"],
  }),
];

assert.throws(() => planVerification(synthetic, {
  packIds:["alpha"], changedPaths:["src/beta/change.ts"],
}), /outside the explicit pack set/u);

assert.deepEqual(planVerification(synthetic, { packIds:["alpha"] }).packIds, ["alpha"],
  "an ordinary exact pack remains exact when no changed-path boundary is requested");

for (const verificationPath of [
  "test/alpha-one-test.mjs",
]) {
  assert.deepEqual(planVerification(synthetic, {
    packIds:["alpha"], changedPaths:[verificationPath],
  }).packIds, ["alpha"],
  `verification-only change remains exact to its owning pack: ${verificationPath}`);
}

for (const focusedPolicyPath of [
  "scripts/settled-final-verification-policy.mjs",
  "scripts/verification-packs.mjs",
  "scripts/verification-reliability-runtime.mjs",
  "scripts/verification-reliability-store.mjs",
]) {
  assert.deepEqual(planVerification(synthetic, {
    changedPaths:[focusedPolicyPath],
  }).packIds, ["process"],
  "the policy path keeps ordinary process ownership without an explicit focused pack");
  const focusedPolicyPlan = planVerification(synthetic, {
    packIds:["alpha", "beta"],
    changedPaths:["src/alpha/change.ts", focusedPolicyPath],
  });
  assert.deepEqual(focusedPolicyPlan.packIds, ["alpha", "beta"],
    "the closed focused-policy set does not expand an authorized feature checkpoint");
  assert.deepEqual(focusedPolicyPlan.changedOwners[focusedPolicyPath], [],
    "the closed focused-policy path stays visible without a product-pack owner");
  const canonicalPolicyPlan = planVerification(synthetic, {
    packIds:["alpha", "beta", "process"], changedPaths:[focusedPolicyPath],
  });
  assert.deepEqual(canonicalPolicyPlan.changedOwners[focusedPolicyPath],
    ["process"],
  "canonical runnable-pack planning retains the policy path's ordinary ownership");
}

assert.deepEqual(planVerification(synthetic, {
  packIds:["alpha", "beta", "process"],
  changedPaths:["src/alpha/change.ts", "scripts/run-focused-acceptance.mjs"],
}).packIds, ["alpha", "beta", "process"],
"the central runner remains outside the closed focused-policy exception");

assert.throws(() => planVerification(synthetic, {
  packIds:["alpha"], changedPaths:["src/alpha/change.ts"],
}), /outside the explicit pack set: beta/u,
  "an explicit changed-path boundary cannot omit a transitive consumer");

const exactImpact = planVerification(synthetic, {
  packIds:["alpha", "beta"], changedPaths:["src/alpha/change.ts"],
});

assert.deepEqual(exactImpact.packIds, ["alpha", "beta"]);

assert.deepEqual(exactImpact.changedOwners["src/alpha/change.ts"], ["alpha", "beta"],
  "the accepted exact boundary records the complete owner-and-consumer closure");

assert.deepEqual(planVerification(synthetic, { packIds:["beta"] }).packIds, ["beta"]);

assert.deepEqual(planVerification(synthetic, {
  packIds:["beta"], withDependencies:true,
}).packIds, ["alpha", "beta"],
  "--with-dependencies remains an explicit upstream expansion distinct from changed-path consumers");

const impact = planVerification(synthetic, { changedPaths:["src/alpha/change.ts"] });
import { expandVerificationDependencies } from "../../scripts/verification-planner/dependencies/expand.mjs";

const dependencyFixturePack = (id, overrides = {}) => ({
  id, source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
  unit:[`test/${id}-test.mjs`], property:[], features:[], handlers:[], browserAdapters:[],
  browserAdapterModes:[], browserObservations:[], checkpointCommands:[], ...overrides,
});

const dependencyFixturePacks = [dependencyFixturePack("base"),
  dependencyFixturePack("consumer", { dependencies:["base"] })];

assert.deepEqual([...expandVerificationDependencies(dependencyFixturePacks, ["consumer"])].sort(),
  ["base", "consumer"],
"dependency closure includes every transitive predecessor");

assert.throws(() => expandVerificationDependencies(dependencyFixturePacks, ["missing"]),
  /Register every direct dependency/u, "unknown dependency identities fail closed");
