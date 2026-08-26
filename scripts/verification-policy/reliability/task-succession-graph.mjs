import {
  sameSuccessionValue as same,
  successionDigest as digest,
  taskSuccessionBoundaryDigest,
  verificationTaskDigest,
} from "./task-succession-values.mjs";

export function declaredBoundaryDigest(boundary) {
  return typeof boundary === "string" && /^[a-f0-9]{64}$/u.test(boundary)
    ? boundary : taskSuccessionBoundaryDigest(boundary);
}

export function declaredTaskBoundary(graph, taskDigest, logicalSlice) {
  if (logicalSlice.kind === "browser-target" && logicalSlice.logicalTargetIds.length === 1) {
    const target = logicalSlice.logicalTargetIds[0];
    return graph.targetBoundaries?.[taskDigest]?.[target] ?? graph.boundaries[taskDigest];
  }
  return graph.boundaries[taskDigest];
}

export function completeTaskBoundary(boundary, identity) {
  return Boolean(identity) && boundary?.kind === "task" &&
    boundary.taskKey === identity.key && same(boundary.executionArgs, identity.args) &&
    (!Array.isArray(boundary.logicalTargetIds) || boundary.logicalTargetIds.length === 0);
}

function validLogicalSlice(slice) {
  return slice?.kind === "task" ||
    (slice?.kind === "browser-target" && Array.isArray(slice.logicalTargetIds) &&
      slice.logicalTargetIds.length > 0 &&
      slice.logicalTargetIds.every((id) => typeof id === "string" && id));
}

export function executionFor(identity, logicalSlice) {
  if (logicalSlice.kind !== "browser-target") {
    return { identity:structuredClone(identity), args:[...identity.args], logicalTargetIds:[] };
  }
  return { identity:structuredClone(identity),
    args:["scripts/run-browser-observation.mjs", ...logicalSlice.logicalTargetIds],
    logicalTargetIds:[...logicalSlice.logicalTargetIds] };
}

function resolveTaskSetSuccession({ graph, sourceTaskDigest, currentByDigest, logicalSlice }) {
  const candidates = [...graph.edges.filter((edge) =>
    edge.sourceTaskDigest === sourceTaskDigest && Array.isArray(edge.destinationTaskDigests) &&
    same(edge.logicalSlice, logicalSlice)),
  ...(graph.taskSetSuccessions ?? []).filter((edge) =>
    edge.sourceTaskDigest === sourceTaskDigest && same(edge.logicalSlice, logicalSlice))];
  if (candidates.length === 0) return null;
  if (candidates.length !== 1) throw new Error("Ambiguous task succession boundary");
  const edge = candidates[0];
  const sourceBoundary = declaredTaskBoundary(graph, sourceTaskDigest, logicalSlice) ??
    (Array.isArray(edge.destinationBoundaryDigests) ? { kind:"task-set",
      taskKey:edge.sourceIdentity?.key,
      successorBoundaryDigests:edge.destinationBoundaryDigests } : undefined);
  const destinationDigests = edge.destinationTaskDigests;
  if (typeof edge.id !== "string" || !edge.id || sourceBoundary?.kind !== "task-set" ||
      !Array.isArray(sourceBoundary.successorBoundaryDigests) || !destinationDigests.length ||
      new Set(destinationDigests).size !== destinationDigests.length ||
      destinationDigests.includes(sourceTaskDigest)) {
    throw new Error("Undeclared task succession or incomplete conserved boundary");
  }
  const destinationEntries = destinationDigests.map((destinationTaskDigest) => {
    const identity = graph.identities[destinationTaskDigest] ?? currentByDigest.get(destinationTaskDigest);
    const boundary = declaredTaskBoundary(graph, destinationTaskDigest, logicalSlice) ??
      (identity ? { kind:"task", taskKey:identity.key, executionArgs:identity.args,
        logicalTargetIds:[] } : undefined);
    if (!identity || verificationTaskDigest(identity) !== destinationTaskDigest ||
        !completeTaskBoundary(boundary, identity) || !currentByDigest.has(destinationTaskDigest) ||
        !same(currentByDigest.get(destinationTaskDigest), identity)) {
      throw new Error("Undeclared task succession or incomplete conserved boundary");
    }
    return { destinationTaskDigest, identity, boundaryDigest:declaredBoundaryDigest(boundary) };
  });
  const expected = [...sourceBoundary.successorBoundaryDigests].sort();
  const actual = destinationEntries.map(({ boundaryDigest }) => boundaryDigest).sort();
  if (!same(expected, actual)) {
    throw new Error("Task succession edge does not preserve its conserved boundary");
  }
  const destinationIdentities = destinationEntries.map(({ identity }) => structuredClone(identity));
  const executions = destinationEntries.map(({ identity }) => executionFor(identity, logicalSlice));
  const chain = [{ id:edge.id, sourceTaskDigest, destinationTaskDigests:[...destinationDigests],
    logicalSlice:structuredClone(logicalSlice), conservedBoundaryDigests:actual }];
  return { version:graph.version, sourceTaskDigest,
    destinationTaskDigests:[...destinationDigests], chain,
    logicalSlice:structuredClone(logicalSlice), destinationIdentities, executions,
    conservationDigest:digest({ version:graph.version, sourceTaskDigest,
      destinationTaskDigests:destinationDigests, chain, logicalSlice }) };
}

