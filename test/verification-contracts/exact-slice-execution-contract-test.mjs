import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

import {validateExactSliceAggregate,validateExactSliceLaunch,
  validateExactSliceReceiptAggregate} from
  "../../scripts/verification-execution/exact-slice-control.mjs";
import {loadVerificationPacks,planVerification,verificationTaskIdentity} from
  "../../scripts/verification-packs.mjs";
import {canonicalEvidencePlanMode,canonicalPlanIncludesProperties,
  changedSinceFocusedExecutionPlan} from
  "../../scripts/verification-execution/runner.mjs";
import {exactSliceSuccessorBase,exactSliceSuccessorTask,exactSliceTransitionTaskKeys,
  validateExactSliceSuccessor} from
  "../../scripts/verification-execution/exact-slice-successor.mjs";
import {canonicalExactSliceEvidencePlan,canonicalReliabilityRepairPlan,
  reliabilitySuccessionPlanProvider} from
  "../../scripts/verification-execution/exact-slice-evidence-plan.mjs";
import {timeoutRepairPackageTaskIdentity} from
  "../../scripts/verification-reliability-incidents.mjs";
import {verificationPolicyContracts,verificationProcessTransitionSuccessors} from
  "../../scripts/verification-policy/contracts.mjs";
import {runVerificationProcessCompatibility} from
  "../../scripts/verification-policy/process-contract-compatibility.mjs";
import {canonicalRepairTaskIdentities} from
  "../../scripts/verification-pack-cardinality/reliability-adapter.mjs";

const task=(key,stage="unit")=>({key,stage,executable:"node",args:[`${key}.mjs`],
  requiredCapabilities:[],display:`node ${key}.mjs`,temporaryPathClass:"workspace"});
const selected=[task("build:dist","build"),task("unit:child"),task("package:extension","package")];
const plan={tasks:selected,packIds:["verification_process"],
  selectedVerificationSlices:{verification_process:["task_batching"]},
  selectedVerificationSliceTaskKeys:{verification_process:["unit:child"]},
  parentPackSliceFallbacks:[],verificationSliceDiagnostics:[],
  verificationSliceConservation:{verification_process:{completeTaskKeys:["unit:child"],
    sliceTaskKeys:["unit:child"],remainderTaskKeys:[],conserved:true}}};

assert.deepEqual(validateExactSliceLaunch(plan,{forecastMs:20_000,masterMode:false}),{
  taskKeys:selected.map(({key})=>key),sliceIds:["task_batching"],forecastMs:20_000,
});
for (const [change,pattern] of [
  [{parentPackSliceFallbacks:["verification_process"]},/parent-pack fallback/u],
  [{verificationSliceDiagnostics:["missing declaration"]},/slice diagnostics/u],
  [{tasks:[...selected,selected[1]]},/duplicate task/u],
]) assert.throws(()=>validateExactSliceLaunch({...plan,...change},{forecastMs:20_000}),pattern);
assert.throws(()=>validateExactSliceLaunch(plan,{forecastMs:300_001}),/five-minute forecast/u);
assert.throws(()=>validateExactSliceLaunch({...plan,verificationSliceConservation:{
  verification_process:{...plan.verificationSliceConservation.verification_process,
    remainderTaskKeys:["unit:unowned"]}}},{forecastMs:20_000,masterMode:true}),
  /parent closure.*slice union/u);

const results=selected.map((task)=>({key:task.key,status:"passed",
  identity:verificationTaskIdentity(task)}));
assert.equal(validateExactSliceAggregate(selected,results).length,selected.length);
assert.throws(()=>validateExactSliceAggregate(selected,results.slice(1)),/missing child/u);
assert.throws(()=>validateExactSliceAggregate(selected,[...results,results[0]]),/duplicate child/u);
assert.throws(()=>validateExactSliceAggregate(selected,results.map((result,index)=>index?result:{
  ...result,status:"failed"})),/failed child/u);
assert.throws(()=>validateExactSliceAggregate(selected,results.map((result,index)=>index?result:{
  ...result,identity:{...result.identity,args:["changed.mjs"]}})),/changed child/u);
