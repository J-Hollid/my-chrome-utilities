import {bootstrapBaseCommit,bootstrapPathDeclarations,bootstrapTask,bootstrapTasks} from
  "./authority-config.mjs";
import {canonicalBootstrapPlan,compareBootstrapPlans} from "./plan.mjs";

function declarationFor(path) {
  return bootstrapPathDeclarations.find((declaration)=>declaration.path===path||
    declaration.prefix&&path.startsWith(declaration.prefix));
}

function pathProjection(changedPaths) {
  return changedPaths.map((path)=>{
    const declaration=declarationFor(path);
    if (!declaration) throw new Error(`Bootstrap changed path has no transition owner: ${path}`);
    return {path,owner:declaration.owner,sliceId:declaration.sliceId};
  });
}

export function projectBootstrapPlan({baseCommit=bootstrapBaseCommit,candidateCommit,candidateTree,
  changedPaths,toolchainDigest,artifactDigest="0".repeat(64)}) {
  if (baseCommit!==bootstrapBaseCommit) throw new Error("Bootstrap base does not match its authority");
  if (!Array.isArray(changedPaths)||!changedPaths.length||new Set(changedPaths).size!==changedPaths.length) {
    throw new Error("Bootstrap requires one canonical changed-path set");
  }
  const changedPathProjection=pathProjection(changedPaths);
  const tasks=bootstrapTasks.map(({forecastMs:unused,...task})=>structuredClone(task));
  return canonicalBootstrapPlan({version:1,task:bootstrapTask,baseCommit,candidateCommit,candidateTree,
    toolchainDigest,artifactDigest,forecastMs:bootstrapTasks.reduce((sum,task)=>sum+task.forecastMs,0),
    parentFallback:false,packIds:["verification_process"],
    sliceIds:["process_fast_path_bootstrap"],changedPaths:[...changedPaths],changedPathProjection,
    prerequisiteTaskKeys:tasks.slice(0,3).map(({key})=>key),consumerTaskKeys:[tasks[6].key],
    propertyTaskKeys:[],packageTaskKeys:[tasks[7].key],tasks});
}

export function compareProjectedBootstrapPlans(base,candidate) {
  const comparison=compareBootstrapPlans(base,candidate);
  for (const key of ["changedPaths","changedPathProjection","prerequisiteTaskKeys",
    "consumerTaskKeys","propertyTaskKeys","packageTaskKeys"]) {
    if (JSON.stringify(base[key])!==JSON.stringify(candidate[key])) {
      throw new Error(`Bootstrap plan mismatch: ${key}`);
    }
  }
  return comparison;
}
