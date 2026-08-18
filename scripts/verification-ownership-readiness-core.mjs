import {verificationSliceMapping,verificationPackTaskKeys,planVerification} from "./verification-packs.mjs";
import {granularityDispositionFor,validateGranularityDispositions} from
  "./verification-granularity-dispositions.mjs";
import {canonicalRunIntentBootstrapPlan} from "./verification-run-intent.mjs";
import {validateOwnershipIntent} from "./verification-ownership-intent.mjs";
import {canonicalValues} from "./verification-ownership-paths.mjs";
import {validateWithinPackMateriality} from "./verification-ownership-within-pack.mjs";

const nextStages={
  "bounded-ready":"product implementation starts from the approved QA base",
  "granularity-assessment-required":
    "bounded agent judgment selects a reviewed seam, preparation, observation, or parent fallback",
  "coarse-within-pack":
    "bounded agent judgment selects a reviewed seam, preparation, observation, or parent fallback",
  "coarse-boundary":"a standing-authorized ownership preparation stage starts without another routine user approval",
  "genuinely-global":"implementation waits for current user or release direction",
  "ownership-unavailable":"implementation waits for ownership repair direction without inferring a narrower boundary",
  "requirements-expanded":"implementation waits for current user approval of the changed product or safety requirement",
};
const readinessClasses=new Set(Object.keys(nextStages));

function allRunnablePacksSelected(plannedPackIds,allPackIds) {
  const planned=canonicalValues(plannedPackIds??[]),all=canonicalValues(allPackIds??[]);
  return all.length>0&&planned.length===all.length&&planned.every((id,index)=>id===all[index]);
}

const arrayOrEmpty=(value)=>value??[];
const objectOrEmpty=(value)=>value??{};

function explicitClassification(input) {
  if (input.requirementsExpanded) return "requirements-expanded";
  if (input.ownershipUnavailable) return "ownership-unavailable";
  if (input.genuinelyGlobal) return "genuinely-global";
  return undefined;
}

function assessedSlice(withinPack) {
  if (!withinPack.unrelatedCompleteTaskFamily) return false;
  if (!withinPack.stableObservableBoundary) return false;
  return withinPack.reducesTaskScope&&withinPack.meaningPreserved;
}

function unresolvedCause(cause) {
  if (!cause.credibleBoundary) return false;
  if (cause.sliced) return false;
  return !cause.reviewedDisposition;
}

function boundedClassification(input) {
  if (assessedSlice(objectOrEmpty(input.withinPack))) return "coarse-within-pack";
  const unresolved=arrayOrEmpty(input.expansionCauses).some(unresolvedCause);
  if (unresolved&&!input.granularityAssessmentActive) return "granularity-assessment-required";
  return "bounded-ready";
}

function allPackClassification(input) {
  const causes=arrayOrEmpty(input.expansionCauses);
  if (!causes.length) return "genuinely-global";
  return causes.every(({credibleBoundary})=>credibleBoundary)?"coarse-boundary":"genuinely-global";
}

export function classifyOwnershipReadiness(input) {
  let classification=explicitClassification(input);
  if (!classification) classification=allRunnablePacksSelected(input.plannedPackIds,input.allPackIds)?
    allPackClassification(input):boundedClassification(input);
  if (!readinessClasses.has(classification)) {
    throw new Error("Unknown ownership-readiness classification");
  }
  const reasons={
    "bounded-ready":"Canonical ownership remains smaller than all runnable packs.",
    "granularity-assessment-required":"An unsliced credible boundary adds unforecast packs and has no reviewed durable disposition.",
    "coarse-within-pack":"A stable observable slice removes unrelated complete task work without changing verification meaning.",
    "coarse-boundary":"All-pack expansion is limited to shared paths with credible exact QA boundaries.",
    "genuinely-global":"The executable behavior has canonical application-wide impact.",
    "ownership-unavailable":"Canonical current or historical ownership is unavailable.",
    "requirements-expanded":"A bounded seam would alter an approved behavior or safety requirement.",
  };
  return {classification,nextStage:nextStages[classification],reason:reasons[classification]};
}

