// The plan is already projected to the pre-extraction owner identities.
// Subtract only additions in that same projection, never the live unit count.
export function schemaConservationCounts(plan, profile) {
  const addedUnits=plan.unitTasks.length-profile.unit.length;
  if(addedUnits<0)throw new Error("Schema projection lost conserved unit identities");
  return {
    exactTaskCount:plan.tasks.length-addedUnits-plan.checkpointTasks.length,
    unitCount:profile.unit.length,propertyCount:profile.property.length,
    featureCount:profile.features.length,handlerCount:profile.handlers.length,
    adapterCount:profile.browserAdapters.length,
    targetCount:plan.observationTasks.flatMap(task=>task.logicalTargetIds).length,
  };
}
