const taskIdentity = "registry-derived-verification-packs";
const cardinalityPrefix = "scripts/verification-pack-cardinality/";
const cardinalitySliceId = "verification_pack_cardinality_contract";
const cardinalityAcceptanceTaskKey = "acceptance-session:shell";
const prohibitedReliabilityHelpers = new Set([
  "scripts/verification-reliability-values.mjs",
  "scripts/verification-reliability-receipts.mjs",
]);

export const registryCardinalityEvidenceTaskKeys = Object.freeze([
  "unit:scripts/verification-pack-cardinality/acceptance.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "unit:test/settled-final-verification-workflow-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
  "unit:test/verification-process-contract-test.mjs",
]);

export function registryCardinalityFocusedTaskKeys(plan) {
  const properties = (plan?.propertyTasks ?? []).map(({ key }) => key);
  return Object.freeze([
    ...registryCardinalityEvidenceTaskKeys,
    ...properties,
    cardinalityAcceptanceTaskKey,
    "package:extension",
  ]);
}

const approvedPaths = new Set([
  "acceptance/src/acceptance/steps/modular_architecture.clj",
  "acceptance/src/acceptance/verification_support/modular_architecture_cardinality_handlers.clj",
  "acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj",
  "acceptance/src/acceptance/verification_support/modular_architecture_vtd007_handlers.clj",
  "scripts/report-verification-throughput.mjs",
  "scripts/run-focused-acceptance.mjs",
  "scripts/settled-final-verification-policy.mjs",
  "scripts/settled-final-verification-review.mjs",
  "scripts/verification-changes.mjs",
  "scripts/verification-evidence.mjs",
  "scripts/verification-ownership-intent.mjs",
  "scripts/verification-ownership-readiness-core.mjs",
  "scripts/verification-ownership-readiness-test.mjs",
  "scripts/verification-ownership-readiness.mjs",
  "scripts/verification-packs.mjs",
  "scripts/verification-reliability-closure-audit.mjs",
  "scripts/verification-reliability-closure.mjs",
  "scripts/verification-reliability-incidents.mjs",
  "scripts/verification-reliability-store.mjs",
  "scripts/verification-run-intent.mjs",
  "scripts/verification-slice-quarantine.mjs",
  "scripts/verification-task-succession.mjs",
  "scripts/verification-task-succession-test.mjs",
  "test/settled-final-verification-workflow-test.mjs",
  "test/verification-evidence-production-path-test.mjs",
  "test/verification-pack-cardinality-contract-test.mjs",
  "test/verification-process-contract-test.mjs",
  "verification/packs.json",
]);

export function registryCardinalityFocusedPlanMode({ task, mode } = {}) {
  return task === taskIdentity && mode === "focused-task";
}

function approvedPath(path) {
  return path.startsWith("scripts/verification-pack-cardinality/") || approvedPaths.has(path);
}

function pathsOverlap(left, right) {
  return left === right || left.startsWith(right) || right.startsWith(left);
}

function assertCandidateRegistryOwnership(candidateRegistry) {
  if (!Array.isArray(candidateRegistry) || !candidateRegistry.length) {
    throw new Error("Registry cardinality focused evidence requires the exact candidate registry");
  }
  const sliceDeclarations = [];
  const globalDeclarations = [];
  const sharedDeclarations = [];
  const propagatingDeclarations = [];
  for (const pack of candidateRegistry) {
    for (const slice of pack?.verificationSlices ?? []) {
      for (const prefix of slice?.sourcePrefixes ?? []) {
        if (pathsOverlap(prefix, cardinalityPrefix)) {
          sliceDeclarations.push({ pack, slice, kind:"prefix", path:prefix });
        }
      }
      for (const sourcePath of slice?.sourcePaths ?? []) {
        if (pathsOverlap(sourcePath, cardinalityPrefix)) {
          sliceDeclarations.push({ pack, slice, kind:"path", path:sourcePath });
        }
      }
    }
    for (const prefix of pack?.globalImpact ?? []) {
      if (pathsOverlap(prefix, cardinalityPrefix)) globalDeclarations.push({ pack, prefix });
    }
    for (const boundary of pack?.sharedBoundaries ?? []) {
      for (const prefix of boundary?.prefixes ?? []) {
        if (pathsOverlap(prefix, cardinalityPrefix)) {
          sharedDeclarations.push({ pack, boundary, prefix });
        }
      }
    }
    for (const boundary of pack?.impactBoundaries ?? []) {
      if (boundary?.propagateDependants !== true) continue;
      for (const prefix of boundary?.prefixes ?? []) {
        if (pathsOverlap(prefix, cardinalityPrefix)) {
          propagatingDeclarations.push({ pack, boundary, prefix });
        }
      }
    }
  }
  const [declaration] = sliceDeclarations;
  if (sliceDeclarations.length !== 1 || declaration.pack?.id !== "shell" ||
      declaration.slice?.id !== cardinalitySliceId || declaration.kind !== "prefix" ||
      declaration.path !== cardinalityPrefix) {
    throw new Error("Registry cardinality prefix must be declared exactly once by the Shell cardinality slice");
  }
  const expectedConsumers = [{ packId:"verification_process", sliceId:"task_batching" }];
  if (JSON.stringify(declaration.slice.consumers) !== JSON.stringify(expectedConsumers)) {
    throw new Error("Registry cardinality slice requires the exact verification_process task-batching consumer");
  }
  if (globalDeclarations.length) {
    throw new Error("Registry cardinality prefix cannot also be globally impactful");
  }
  if (sharedDeclarations.length) {
    throw new Error("Registry cardinality prefix cannot also use shared-boundary ownership");
  }
  if (propagatingDeclarations.length) {
    throw new Error("Registry cardinality prefix cannot also use propagating impact ownership");
  }
  return Object.freeze({
    packId:"shell",
    sliceId:cardinalitySliceId,
    sourcePrefix:cardinalityPrefix,
    consumers:Object.freeze([]),
  });
}

