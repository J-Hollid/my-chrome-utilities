export function receiptBoundTaskBoundary(incident,sourceTaskDigest){
  return{version:1,kind:"receipt-bound-task",incidentId:incident.id,
    sourceReceipt:incident.failure.sourceReceipt,
    sourceLineage:{commit:incident.failure.lineage?.commit,tree:incident.failure.lineage?.tree},
    sourceTaskDigest};
}

export async function validateReceiptBoundTaskEdge({edge,incident,graph,currentIdentities,
  loadSourceReceipt,operations}){
  if(edge.incidentId===undefined)return;
  const {boundaryDigest,same,taskDigest}=operations;
  const expectedBoundary=receiptBoundTaskBoundary(incident,edge.sourceTaskDigest);
  const destinationMatches=currentIdentities.filter(identity=>
    taskDigest(identity)===edge.destinationTaskDigest);
  let receipt;
  try{receipt=await loadSourceReceipt(edge.sourceReceipt);}catch{
    throw new Error("Task-scoped receipt-bound succession source receipt is unavailable");
  }
  const receiptTask=receipt?.tasks?.[incident.failure.task.key];
  if(edge.version!==1||edge.incidentId!==incident.id||
      edge.sourceReceipt!==incident.failure.sourceReceipt||
      edge.sourceRegistryCommit!==incident.failure.lineage?.commit||
      edge.sourceLineageTree!==incident.failure.lineage?.tree||
      edge.sourceTaskDigest!==taskDigest(incident.failure.task)||
      edge.logicalSlice?.kind!=="task"||Object.keys(edge.logicalSlice).length!==1||
      destinationMatches.length!==1||
      receipt.candidate?.commit!==incident.failure.lineage?.commit||
      receipt.candidate?.tree!==incident.failure.lineage?.tree||receiptTask?.status!=="failed"||
      !same(receiptTask.identity,incident.failure.task)||
      !same(graph.boundaries[edge.sourceTaskDigest],expectedBoundary)||
      !same(graph.boundaries[edge.destinationTaskDigest],expectedBoundary)||
      edge.conservedBoundaryDigest!==boundaryDigest(expectedBoundary))
    throw new Error("Task-scoped receipt-bound succession declaration does not match the incident");
}

export function historicalRegistryDeclaresReceiptBoundTask(identity,packs,plannedIdentities,
  historicalRegistryDeclaresTask){
  const {prerequisiteTaskKeys,...identityWithoutPrerequisites}=identity;
  return Array.isArray(prerequisiteTaskKeys)&&prerequisiteTaskKeys.length>0&&
    new Set(prerequisiteTaskKeys).size===prerequisiteTaskKeys.length&&
    prerequisiteTaskKeys.every(key=>plannedIdentities.some(candidate=>candidate.key===key))&&
    historicalRegistryDeclaresTask(identityWithoutPrerequisites,packs,plannedIdentities);
}
