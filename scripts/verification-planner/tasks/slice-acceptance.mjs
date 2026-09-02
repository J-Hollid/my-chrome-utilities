export function sliceAcceptanceFeatureSelected({packId,feature,selectedSlices,
  selectedTaskKeys,parentFallbacks}) {
  if (!selectedSlices.has(packId)||parentFallbacks.has(packId)) return true;
  const keys=selectedTaskKeys.get(packId)??new Set();
  const parse=keys.has(`acceptance-parse:${feature}`);
  const generate=keys.has(`acceptance-generate:${feature}`);
  if (parse!==generate) {
    throw new Error(`Verification slice has incomplete acceptance preparation: ${feature}`);
  }
  return parse;
}

export function bindSliceAcceptancePrerequisites(task,{selectedSlices,selectedTaskKeys,
  parentFallbacks}) {
  if (!selectedSlices.has(task.packId)||parentFallbacks.has(task.packId)) return task;
  const featurePrerequisites={
    "features/settled-candidate-final-verification.feature":
      "unit:test/settled-final-verification-workflow-test.mjs",
  };
  const directPrerequisites=(task.target??"").split(",")
    .map((feature)=>featurePrerequisites[feature]).filter(Boolean);
  const prerequisites=["build:dist",...(selectedTaskKeys.get(task.packId)??[])]
    .concat(directPrerequisites)
    .filter((key)=>key!==task.key);
  return {...task,prerequisiteTaskKeys:[...new Set(prerequisites)]};
}
