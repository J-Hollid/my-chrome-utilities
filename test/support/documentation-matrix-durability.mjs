const sequenceOnlyMoveObservation="let moved;for(let attempt=0;attempt<120;attempt+=1){moved=await repository.loadProject(projectId);if(moved.draftSequence>before.draftSequence)break;await pause(25);}";
const exactMoveObservation="const expectedMovedIds=[beforeIds[1],beforeIds[0],...beforeIds.slice(2)];let moved;for(let attempt=0;attempt<480;attempt+=1){const candidate=await repository.loadProject(projectId),candidateIds=candidate.state.project.documentation.sets[0].sections.find(section=>section.kind==='matrix').configuration.contextIds;if(JSON.stringify(candidateIds)===JSON.stringify(expectedMovedIds)){moved=candidate;break;}await pause(25);}if(!moved)throw new Error('Reordered matrix contexts were not durably saved');";

const sequenceOnlyDeselectionObservation="let after;for(let attempt=0;attempt<120;attempt+=1){after=await repository.loadProject(projectId);if(after.draftSequence>moved.draftSequence)break;await pause(25);}const afterIds=";
const exactDeselectionObservation="let after;for(let attempt=0;attempt<480;attempt+=1){const candidate=await repository.loadProject(projectId),candidateIds=candidate.state.project.documentation.sets[0].sections.find(section=>section.kind==='matrix').configuration.contextIds,expectedCandidateIds=movedIds.filter(id=>id!==removedId);if(JSON.stringify(candidateIds)===JSON.stringify(expectedCandidateIds)){after=candidate;break;}await pause(25);}if(!after)throw new Error('Deselected matrix context was not durably saved');const afterIds=";

export function matrixIsolationDurabilityExpression(expression){
  const withExactMove=expression.replace(sequenceOnlyMoveObservation,exactMoveObservation);
  if(withExactMove===expression)throw new Error("Matrix isolation probe no longer exposes its post-reorder observation");
  const withExactDeselection=withExactMove.replace(sequenceOnlyDeselectionObservation,exactDeselectionObservation);
  if(withExactDeselection===withExactMove)throw new Error("Matrix isolation probe no longer exposes its post-deselect observation");
  return withExactDeselection;
}
