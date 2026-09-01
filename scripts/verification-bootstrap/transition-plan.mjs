import {bootstrapBaseCommit,bootstrapPathDeclarations,bootstrapTask,bootstrapTasks} from
  "./authority-config.mjs";
import {canonicalBootstrapPlan} from "./plan.mjs";
import {fixedBootstrapRegistryDigest} from "./fixed-registry.mjs";

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
    toolchainDigest,artifactDigest,registryDigest:fixedBootstrapRegistryDigest(),
    forecastMs:bootstrapTasks.reduce((sum,task)=>sum+task.forecastMs,0),
    parentFallback:false,packIds:["verification_process"],
    sliceIds:["process_fast_path_bootstrap"],changedPaths:[...changedPaths],changedPathProjection,
    prerequisiteTaskKeys:[],consumerTaskKeys:[
      "acceptance-session:verification_process:bootstrap"],propertyTaskKeys:[],
    packageTaskKeys:["package:extension"],tasks});
}

export function validateBasePlannerTransition(base,candidate) {
  const valid=base?.classification==="bounded-ready"&&
    JSON.stringify(base.approvedPackIds)===JSON.stringify(candidate.packIds)&&
    JSON.stringify(base.plannedPackIds)===JSON.stringify(candidate.packIds)&&
    (base.expansionCauses??[]).length===0&&(base.terminalFullObligations??[]).length===0;
  if (!valid) throw new Error("Bootstrap immutable base planner result does not permit this transition");
  const expectedPrefixes=new Set(["scripts/verification-bootstrap/","test/verification-bootstrap/"]);
  if ((base.proposedPrefixes??[]).length!==expectedPrefixes.size||
      base.proposedPrefixes.some(({prefix,parentPackId,sliceId,consumers})=>
        !expectedPrefixes.has(prefix)||parentPackId!=="verification_process"||
        sliceId!=="process_fast_path_bootstrap"||(consumers??[]).length)) {
    throw new Error("Bootstrap immutable base planner result has changed transition prefixes");
  }
  return {taskKeys:[...candidate.taskKeys],baseClassification:base.classification,
    candidatePlanDigest:candidate.planDigest};
}