export function resolveTaskSuccessionGraph({ graph, sourceIdentity, currentIdentities, logicalSlice }) {
  if (graph?.version !== 1 || !graph.identities || !graph.boundaries || !Array.isArray(graph.edges)) {
    throw new Error("Task succession graph version or shape is invalid");
  }
  if (!validLogicalSlice(logicalSlice)) {
    throw new Error("Task succession requires an exact logical slice");
  }
  const sourceTaskDigest = verificationTaskDigest(sourceIdentity);
  const taskSetSource = (graph.taskSetSuccessions ?? [])
    .find(({ sourceTaskDigest:digestValue }) => digestValue === sourceTaskDigest)?.sourceIdentity;
  if (!same(graph.identities[sourceTaskDigest] ?? taskSetSource, sourceIdentity)) {
    throw new Error("Task succession graph does not bind the exact immutable source identity");
  }
  const currentByDigest = new Map(currentIdentities.map((identity) =>
    [verificationTaskDigest(identity), identity]));
  const taskSetResolution = resolveTaskSetSuccession({ graph, sourceTaskDigest,
    currentByDigest, logicalSlice });
  if (taskSetResolution) return taskSetResolution;
  const visited = new Set();
  const chain = [];
  let cursor = sourceTaskDigest;
  while (!currentByDigest.has(cursor)) {
    if (visited.has(cursor)) throw new Error("Task succession graph contains a cycle");
    visited.add(cursor);
    const sourceBoundary = declaredTaskBoundary(graph, cursor, logicalSlice);
    if (!sourceBoundary) throw new Error("Task succession registry history is unavailable");
    const conservedBoundaryDigest = declaredBoundaryDigest(sourceBoundary);
    const candidates = graph.edges.filter((edge) => edge.sourceTaskDigest === cursor &&
      same(edge.logicalSlice, logicalSlice) &&
      edge.conservedBoundaryDigest === conservedBoundaryDigest);
    if (candidates.length === 0) {
      throw new Error("Undeclared task succession or incomplete conserved boundary");
    }
    if (candidates.length !== 1) throw new Error("Ambiguous task succession boundary");
    const edge = candidates[0];
    const destinationIdentity = graph.identities[edge.destinationTaskDigest];
    const destinationBoundary = declaredTaskBoundary(graph, edge.destinationTaskDigest, logicalSlice);
    if (typeof edge.id !== "string" || !edge.id || !destinationIdentity || !destinationBoundary ||
        verificationTaskDigest(destinationIdentity) !== edge.destinationTaskDigest ||
        declaredBoundaryDigest(destinationBoundary) !== edge.conservedBoundaryDigest) {
      throw new Error("Task succession edge does not preserve its conserved boundary");
    }
    chain.push({ id:edge.id, sourceTaskDigest:cursor,
      destinationTaskDigest:edge.destinationTaskDigest, conservedBoundaryDigest,
      logicalSlice:structuredClone(logicalSlice) });
    cursor = edge.destinationTaskDigest;
  }
  const destinationIdentity = currentByDigest.get(cursor);
  if (!same(graph.identities[cursor], destinationIdentity)) {
    throw new Error("Task succession destination is not the exact current canonical identity");
  }
  const destinationTaskDigest = verificationTaskDigest(destinationIdentity);
  const conservationDigest = digest({ version:graph.version, sourceTaskDigest,
    destinationTaskDigest, chain, logicalSlice,
    boundaryDigest:declaredBoundaryDigest(graph.boundaries[cursor]) });
  return { version:graph.version, sourceTaskDigest, destinationTaskDigest, chain,
    logicalSlice:structuredClone(logicalSlice), conservationDigest,
    destinationIdentity:structuredClone(destinationIdentity),
    execution:executionFor(destinationIdentity, logicalSlice) };
}