assert.equal(validateExactSliceReceiptAggregate({tasks:selected},Object.fromEntries(results.map(
  ({key,...result})=>[key,result]))).length,selected.length);
assert.throws(()=>validateExactSliceReceiptAggregate({tasks:selected},{
  [selected[0].key]:results[0],
}),/missing child/u);

const packs=await loadVerificationPacks();
const repairChangeSet={baseCommit:exactSliceSuccessorBase,paths:["scripts/repair.mjs"]};
const repairBasePacks=[{id:"historical"}];
const plannedRepair={tasks:[task("unit:repair")]};
let repairPlannerOptions;
assert.equal(await canonicalReliabilityRepairPlan(packs,{
  evidenceTask:exactSliceSuccessorTask,changeSet:repairChangeSet,repositoryRoot:"/repository",
  basePacksLoader:async(baseCommit,options)=>{
    assert.equal(baseCommit,exactSliceSuccessorBase);
    assert.deepEqual(options,{repositoryRoot:"/repository",historicalRegistryFallback:true});
    return repairBasePacks;
  },
  planner:(_packs,options)=>{repairPlannerOptions=options;return plannedRepair;},
}),plannedRepair);
assert.deepEqual(repairPlannerOptions,{
  changedPaths:repairChangeSet.paths,changeSet:repairChangeSet,basePacks:repairBasePacks,
  includeProperties:true,
},"exact repair planning uses the historical changed-slice boundary");
const successionIdentities=canonicalRepairTaskIdentities(packs,{
  planVerification,verificationTaskIdentity,
});
assert.ok(successionIdentities.some(({packId})=>packId==="verification_process"));
assert.ok(successionIdentities.some(({packId})=>packId==="branding_polish"),
  "repair succession resolves identities from the full registry without executing them");
const activeIncident={id:"active"},unrelatedIncident={id:"unrelated"};
const exactPlanProvider=()=>plannedRepair;
assert.equal(reliabilitySuccessionPlanProvider(activeIncident,activeIncident,
  {exactPlanProvider,registryPlanner:planVerification}),exactPlanProvider,
  "the active incident resolves against the exact repair plan");
assert.equal(reliabilitySuccessionPlanProvider(unrelatedIncident,activeIncident,
  {exactPlanProvider,registryPlanner:planVerification}),planVerification,
  "unrelated incidents resolve against the full registry plan");
assert.equal(canonicalPlanIncludesProperties(exactSliceSuccessorTask,false),true,
  "the exact successor retains its required property identity");
assert.equal(canonicalPlanIncludesProperties("other-task",false),false);
const bindingPlan=planVerification(packs,{changedPaths:[
  ...verificationProcessTransitionSuccessors,
  "test/swarmforge-unblocker-binding-compatibility-test.mjs",
],includeProperties:true});
assert.deepEqual(bindingPlan.packIds,["shell","verification_process"]);
assert.deepEqual(bindingPlan.parentPackSliceFallbacks,[]);
assert.deepEqual(bindingPlan.verificationSliceDiagnostics,[]);
const retiredSlicePath="test/fixtures/retired-verification-contract.json";
const retiredTaskKey="unit:test/verification-contracts/registry-inventory-contract-test.mjs";
const retiredBasePacks=structuredClone(packs);
const retiredProcessPack=retiredBasePacks.find(({id})=>id==="verification_process");
retiredProcessPack.unit.push(retiredTaskKey.slice("unit:".length));
retiredProcessPack.verificationSlices.find(({id})=>id==="registry_inventory")
  .sourcePaths.push(retiredSlicePath);
const retiredChangeSet={version:1,baseCommit:"a".repeat(40),commit:"b".repeat(40),
  paths:[retiredSlicePath],entries:[{status:"D",path:retiredSlicePath}]};
const retiredPlan=planVerification(packs,{changedPaths:retiredChangeSet.paths,
  changeSet:retiredChangeSet,basePacks:retiredBasePacks,includeProperties:true});
assert.ok(retiredPlan.selectedVerificationSlices.verification_process
  .includes("registry_inventory"));
assert.ok(!retiredPlan.selectedVerificationSliceTaskKeys.verification_process
  .includes(retiredTaskKey),
  "a deleted historical slice binds the current slice tasks, not its retired child identity");
