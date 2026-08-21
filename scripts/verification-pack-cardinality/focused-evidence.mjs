const taskIdentity = "registry-derived-verification-packs";
const prohibitedReliabilityHelpers = new Set([
  "scripts/verification-reliability-values.mjs",
  "scripts/verification-reliability-receipts.mjs",
]);

export const registryCardinalityEvidenceTaskKeys = Object.freeze([
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
    "package:extension",
  ]);
}

const approvedPaths = new Set([
  "acceptance/src/acceptance/steps/modular_architecture.clj",
  "acceptance/src/acceptance/verification_support/modular_architecture_cardinality_handlers.clj",
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

export function validateRegistryCardinalityFocusedEvidence({
  task,
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
    syntheticProofs:Object.freeze({
      current:true,
      addedRunnable:true,
      emptyCompatibility:true,
    }),
  });
}
