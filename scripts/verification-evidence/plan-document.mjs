import {verificationTaskIdentity} from "../verification-packs.mjs";
import {validateExactSliceSuccessor} from
  "../verification-execution/exact-slice-successor.mjs";
import {validateRegistryCardinalityFocusedEvidence} from
  "../verification-pack-cardinality/focused-evidence.mjs";
import {
  isLiveTargetPermissionRecoveryEvidenceTask,
  validateLiveTargetPermissionRecoveryFocusedPlan,
} from "../live-target-permission-recovery-focused-evidence.mjs";
import {
  isSidePanelSingleCutoverEvidenceTask,
  validateSidePanelSingleCutoverFocusedPlan,
} from "../side-panel-single-cutover-focused-evidence.mjs";
import {registryPlannerPreparationFocusedPlan} from
  "../verification-run-intent.mjs";

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)]));
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

export function canonicalEvidencePlanDocument(plan, { evidenceTask, candidateRegistry } = {}) {
  if (plan?.version !== 2 || !Array.isArray(plan.tasks)) {
    throw new Error("Verification evidence requires a version 2 structured plan");
  }
  const packIds = sortedUnique(plan.claimPackIds ?? plan.packIds ?? []);
  const cardinalityFocused = evidenceTask === "registry-derived-verification-packs" &&
    plan.mode === "focused-task";
  const permissionRecoveryFocused =
    isLiveTargetPermissionRecoveryEvidenceTask(evidenceTask) &&
    validateLiveTargetPermissionRecoveryFocusedPlan(plan, evidenceTask);
  const sidePanelSingleCutoverFocused =
    isSidePanelSingleCutoverEvidenceTask(evidenceTask) &&
    validateSidePanelSingleCutoverFocusedPlan(plan, evidenceTask);
  const registryPlannerPreparationFocused =
    registryPlannerPreparationFocusedPlan(plan, evidenceTask);
  const exactSliceSuccessorFocused=validateExactSliceSuccessor({task:evidenceTask,
    baseCommit:plan.baseCommit,plan}).active;
  if ((plan.mode !== "exact" && !cardinalityFocused && !permissionRecoveryFocused &&
      !sidePanelSingleCutoverFocused && !registryPlannerPreparationFocused &&
      !exactSliceSuccessorFocused) || !packIds.length ||
      !same(packIds, sortedUnique(plan.requestedPackIds ?? []))) {
    throw new Error("Verification evidence requires exact explicit known pack(s)");
  }
  if (plan.skipBuild || plan.shard || plan.withDependencies) {
    throw new Error("Verification evidence cannot use --no-build, --shard, or --with-dependencies");
  }
  if (!same(sortedUnique(plan.selectedPackIds ?? []), packIds)) {
    throw new Error("Evidence pack claims must equal the packs whose stages were executed");
  }
  if (plan.includeProperties !== true && !permissionRecoveryFocused &&
      !sidePanelSingleCutoverFocused && !registryPlannerPreparationFocused) {
    throw new Error("Verification evidence requires every registered property leaf; add --property");
  }
  if (plan.changeSet?.version !== 1 || !plan.baseCommit ||
      plan.changeSet.baseCommit !== plan.baseCommit ||
      !same(sortedUnique(plan.changeSet.paths ?? []), sortedUnique(plan.changedPaths ?? []))) {
    throw new Error("Verification evidence requires the canonical version 1 Git change set");
  }
  const identities = plan.tasks.map(verificationTaskIdentity);
  const cardinalityEvidence = cardinalityFocused
    ? validateRegistryCardinalityFocusedEvidence({
      task:evidenceTask,
      candidateRegistry,
      candidateOwnership:plan.cardinalityOwnership,
      changedPaths:plan.changedPaths,
      taskKeys:identities.map(({ key }) => key),
      syntheticProofs:{ current:true, addedRunnable:true, emptyCompatibility:true },
      includeProperties:plan.includeProperties,
      includePackage:identities.some(({ key }) => key === "package:extension"),
      terminalFull:false,
    }) : undefined;
  const keys = identities.map(({ key }) => key);
  if (!identities.length || new Set(keys).size !== keys.length) {
    throw new Error("Verification evidence requires a non-empty plan with unique task identities");
  }
  for (const packId of permissionRecoveryFocused ? [] : packIds) {
    if (!identities.some((identity) => identity.packId === packId)) {
      throw new Error(`Claimed pack has no executed verification stage: ${packId}`);
    }
  }
  return {
    version:2,
    mode:plan.mode,
    packIds,
    selectedPackIds:sortedUnique(plan.selectedPackIds),
    requestedPackIds:sortedUnique(plan.requestedPackIds),
    changedPaths:sortedUnique(plan.changedPaths ?? []),
    baseCommit:plan.baseCommit,
    changeSet:plan.changeSet,
    changedOwners:plan.changedOwners ?? {},
    changedBoundaries:plan.changedBoundaries ?? {},
    styleSmokeTargets:sortedUnique(plan.styleSmokeTargets ?? []),
    terminalFullObligations:sortedUnique(plan.terminalFullObligations ?? []),
    changedStyleTargets:plan.changedStyleTargets ?? {},
    adapterAuthorizationPackIds:sortedUnique(plan.adapterAuthorizationPackIds ?? []),
    conservativeHistoricalFallbackReason:plan.conservativeHistoricalFallbackReason ?? null,
    features:[...(plan.features ?? [])].sort(),
    handlers:[...(plan.handlers ?? [])].sort(),
    includeProperties:Boolean(plan.includeProperties),
    stages:plan.stages,
    tasks:identities,
    ...(exactSliceSuccessorFocused ? {
      selectedVerificationSliceTaskKeys:plan.selectedVerificationSliceTaskKeys,
      verificationSliceConservation:plan.verificationSliceConservation,
    } : {}),
    ...(cardinalityEvidence ? { cardinalityOwnership:cardinalityEvidence.ownership } : {}),
  };
}