const retiredHelperPath="test/support/retired-verification-helper.mjs";
const retiredHelperBasePacks=structuredClone(packs);
retiredHelperBasePacks.find(({id})=>id==="shell").verificationHelpers.push({
  path:retiredHelperPath,consumers:["verification_process"],
});
const retiredHelperPaths=[...verificationProcessTransitionSuccessors,retiredHelperPath].sort();
const retiredHelperOnlyChangeSet={version:1,baseCommit:"c".repeat(40),
  commit:"d".repeat(40),paths:[retiredHelperPath],
  entries:[{status:"D",path:retiredHelperPath}]};
const retiredHelperOnlyPlan=planVerification(packs,{changedPaths:[retiredHelperPath],
  changeSet:retiredHelperOnlyChangeSet,basePacks:retiredHelperBasePacks,
  includeProperties:true});
const currentConsumerClosure=planVerification(packs,{packIds:["verification_process"],
  includeProperties:true});
assert.deepEqual(retiredHelperOnlyPlan.packIds,["verification_process"],
  "the deleted helper selects its exact historical consumer");
assert.deepEqual(retiredHelperOnlyPlan.tasks.map(verificationTaskIdentity),
  currentConsumerClosure.tasks.map(verificationTaskIdentity),
  "the deleted helper uses the consumer's current task closure");
assert.deepEqual(retiredHelperOnlyPlan.parentPackSliceFallbacks,[]);
assert.deepEqual(retiredHelperOnlyPlan.verificationSliceDiagnostics,[]);
assert.ok(!retiredHelperOnlyPlan.tasks.some(({key})=>key==="acceptance-session:shell"));
const retiredHelperChangeSet={version:1,baseCommit:"c".repeat(40),commit:"d".repeat(40),
  paths:retiredHelperPaths,entries:retiredHelperPaths.map((changedPath)=>changedPath===retiredHelperPath?
    {status:"D",path:changedPath}:{status:"M",path:changedPath})};
const retiredHelperPlan=planVerification(packs,{changedPaths:retiredHelperPaths,
  changeSet:retiredHelperChangeSet,basePacks:retiredHelperBasePacks,includeProperties:true});
assert.deepEqual(retiredHelperPlan.parentPackSliceFallbacks,[],
  "a retired exact helper does not become a generic parent fallback");
assert.ok(!retiredHelperPlan.tasks.some(({key})=>key==="acceptance-session:shell"));
const boundChangedPlan=changedSinceFocusedExecutionPlan(packs,{
  packIds:["verification_process"],includeProperties:true,focusedTaskKeys:[],
},bindingPlan,{changedSince:exactSliceSuccessorBase,evidenceTask:exactSliceSuccessorTask});
assert.deepEqual(boundChangedPlan.tasks,bindingPlan.tasks,
  "the exact successor executes the authenticated changed-path plan");
assert.deepEqual(boundChangedPlan.selectedVerificationSlices,bindingPlan.selectedVerificationSlices,
  "the exact successor keeps the authenticated selected slices");
assert.deepEqual(boundChangedPlan.selectedVerificationSliceTaskKeys,
  bindingPlan.selectedVerificationSliceTaskKeys,
  "the exact successor keeps the selected-slice task identities");
assert.deepEqual(boundChangedPlan.verificationSliceConservation,
  bindingPlan.verificationSliceConservation,
  "the exact successor keeps planner-derived conservation evidence");
const impactPlan=planVerification(packs,{changedPaths:[
  "scripts/verification-execution/exact-slice-control.mjs",
]});
assert.deepEqual(impactPlan.selectedVerificationSlices,{verification_process:["task_batching"]});
assert.ok(impactPlan.tasks.some(({key})=>
  key==="unit:test/verification-contracts/exact-slice-execution-contract-test.mjs"));
assert.ok(!impactPlan.tasks.some(({key})=>
  key==="unit:test/verification-contracts/reliability-prerequisite-contract-test.mjs"));
assert.equal(impactPlan.sessionTasks.length,1);
assert.equal(impactPlan.sessionTasks[0].target,
  "features/verification-process-exact-slice-execution.feature");
