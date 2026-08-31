import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { expandVerificationDependencies } from
  "../scripts/verification-planner/dependencies/expand.mjs";
import { resolveTaskSuccessionGraph } from
  "../scripts/verification-policy/reliability/task-succession.mjs";
import { candidateRepositoryPaths } from
  "../scripts/verification-registry/candidate-inventory.mjs";
import { compileVerificationRegistry, serializeVerificationRegistry } from
  "../scripts/verification-registry/compiler.mjs";
import { loadVerificationPacks, planVerification, verificationTaskIdentity } from
  "../scripts/verification-packs.mjs";
import { verificationTaskDigest } from
  "../scripts/verification-policy/reliability/task-succession.mjs";
import { plannedTemporaryRequirement } from
  "../scripts/verification-execution/temporary-storage-lifecycle.mjs";
import successionGraph from "../verification/task-succession.json" with { type:"json" };

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const leaf = "test/verification-process-property-test.mjs";

let state = 0x51ce_b00c;
const random = () => {
  state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
  return state / 0x1_0000_0000;
};
const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
};

for (let sample = 0; sample < 100; sample += 1) {
  const concurrency = 1 + Math.floor(random() * 8);
  const observationConcurrency = 1 + Math.floor(random() * 4);
  const workspaceRequirements = Array.from({ length:1 + Math.floor(random() * 16) },
    () => 1 + Math.floor(random() * 1_000_000));
  const observationRequirements = Array.from({ length:1 + Math.floor(random() * 8) },
    () => 1 + Math.floor(random() * 1_000_000));
  const tasks = [
    ...workspaceRequirements.map((temporaryRequirementBytes, index) => ({
      key:`unit:${index}`, stage:"unit", temporaryPathClass:"workspace",
      temporaryRequirementBytes,
    })),
    ...observationRequirements.map((temporaryRequirementBytes, index) => ({
      key:`browser-observation:${index}`, stage:"browser-observation",
      temporaryPathClass:"chrome-short", temporaryRequirementBytes,
    })),
  ];
  const requirement = plannedTemporaryRequirement({ tasks, concurrency,
    observationConcurrency, receiptOutputLimitBytes:0 });
  const largest = (values, limit) => [...values].sort((left, right) => right - left)
    .slice(0, limit).reduce((total, value) => total + value, 0);
  assert.ok(requirement.workspaceBytes >= largest(workspaceRequirements, concurrency),
    "workspace capacity never underestimates the bounded execution pool");
  assert.ok(requirement.chromeBytes >= largest(observationRequirements, observationConcurrency),
    "Chrome capacity never underestimates the bounded observation pool");
}

for (let sample = 0; sample < 100; sample += 1) {
  const orders = shuffle([10, 20, 30, 40]);
  const fragments = orders.map((order, index) => ({
    version:1,
    order,
    pack:{ id:`fragment_${index}`, unit:[leaf] },
  }));
  const compiled = compileVerificationRegistry({ base:[], fragments, repositoryRoot });
  const expected = [...fragments].sort((left, right) => left.order - right.order)
    .map(({ pack }) => pack.id);
  assert.deepEqual(compiled.map(({ id }) => id), expected,
    "fragment assembly is declaration-ordered for arbitrary input permutations");
  assert.equal(serializeVerificationRegistry(compiled), serializeVerificationRegistry(
    compileVerificationRegistry({ base:[], fragments:shuffle(fragments), repositoryRoot })),
  "fragment serialization is deterministic for arbitrary input permutations");
}

for (let sample = 0; sample < 100; sample += 1) {
  const count = 2 + Math.floor(random() * 18);
  const packs = Array.from({ length:count }, (_unused, index) => ({
    id:`pack_${index}`,
    dependencies:Array.from({ length:index }, (_entry, dependency) => dependency)
      .filter(() => random() < 0.25).map((dependency) => `pack_${dependency}`),
  }));
  const selectedIndex = Math.floor(random() * count);
  const closure = expandVerificationDependencies(packs, [`pack_${selectedIndex}`]);
  const visit = (index) => {
    assert.ok(closure.has(`pack_${index}`), "dependency closure includes every reachable pack");
    for (const dependency of packs[index].dependencies) visit(Number(dependency.slice(5)));
  };
  visit(selectedIndex);
}

const [taskSet] = successionGraph.taskSetSuccessions;
const currentPacks = await loadVerificationPacks();
const currentIdentities = planVerification(currentPacks, { packIds:["verification_process"] })
  .tasks.map(verificationTaskIdentity);
const identitiesByDigest = new Map(currentIdentities.map((identity) =>
  [verificationTaskDigest(identity), identity]));
const destinations = taskSet.destinationTaskDigests.map((digest) => identitiesByDigest.get(digest));
assert.ok(destinations.every(Boolean), "the current registry exposes every declared successor identity");
for (let sample = 0; sample < 50; sample += 1) {
  const resolution = resolveTaskSuccessionGraph({
    graph:successionGraph,
    sourceIdentity:taskSet.sourceIdentity,
    currentIdentities:shuffle(destinations),
    logicalSlice:{ kind:"task" },
  });
  assert.deepEqual(new Set(resolution.destinationTaskDigests),
    new Set(taskSet.destinationTaskDigests),
    "one-to-many succession is complete regardless of current identity ordering");
}
for (const missing of destinations) {
  assert.throws(() => resolveTaskSuccessionGraph({
    graph:successionGraph,
    sourceIdentity:taskSet.sourceIdentity,
    currentIdentities:destinations.filter((identity) => identity !== missing),
    logicalSlice:{ kind:"task" },
  }), /incomplete conserved boundary|Undeclared task succession/u,
  "one-to-many succession rejects every missing destination");
}

const checkpointOldDigest = "d30b6cd60ce21bcb28bcead4a83ed6e352ce5183c6f9e32b8b5a107246b28d7a";
const checkpointNewDigest = "4bf79396bc820ab6424ed35104dc02cf2a6d5b7c32e8ea8cdde9eaabc4d73978";
const checkpointOldIdentity = destinations[taskSet.destinationTaskDigests.indexOf(checkpointOldDigest)];
const checkpointNewIdentity = {...checkpointOldIdentity, requiredCapabilities:["local-loopback"]};
assert.equal(verificationTaskDigest(checkpointNewIdentity), checkpointNewDigest,
  "the projected capability-only checkpoint identity is exact");
const projectedDestinations = destinations.map((identity) =>
  identity === checkpointOldIdentity ? checkpointNewIdentity : identity);
const projectedResolution = resolveTaskSuccessionGraph({
  graph:successionGraph,
  sourceIdentity:taskSet.sourceIdentity,
  currentIdentities:projectedDestinations,
  logicalSlice:{kind:"task"},
});
assert.ok(projectedResolution.destinationTaskDigests.includes(checkpointNewDigest),
  "the historical task set reaches the projected current checkpoint identity through ordinary succession");
assert.equal(projectedResolution.destinationTaskDigests.length, taskSet.destinationTaskDigests.length,
  "projecting one task-set member preserves exact task-set cardinality");

const firstInventory = await candidateRepositoryPaths({ repositoryRoot });
for (let sample = 0; sample < 20; sample += 1) {
  assert.deepEqual(await candidateRepositoryPaths({ repositoryRoot }), firstInventory,
    "candidate inventory is stable across repeated observations of one Git index");
}
