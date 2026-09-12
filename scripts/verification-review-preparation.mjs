const sha=/^[a-f0-9]{40}$/u;
const stable=/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u;
const unique=values=>[...new Set(values)].sort();
const difference=(left,right)=>unique(left).filter(value=>!new Set(right).has(value));

export async function prepareReviewBinding(input,services) {
  if(!stable.test(input.task??''))throw new Error('Review preparation requires a stable task');
  const names=['receivedWorkBase','specificationCommit','evidenceBase','handoffBase','candidateCommit'];
  const resolved=Object.fromEntries(await Promise.all(names.map(async name=>[name,
    await services.resolveCommit(input[name])])));
  if(Object.values(resolved).some(value=>!sha.test(value))||!sha.test(input.candidateTree??''))
    throw new Error('Review preparation requires canonical commits and candidate tree');
  for(const name of names.slice(0,4))if(!await services.isAncestor(resolved[name],resolved.candidateCommit))
    throw new Error(`${name} is not a candidate ancestor`);
  const [evidencePaths,handoffPaths]=await Promise.all([
    services.changedPaths(resolved.evidenceBase,resolved.candidateCommit),
    services.changedPaths(resolved.handoffBase,resolved.candidateCommit)]);
  if(resolved.evidenceBase!==resolved.handoffBase||
      unique(evidencePaths).join('\0')!==unique(handoffPaths).join('\0')) {
    const onlyEvidence=difference(evidencePaths,handoffPaths);
    const onlyHandoff=difference(handoffPaths,evidencePaths);
    throw new Error(`Evidence base ${resolved.evidenceBase} and handoff base ${resolved.handoffBase} differ; `+
      `evidence-only paths: ${onlyEvidence.join(', ')||'none'}; handoff-only paths: ${onlyHandoff.join(', ')||'none'}`);
  }
  const binding={version:1,task:input.task,...resolved,candidateTree:input.candidateTree,
    changedPaths:unique(evidencePaths)};
  return {...binding,reviewReadyProof:false,
    verification:{task:input.task,baseCommit:resolved.evidenceBase,packIds:unique(input.packIds??[])},
    recordReview:{task:input.task,baseCommit:resolved.evidenceBase,candidateCommit:resolved.candidateCommit},
    handoff:{task:input.task,baseCommit:resolved.handoffBase,candidateCommit:resolved.candidateCommit}};
}

export function validatePreparedReview(prepared,current) {
  const checks=[['candidate commit','candidateCommit'],['candidate tree','candidateTree'],
    ['evidence base','evidenceBase'],['handoff base','handoffBase']];
  for(const [label,key] of checks)if(prepared[key]!==current[key])throw new Error(`Prepared ${label} changed`);
  return true;
}
