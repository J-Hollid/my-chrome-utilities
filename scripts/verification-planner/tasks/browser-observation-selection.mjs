export function selectOrdinaryBrowserObservations({
  observations,
  sliceNarrowed,
  sliceTargets,
  styleSmokeOnly,
  packSelected,
  conservativeParentFallback,
  changedAdapterTargetIds,
  boundaryTargets,
  stylesheetQaTargetIds,
}) {
  if (sliceNarrowed) return sliceTargets;
  if (styleSmokeOnly || !packSelected) return [];
  if (conservativeParentFallback) {
    return observations.filter(({id}) => !stylesheetQaTargetIds.has(id));
  }
  if (changedAdapterTargetIds.size) {
    return observations.filter(({id}) => changedAdapterTargetIds.has(id));
  }
  if (boundaryTargets.length) return boundaryTargets;
  return observations.filter(({id}) => !stylesheetQaTargetIds.has(id));
}

export function directlySelectedBrowserTargetIds(...targetGroups) {
  return new Set(targetGroups.flat().map((target) =>
    typeof target === "string" ? target : target.id));
}