function expansionCausesFor(intent,plan,packs,dispositionRegistry) {
  const approvedPackIds=new Set(intent.approvedPackIds);
  return Object.entries(objectOrEmpty(plan.changedOwners)).filter(([,owners])=>
    owners.some((id)=>!approvedPackIds.has(id))).map(([path,owners])=>{
    const sliced=packs.some((pack)=>owners.includes(pack.id)&&
      verificationSliceMapping(packs,pack,path).kind==="slice");
    return {path,owners,credibleBoundary:Boolean(plan.changedBoundaries?.[path]),sliced,
      reviewedDisposition:granularityDispositionFor(dispositionRegistry,intent.task,path)};
  });
}

function readinessResult(intent,plan,packs,{
  withinPack:rawWithinPack,granularityDispositions={version:1,dispositions:[]},...extra
}={}) {
  const tasks=arrayOrEmpty(plan.tasks);
  const dispositionRegistry=validateGranularityDispositions(granularityDispositions);
  const expansionCauses=expansionCausesFor(intent,plan,packs,dispositionRegistry);
  const withinPack=validateWithinPackMateriality(rawWithinPack,intent,packs);
  if (withinPack&&!arrayOrEmpty(plan.packIds).includes(withinPack.parentPackId)) {
    throw new Error("Within-pack materiality parent pack is outside the canonical plan");
  }
  const classification=classifyOwnershipReadiness({plannedPackIds:canonicalValues(arrayOrEmpty(plan.packIds)),
    allPackIds:canonicalValues(packs.filter((pack)=>verificationPackTaskKeys(pack).size).map(({id})=>id)),
    expansionCauses,withinPack,granularityAssessmentActive:intent.task.startsWith("verification-slice-"),...extra});
  return {version:1,task:intent.task,baseCommit:intent.baseCommit,planOnly:true,...classification,
    approvedPackIds:intent.approvedPackIds,plannedPackIds:canonicalValues(arrayOrEmpty(plan.packIds)),
    taskCount:tasks.length,criticalPathEstimateMs:plan.criticalPathEstimateMs??tasks.length*1000,
    paths:canonicalValues(arrayOrEmpty(plan.changedPaths)),proposedPrefixes:structuredClone(intent.proposedPrefixes),
    withinPack:withinPack??null,quarantinedSliceIds:canonicalValues(arrayOrEmpty(plan.quarantinedSliceIds)),
    changedOwners:objectOrEmpty(plan.changedOwners),changedBoundaries:objectOrEmpty(plan.changedBoundaries),
    expansionCauses,unresolvedExpansionCauses:expansionCauses.filter(unresolvedCause).map(({path})=>path),
    terminalFullObligations:canonicalValues(arrayOrEmpty(plan.terminalFullObligations))};
}

export async function intentOwnershipReadiness({intent,packs,quarantinedSliceIds=[],
  plan=(paths)=>planVerification(packs,{changedPaths:paths,quarantinedSliceIds}),...extra}) {
  const validIntent=validateOwnershipIntent(intent,packs);
  return readinessResult(validIntent,await plan(canonicalValues(validIntent.likelyPaths)),packs,extra);
}

export async function exactOwnershipReadiness({intent,packs,changeSet,basePacks,plan,
  quarantinedSliceIds=[],...extra}) {
  const validIntent=validateOwnershipIntent(intent,packs);
  if (changeSet?.version!==1||changeSet.baseCommit!==validIntent.baseCommit||!Array.isArray(changeSet.paths)) {
    throw new Error("Exact ownership readiness requires the canonical version 1 change set");
  }
  let planned;
  if (plan) planned=await plan();
  else if (validIntent.task==="verification-ownership-readiness") {
    planned=canonicalRunIntentBootstrapPlan(packs,{packIds:validIntent.approvedPackIds,
      changeSet,basePacks,quarantinedSliceIds});
  } else {
    planned=planVerification(packs,{changedPaths:changeSet.paths,changeSet,basePacks,
      includeProperties:true,quarantinedSliceIds});
  }
  return readinessResult(validIntent,planned,packs,extra);
}