function assertCandidateOwnershipProof(proof) {
  if (!proof || Array.isArray(proof) ||
      Object.keys(proof).sort().join(",") !== "consumers,packId,sliceId,sourcePrefix" ||
      proof.packId !== "shell" || proof.sliceId !== cardinalitySliceId ||
      proof.sourcePrefix !== cardinalityPrefix || !Array.isArray(proof.consumers) ||
      proof.consumers.length) {
    throw new Error("Registry cardinality focused evidence requires exact slice ownership proof");
  }
  return Object.freeze({
    packId:"shell",
    sliceId:cardinalitySliceId,
    sourcePrefix:cardinalityPrefix,
    consumers:Object.freeze([]),
  });
}

export function validateRegistryCardinalityFocusedEvidence({
  task,
  candidateRegistry,
  candidateOwnership,
  changedPaths,
  taskKeys,
  syntheticProofs,
  includeProperties,
  includePackage,
  terminalFull,
} = {}) {
  if (task !== taskIdentity) {
    throw new Error("Registry cardinality focused evidence requires the exact task identity");
  }
  const ownership = candidateRegistry
    ? assertCandidateRegistryOwnership(candidateRegistry)
    : assertCandidateOwnershipProof(candidateOwnership);
  if (!Array.isArray(changedPaths) || !changedPaths.length ||
      new Set(changedPaths).size !== changedPaths.length) {
    throw new Error("Registry cardinality focused evidence requires one exact changed-path set");
  }
  const prohibited = changedPaths.filter((path) => prohibitedReliabilityHelpers.has(path));
  if (prohibited.length) {
    throw new Error(`Registry cardinality focused evidence rejects prohibited reliability helpers: ${prohibited.join(", ")}`);
  }
  const unapproved = changedPaths.filter((path) => !approvedPath(path));
  if (unapproved.length) {
    throw new Error(`Registry cardinality focused evidence is outside the approved path set: ${unapproved.join(", ")}`);
  }
  const keys = new Set(taskKeys ?? []);
  if (registryCardinalityEvidenceTaskKeys.some((key) => !keys.has(key))) {
    throw new Error("Registry cardinality focused evidence requires all named evidence tasks");
  }
  if (!keys.has(cardinalityAcceptanceTaskKey)) {
    throw new Error("Registry cardinality focused evidence requires the Shell acceptance session");
  }
  if (!includeProperties || ![...keys].some((key) => key.startsWith("property:"))) {
    throw new Error("Registry cardinality focused evidence requires property proof");
  }
  if (!includePackage || !keys.has("package:extension")) {
    throw new Error("Registry cardinality focused evidence requires package proof");
  }
  if (terminalFull) {
    throw new Error("Registry cardinality focused evidence cannot claim terminal verification");
  }
  if (!["current", "addedRunnable", "emptyCompatibility"].every(
    (key) => syntheticProofs?.[key] === true)) {
    throw new Error("Registry cardinality focused evidence requires all synthetic execution proofs");
  }
  return Object.freeze({
    mode:"registry-cardinality-focused",
    task,
    changedPaths:Object.freeze([...changedPaths].sort()),
    taskKeys:Object.freeze([...keys].sort()),
    ownership,
    syntheticProofs:Object.freeze({
      current:true,
      addedRunnable:true,
      emptyCompatibility:true,
    }),
  });
}
