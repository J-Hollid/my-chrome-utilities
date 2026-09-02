function oneTask(tasks,stage,target) {
  const matches=tasks.filter((task)=>task.stage===stage&&task.target===target);
  if (matches.length!==1) {
    throw new Error(`Bootstrap mutation requires one ${stage} task for its acceptance target`);
  }
  return matches[0];
}

export function validateMutationPrerequisites(plan) {
  const tasks=plan.tasks;
  const mutationIndex=tasks.findIndex(({stage})=>stage==="mutation-discovery");
  const mutation=tasks[mutationIndex];
  const targetKey=mutation?.args.at(-1);
  const targetIndex=tasks.findIndex(({key})=>key===targetKey);
  const target=tasks[targetIndex];
  if (mutationIndex<0||targetIndex<0) {
    throw new Error("Bootstrap mutation target is not selected");
  }
  if (target.stage!=="acceptance-session") {
    return {mutationKey:mutation.key,targetKey};
  }
  const parse=oneTask(tasks,"acceptance-parse",target.target);
  const generate=oneTask(tasks,"acceptance-generate",target.target);
  const parseIndex=tasks.indexOf(parse),generateIndex=tasks.indexOf(generate);
  if (!(parseIndex<generateIndex&&generateIndex<mutationIndex&&mutationIndex<targetIndex)) {
    throw new Error("Bootstrap acceptance parse and generation must run before mutation");
  }
  return {parseKey:parse.key,generateKey:generate.key,mutationKey:mutation.key,targetKey};
}
