import assert from "node:assert/strict";
import { resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";
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
const evolvedDestination = {...destinations[0], requiredCapabilities:["local-loopback"]};
const evolvedDigest = verificationTaskDigest(evolvedDestination);
const evolvedGraph = structuredClone(graph);
evolvedGraph.identities[evolvedDigest] = evolvedDestination;
evolvedGraph.boundaries[evolvedDigest] = structuredClone(destinationEntries[0].boundary);
evolvedGraph.edges.push({
  id:"registry-contract-capability-v2",
  sourceRegistryCommit:"a".repeat(40),
  sourceTaskDigest:destinationEntries[0].digest,
  destinationTaskDigest:evolvedDigest,
  logicalSlice:{kind:"task"},
  conservedBoundaryDigest:destinationEntries[0].boundaryDigest,
});
const evolvedSuccession = resolveTaskSuccessionGraph({graph:evolvedGraph, sourceIdentity:source,
  currentIdentities:[evolvedDestination, destinations[1]], logicalSlice:{kind:"task"}});
assert.deepEqual(evolvedSuccession.destinationIdentities, [evolvedDestination, destinations[1]],
  "each task-set member follows ordinary exact identity succession to one current canonical identity");
assert.equal(new Set(evolvedSuccession.destinationTaskDigests).size, destinations.length,
  "task-set identity succession preserves exact cardinality and distinct destinations");
const collapsedTaskSet = structuredClone(evolvedGraph);
collapsedTaskSet.edges[0].destinationTaskDigest = destinationEntries[1].digest;
assert.throws(() => resolveTaskSuccessionGraph({graph:collapsedTaskSet, sourceIdentity:source,
  currentIdentities:[destinations[1]], logicalSlice:{kind:"task"}}),
  /incomplete conserved boundary|preserve its conserved boundary/u,
  "task-set member succession cannot collapse distinct destinations");
const ambiguousTaskSet = structuredClone(evolvedGraph);
ambiguousTaskSet.edges.push({...structuredClone(evolvedGraph.edges[0]), id:"ambiguous-capability-v2"});
assert.throws(() => resolveTaskSuccessionGraph({graph:ambiguousTaskSet, sourceIdentity:source,
  currentIdentities:[evolvedDestination, destinations[1]], logicalSlice:{kind:"task"}}),
  /Ambiguous task succession boundary/u,
  "task-set member succession rejects ambiguous ordinary edges");
