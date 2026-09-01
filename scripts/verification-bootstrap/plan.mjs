import {bootstrapDigest,stableIdentity} from "./canonical.mjs";

const productStages=new Set(["browser","browser-observation"]);

function stableValues(values,name) {
  if (!Array.isArray(values)||!values.length||new Set(values).size!==values.length||
      values.some((value)=>typeof value!=="string"||!value.length)) {
    throw new Error(`Bootstrap ${name} identities are invalid`);
  }
  return [...values];
}

function canonicalTasks(tasks) {
  if (!Array.isArray(tasks)||!tasks.length) throw new Error("Bootstrap task identities are invalid");
  const keys=tasks.map(({key})=>key);
  if (new Set(keys).size!==keys.length||keys.some((key)=>typeof key!=="string"||!key.length)) {
    throw new Error("Bootstrap task identity is duplicate or invalid");
  }
  if (tasks.some(({stage})=>productStages.has(stage))) {
    throw new Error("Bootstrap plan contains a product or browser task");
  }
  if (tasks.some((task)=>typeof task.executable!=="string"||!task.executable||
      !Array.isArray(task.args)||task.args.some((arg)=>typeof arg!=="string")||
      !Array.isArray(task.requiredCapabilities)||
      !Number.isInteger(task.outputLimitBytes)||task.outputLimitBytes<=0)) {
    throw new Error("Bootstrap task command identity is incomplete");
  }
  return tasks.map((task)=>structuredClone(task));
}

export function canonicalBootstrapPlan(value) {
  if (!value||value.version!==1) throw new Error("Bootstrap plan requires version 1");
  const plan={...structuredClone(value),
    baseCommit:stableIdentity(value.baseCommit,"base commit"),
    candidateCommit:stableIdentity(value.candidateCommit,"candidate commit"),
    candidateTree:stableIdentity(value.candidateTree,"candidate tree"),
    toolchainDigest:stableIdentity(value.toolchainDigest,"toolchain"),
    artifactDigest:stableIdentity(value.artifactDigest,"artifact"),
    packIds:stableValues(value.packIds,"pack"),
    sliceIds:stableValues(value.sliceIds,"slice"),
    tasks:canonicalTasks(value.tasks),
  };
  plan.taskKeys=plan.tasks.map(({key})=>key);
  plan.planDigest=bootstrapDigest({task:plan.task,baseCommit:plan.baseCommit,
    candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,
    packIds:plan.packIds,sliceIds:plan.sliceIds,tasks:plan.tasks});
  return plan;
}

export function compareBootstrapPlans(baseValue,candidateValue) {
  const base=canonicalBootstrapPlan(baseValue),candidate=canonicalBootstrapPlan(candidateValue);
  const baseKeys=base.tasks.map(({key})=>key),candidateKeys=candidate.tasks.map(({key})=>key);
  const difference=[...new Set([...baseKeys,...candidateKeys])]
    .find((key)=>!baseKeys.includes(key)||!candidateKeys.includes(key)||
      JSON.stringify(base.tasks.find((task)=>task.key===key))!==
      JSON.stringify(candidate.tasks.find((task)=>task.key===key)));
  if (difference||JSON.stringify(base.packIds)!==JSON.stringify(candidate.packIds)||
      JSON.stringify(base.sliceIds)!==JSON.stringify(candidate.sliceIds)) {
    throw new Error(`Bootstrap plan mismatch${difference?`: ${difference}`:""}`);
  }
  return {taskKeys:candidateKeys,basePlanDigest:base.planDigest,
    candidatePlanDigest:candidate.planDigest};
}