assert.ok(!impactPlan.sessionTasks[0].args.some((value)=>
  value.includes("modular-verification-packs")));
validateExactSliceLaunch(impactPlan,{forecastMs:20_000});

const parentPlan=planVerification(packs,{packIds:["verification_process"],includeProperties:true});
assert.deepEqual(parentPlan.verificationSliceConservation.verification_process.remainderTaskKeys,[]);
validateExactSliceLaunch(parentPlan,{forecastMs:200_000,masterMode:true});

const evidencePlan=canonicalExactSliceEvidencePlan(packs,{
  bindingPlan,packageTask:timeoutRepairPackageTaskIdentity,
});
assert.deepEqual(evidencePlan.packIds,["shell","verification_process"]);
assert.deepEqual(evidencePlan.requestedPackIds,["shell","verification_process"]);
assert.deepEqual(evidencePlan.claimPackIds,["shell","verification_process"],
  "the exact successor makes exact shell and process claims");
assert.deepEqual(evidencePlan.verificationSliceConservation,
  bindingPlan.verificationSliceConservation,
  "the evidence plan does not manufacture conservation data");
for(const key of exactSliceTransitionTaskKeys){
  assert.ok(evidencePlan.tasks.some((task)=>task.key===key),
    `the evidence plan includes transitioned child ${key}`);
}
assert.equal(validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,plan:evidencePlan}).active,true);
assert.equal(validateExactSliceLaunch(evidencePlan,{forecastMs:83_000}).taskKeys.length,
  evidencePlan.tasks.length,"launch accepts the planner-required property tasks");
assert.equal(validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,
  plan:{...evidencePlan,claimPackIds:undefined}}).active,true,
  "the canonical evidence document keeps its claim in packIds");
assert.equal(canonicalEvidencePlanMode({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,plan:evidencePlan}),true,
  "checkpoint evidence accepts the validated exact successor closure");
assert.equal(canonicalEvidencePlanMode({task:"other-task",
  baseCommit:exactSliceSuccessorBase,plan:bindingPlan}),false);
const missingChild=evidencePlan.tasks.filter(({key})=>key!==exactSliceTransitionTaskKeys[0]);
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,plan:{...evidencePlan,tasks:missingChild}}),
  /selected slice ownership|omits transitioned child owners/u);
const transitionTasks=exactSliceTransitionTaskKeys.map((key)=>
  evidencePlan.tasks.find((candidate)=>candidate.key===key));
const transitionResults=transitionTasks.map((task)=>({key:task.key,status:"passed",
  identity:verificationTaskIdentity(task)}));
assert.equal(runVerificationProcessCompatibility({tasks:transitionTasks,
  results:transitionResults}).length,exactSliceTransitionTaskKeys.length,
  "production compatibility validates every transitioned child result");
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:"0".repeat(40),plan:evidencePlan}),/approved QA authority/u);
assert.throws(()=>validateExactSliceSuccessor({task:exactSliceSuccessorTask,
  baseCommit:exactSliceSuccessorBase,acceptedCandidate:true,plan:evidencePlan}),/expired on QA/u);

const conservation=JSON.parse(await readFile(
  "test/fixtures/verification-process-compact-conservation.json","utf8"));
const ownerTransitions=conservation.compatibility.ownerTransitions;
const splitContracts=verificationPolicyContracts.filter(({testPaths})=>testPaths.length>1);
assert.deepEqual(ownerTransitions.map(({fromOwner})=>fromOwner).sort(),
  splitContracts.map(({testPath})=>testPath).sort(),
  "Phase 2 authenticates exactly the six aggregate owners");
for(const contract of splitContracts){
  const transition=ownerTransitions.find(({fromOwner})=>
    fromOwner===contract.testPath);
  assert.deepEqual(transition.toOwners,[...contract.testPaths],
    `${contract.id} transitions to its exact declared child owners`);
  assert.deepEqual(transition.authority,{
    commit:"4aea38cdf4899dc0a606215cc106ab743533c2fa",
    path:"features/verification-process-exact-slice-execution.feature",
    scenario:"Verification process exact slice execution 009",
  },`${contract.id} uses the approved Phase 2 owner authority`);
}

console.log("verification process exact-slice execution contracts passed");
