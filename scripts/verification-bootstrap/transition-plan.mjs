import {bootstrapBaseCommit,bootstrapPathDeclarations,bootstrapTask,bootstrapTasks} from
  "./authority-config.mjs";
import {canonicalBootstrapPlan} from "./plan.mjs";
import {bootstrapDigest} from "./canonical.mjs";
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
  changedPaths,toolchainDigest,artifactDigest="0".repeat(64),plannerClosure}) {
  if (baseCommit!==bootstrapBaseCommit) throw new Error("Bootstrap base does not match its authority");
  if (!Array.isArray(changedPaths)||!changedPaths.length||new Set(changedPaths).size!==changedPaths.length) {
    throw new Error("Bootstrap requires one canonical changed-path set");
  }
  if (!plannerClosure||!["packIds","ownerPackIds","taskKeys","prerequisiteTaskKeys",
    "consumerTaskKeys","propertyTaskKeys","packageTaskKeys"].every((key)=>
    Array.isArray(plannerClosure[key]))) {
    throw new Error("Bootstrap requires an independent planner closure");
  }
  const changedPathProjection=pathProjection(changedPaths);
  const tasks=bootstrapTasks.map(({forecastMs:unused,...task})=>structuredClone(task));
  const source=plannerClosure;
  return canonicalBootstrapPlan({version:1,task:bootstrapTask,baseCommit,candidateCommit,candidateTree,
    toolchainDigest,artifactDigest,registryDigest:fixedBootstrapRegistryDigest(),
    forecastMs:bootstrapTasks.reduce((sum,task)=>sum+task.forecastMs,0),
    parentFallback:false,packIds:["verification_process"],
    sliceIds:["process_fast_path_bootstrap"],changedPaths:[...changedPaths],changedPathProjection,
    prerequisiteTaskKeys:[],consumerTaskKeys:[
      "acceptance-session:verification_process:bootstrap"],propertyTaskKeys:[],
    packageTaskKeys:["package:extension"],sourceClosureDigest:bootstrapDigest(source),
    sourceTaskKeys:[...source.taskKeys],sourceOwnerPackIds:[...source.ownerPackIds],
    sourcePrerequisiteTaskKeys:[...source.prerequisiteTaskKeys],
    sourceConsumerTaskKeys:[...source.consumerTaskKeys],
    sourcePropertyTaskKeys:[...source.propertyTaskKeys],
    sourcePackageTaskKeys:[...source.packageTaskKeys],tasks});
}

function closure(value) {
  return {packIds:value.packIds,ownerPackIds:value.ownerPackIds,taskKeys:value.taskKeys,
    prerequisiteTaskKeys:value.prerequisiteTaskKeys,consumerTaskKeys:value.consumerTaskKeys,
    propertyTaskKeys:value.propertyTaskKeys,packageTaskKeys:value.packageTaskKeys};
}

export function validatePlannerClosureTransition(base,candidate,candidatePlan) {
  const valid=base?.classification==="bounded-ready"&&
    JSON.stringify(base.approvedPackIds)===JSON.stringify(candidatePlan.packIds)&&
    JSON.stringify(base.plannedPackIds)===JSON.stringify(candidatePlan.packIds)&&
    (base.expansionCauses??[]).length===0&&(base.terminalFullObligations??[]).length===0;
  if (base.classification!==undefined&&!valid) {
    throw new Error("Bootstrap immutable base planner result does not permit this transition");
  }
  const expectedPrefixes=new Set(["scripts/verification-bootstrap/","test/verification-bootstrap/"]);
  if (base.proposedPrefixes!==undefined&&((base.proposedPrefixes??[]).length!==expectedPrefixes.size||
      base.proposedPrefixes.some(({prefix,parentPackId,sliceId,consumers})=>
        !expectedPrefixes.has(prefix)||parentPackId!=="verification_process"||
        sliceId!=="process_fast_path_bootstrap"||(consumers??[]).length))) {
    throw new Error("Bootstrap immutable base planner result has changed transition prefixes");
  }
  const baseClosure=closure(base),candidateClosure=closure(candidate);
  if (JSON.stringify(baseClosure)!==JSON.stringify(candidateClosure)) {
    throw new Error("Bootstrap planner closure changed between base and candidate");
  }
  const projected={packIds:candidatePlan.packIds,ownerPackIds:candidatePlan.sourceOwnerPackIds,
    taskKeys:candidatePlan.sourceTaskKeys,
    prerequisiteTaskKeys:candidatePlan.sourcePrerequisiteTaskKeys,
    consumerTaskKeys:candidatePlan.sourceConsumerTaskKeys,
    propertyTaskKeys:candidatePlan.sourcePropertyTaskKeys,
    packageTaskKeys:candidatePlan.sourcePackageTaskKeys};
  if (JSON.stringify(candidateClosure)!==JSON.stringify(projected)||
      JSON.stringify(candidatePlan.packageTaskKeys)!==JSON.stringify(candidateClosure.packageTaskKeys)) {
    throw new Error("Bootstrap transition closure does not match the independent planner closure");
  }
  return {taskKeys:[...candidatePlan.taskKeys],baseClassification:base.classification??null,
    candidatePlanDigest:candidatePlan.planDigest};
}
