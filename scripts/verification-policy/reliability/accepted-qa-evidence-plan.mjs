export const acceptedQaEvidenceTask="portability-baseline-evidence";

export function acceptedQaEvidencePlanRequested({evidenceTask,packIds}) {
  return evidenceTask===acceptedQaEvidenceTask&&
    JSON.stringify([...packIds].sort())===JSON.stringify(["shell","verification_process"]);
}

export function bindVerificationChangeScope(executionPlan,bindingPlan) {
  return {...executionPlan,
    changedPaths:bindingPlan.changedPaths,
    changeSet:bindingPlan.changeSet,
    baseCommit:bindingPlan.baseCommit,
    changedOwners:bindingPlan.changedOwners,
    changedBoundaries:bindingPlan.changedBoundaries,
    selectedVerificationSlices:bindingPlan.selectedVerificationSlices,
    selectedVerificationSliceTaskKeys:bindingPlan.selectedVerificationSliceTaskKeys,
    verificationSliceConservation:bindingPlan.verificationSliceConservation,
    styleSmokeTargets:bindingPlan.styleSmokeTargets,
    terminalFullObligations:bindingPlan.terminalFullObligations,
    changedStyleTargets:bindingPlan.changedStyleTargets,
    adapterAuthorizationPackIds:bindingPlan.adapterAuthorizationPackIds,
    conservativeHistoricalFallbackReason:bindingPlan.conservativeHistoricalFallbackReason};
}
