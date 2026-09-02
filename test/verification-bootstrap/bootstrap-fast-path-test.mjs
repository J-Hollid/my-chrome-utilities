import assert from "node:assert/strict";

import {validateAggregateChildren} from
  "../../scripts/verification-bootstrap/aggregate.mjs";
import {validateBootstrapAuthority} from
  "../../scripts/verification-bootstrap/authority.mjs";
import {validateBootstrapEligibility} from
  "../../scripts/verification-bootstrap/eligibility.mjs";
import {executeBootstrapPlan} from
  "../../scripts/verification-bootstrap/executor.mjs";
import {runTargetedMutationCheck} from
  "../../scripts/verification-bootstrap/mutation.mjs";
import {parseMutationDiscovery,validateMutationTarget} from
  "../../scripts/verification-bootstrap/mutation.mjs";
import {discoverMutationSites,validateMutationExecution} from
  "../../scripts/verification-bootstrap/mutation-discovery.mjs";
import {validateMutationPrerequisites} from
  "../../scripts/verification-bootstrap/mutation-prerequisites.mjs";
import {fixedBootstrapRegistry} from
  "../../scripts/verification-bootstrap/fixed-registry.mjs";
import {decodePortableReceipt,encodePortableReceipt} from
  "../../scripts/verification-bootstrap/portable-receipt.mjs";
import {canonicalBootstrapPlan,compareBootstrapPlans} from
  "../../scripts/verification-bootstrap/plan.mjs";
import {createBootstrapReceipt,validateBootstrapReceipt} from
  "../../scripts/verification-bootstrap/receipt.mjs";
import {createReviewBootstrapReceipt,validateReviewBootstrapReceipt} from
  "../../scripts/verification-bootstrap/receipt.mjs";
import {recoverBootstrapRun} from
  "../../scripts/verification-bootstrap/recovery.mjs";
import {validateSyntheticStageFixtures} from
  "../../scripts/verification-bootstrap/synthetic.mjs";
import {projectBootstrapPlan,validatePlannerClosureTransition} from
  "../../scripts/verification-bootstrap/transition-plan.mjs";
import {createReviewReadyRecord,validateReviewReadyRecord} from
  "../../scripts/settled-final-verification-review.mjs";
import {bootstrapPlan,stageFixtureTasks} from "./fixtures.mjs";

const plan=canonicalBootstrapPlan(bootstrapPlan());
assert.equal(validateSyntheticStageFixtures(stageFixtureTasks).stages.length,11);
assert.equal(plan.tasks.length,9);
assert.deepEqual(plan.packIds,["verification_process"]);
assert.deepEqual(plan.sliceIds,["process_fast_path_bootstrap"]);
assert.throws(()=>canonicalBootstrapPlan(bootstrapPlan({
  tasks:[...plan.tasks,{...plan.tasks[0]}],
})),/task identity/u);
assert.throws(()=>canonicalBootstrapPlan(bootstrapPlan({
  tasks:stageFixtureTasks,
})),/product or browser task/u);

assert.deepEqual(compareBootstrapPlans(plan,structuredClone(plan)).taskKeys,
  plan.tasks.map(({key})=>key));
assert.throws(()=>compareBootstrapPlans(plan,bootstrapPlan({tasks:plan.tasks.slice(1)})),
  /plan mismatch.*unit:bootstrap/u);

for (const [field,value,pattern] of [
  ["forecastMs",300_001,/five-minute forecast/u],
  ["parentFallback",true,/parent-pack fallback/u],
  ["packIds",["verification_process","shell"],/process-only/u],
]) {
  assert.throws(()=>validateBootstrapEligibility({...plan,[field]:value}),pattern);
}
assert.equal(validateBootstrapEligibility(plan).launchEligible,true);

let launches=0;
const executed=await executeBootstrapPlan(plan,{runTask:async(task)=>{
  launches+=1;
  return {key:task.key,status:"passed",identity:task};
}});
assert.equal(launches,plan.tasks.length);
assert.equal(new Set(executed.map(({key})=>key)).size,executed.length);
await assert.rejects(()=>executeBootstrapPlan({...plan,tasks:[...plan.tasks,plan.tasks[0]]},{
  runTask:async()=>{ launches+=1; },
}),/task identity/u);

let childLaunches=0;
const children=plan.tasks.slice(0,2).map((task)=>({key:task.key,status:"passed",identity:task}));
assert.equal(validateAggregateChildren(plan.tasks.slice(0,2),children).length,2);
assert.equal(childLaunches,0);
assert.throws(()=>validateAggregateChildren(plan.tasks.slice(0,2),children.slice(1)),/missing/u);
assert.throws(()=>validateAggregateChildren(plan.tasks.slice(0,2),[...children,children[0]]),/duplicate/u);
assert.throws(()=>validateAggregateChildren(plan.tasks.slice(0,2),[
  {...children[0],status:"failed"},children[1],
]),/failed/u);

let mutationCommands=0;
assert.deepEqual(await runTargetedMutationCheck({mutants:[],targetCommand:["bb","test"]},{
  runCommand:async()=>{ mutationCommands+=1; },
}),{status:"passed",mutantCount:0,commandStarted:false});
assert.equal(mutationCommands,0);
assert.equal((await runTargetedMutationCheck({mutants:[{id:"m1"}],targetCommand:["bb","test"]},{
  runCommand:async(command)=>{ mutationCommands+=1;assert.deepEqual(command,["bb","test"]); },
})).commandStarted,true);
assert.equal(mutationCommands,1);
await assert.rejects(()=>runTargetedMutationCheck({mutants:[{}],targetCommand:[]},{
  runCommand:async()=>{},
}),/target-specific/u);

const runIdentity={candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,
  planDigest:"f".repeat(64),toolchainDigest:plan.toolchainDigest,task:plan.task,incidentIds:[]};
for (const [status,action] of [["running","attach"],["completed","use-receipt"],["failed","report-failure"]]) {
  assert.equal(recoverBootstrapRun({...runIdentity,status},runIdentity).action,action);
}
assert.throws(()=>recoverBootstrapRun({...runIdentity,status:"running"},{...runIdentity,
  candidateTree:"0".repeat(40)}),/identity changed/u);

const receipt=createBootstrapReceipt(plan,executed);
assert.equal(validateBootstrapReceipt(receipt,plan).status,"passed");
assert.throws(()=>validateBootstrapReceipt({...receipt,candidateTree:"0".repeat(40)},plan),
  /receipt identity/u);
assert.throws(()=>validateBootstrapReceipt({...receipt,taskResults:receipt.taskResults.slice(1)},plan),
  /task results/u);
assert.throws(()=>validateBootstrapReceipt({...receipt,taskResults:receipt.taskResults.map(
  (result,index)=>index?result:{...result,identity:{...result.identity,args:["changed"]}})},plan),
  /command identity/u);

const reviewReceipt=createReviewBootstrapReceipt({plan,taskResults:executed,runId:"run-1",
  startedAt:"2026-09-01T00:00:00.000Z",completedAt:"2026-09-01T00:00:01.000Z"});
const reviewBytes=Buffer.from(`${JSON.stringify(reviewReceipt)}\n`);
const portable=encodePortableReceipt(reviewBytes);
assert.deepEqual(decodePortableReceipt(portable),reviewBytes);
assert.throws(()=>decodePortableReceipt({...portable,rawBase64:"e30K"}),/portable receipt digest/u);
assert.equal(validateReviewBootstrapReceipt(reviewReceipt,plan).runId,"run-1");
for (const changedBinding of [
  {task:"changed"},{baseCommit:"0".repeat(40)},{toolchainDigest:"0".repeat(64)},
  {forecastMs:plan.forecastMs+1},{parentFallback:true},{taskKeys:plan.taskKeys.slice(1)},
  {sourceTaskKeys:plan.sourceTaskKeys.slice(1)},
]) {
  assert.throws(()=>validateReviewBootstrapReceipt({...reviewReceipt,
    processFastPathBootstrap:{...reviewReceipt.processFastPathBootstrap,...changedBinding}},plan),
  /review receipt identity/u);
}
assert.throws(()=>validateReviewBootstrapReceipt({...reviewReceipt,tasks:{...reviewReceipt.tasks,
  [plan.tasks[0].key]:{...reviewReceipt.tasks[plan.tasks[0].key],identity:{...plan.tasks[0],
    args:["changed"]}}}},plan),/command identities/u);
const changeSet={version:1,baseCommit:plan.baseCommit,commit:plan.candidateCommit,
  paths:[],entries:[]};
const record=createReviewReadyRecord({task:plan.task,baseCommit:plan.baseCommit,
  candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,changeSet,
  receipt:reviewReceipt,receiptPath:"tmp/verification-receipts/bootstrap.json",
  receiptSha256:portable.sha256,receiptBytes:reviewBytes,
  recordedAt:"2026-09-01T00:00:02.000Z"});
assert.equal(record.processFastPathBootstrap.planDigest,plan.planDigest);
assert.deepEqual(decodePortableReceipt(record.receipt),reviewBytes);
assert.equal(validateReviewReadyRecord(record,{task:plan.task,baseCommit:plan.baseCommit,
  candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree}),true);
assert.throws(()=>validateReviewReadyRecord({...record,receipt:{...record.receipt,rawBase64:"e30K"}},
  {task:plan.task,baseCommit:plan.baseCommit,candidateCommit:plan.candidateCommit,
    candidateTree:plan.candidateTree}),/portable receipt digest/u);
assert.throws(()=>createReviewReadyRecord({task:plan.task,baseCommit:plan.baseCommit,
  candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,changeSet,
  receipt:{...reviewReceipt,processFastPathBootstrap:{...reviewReceipt.processFastPathBootstrap,
    parentFallback:true}},receiptPath:"tmp/verification-receipts/bootstrap.json",
  receiptSha256:"1".repeat(64)}),/fast-path bootstrap binding/u);

assert.equal(validateBootstrapAuthority({task:plan.task,baseCommit:plan.baseCommit,
  acceptedCandidate:null},plan).active,true);
assert.throws(()=>validateBootstrapAuthority({task:plan.task,baseCommit:plan.baseCommit,
  acceptedCandidate:plan.candidateCommit},plan),/expired/u);
assert.throws(()=>validateBootstrapAuthority({task:"different",baseCommit:plan.baseCommit,
  acceptedCandidate:null},plan),/authority identity/u);

const sourceClosure={packIds:["verification_process"],ownerPackIds:["verification_process"],
  taskKeys:["build:dist","property:source","acceptance-session:verification_process"],
  prerequisiteTaskKeys:["build:dist"],consumerTaskKeys:["acceptance-session:verification_process"],
  propertyTaskKeys:["property:source"],packageTaskKeys:["package:extension"]};
const transitionInput={candidateCommit:"2".repeat(40),candidateTree:"3".repeat(40),
  toolchainDigest:"4".repeat(64),changedPaths:[
    "scripts/verification-bootstrap/runner.mjs",
    "test/verification-bootstrap/bootstrap-fast-path-test.mjs",
    "acceptance/src/acceptance/bootstrap_session.clj",
    "acceptance/src/acceptance/verification_support/bootstrap_fast_path_handlers.clj",
    "scripts/settled-final-verification-review.mjs",
  ],plannerClosure:sourceClosure};
const transitionPlan=projectBootstrapPlan(transitionInput);
assert.ok(transitionPlan.forecastMs<=300_000);
assert.equal(transitionPlan.changedPathProjection.length,transitionInput.changedPaths.length);
const closurePlan=projectBootstrapPlan({...transitionInput,plannerClosure:sourceClosure});
assert.equal(validatePlannerClosureTransition(sourceClosure,structuredClone(sourceClosure),
  closurePlan).taskKeys.length,closurePlan.tasks.length);
assert.throws(()=>validatePlannerClosureTransition(sourceClosure,{...sourceClosure,
  propertyTaskKeys:[]},closurePlan),/planner closure changed/u);
assert.throws(()=>validatePlannerClosureTransition(sourceClosure,sourceClosure,
  {...closurePlan,sourcePropertyTaskKeys:[]}),/transition closure/u);
assert.equal(validatePlannerClosureTransition({classification:"bounded-ready",
  approvedPackIds:["verification_process"],plannedPackIds:["verification_process"],
  expansionCauses:[],terminalFullObligations:[],proposedPrefixes:[
    {prefix:"scripts/verification-bootstrap/",parentPackId:"verification_process",
      sliceId:"process_fast_path_bootstrap",consumers:[]},
    {prefix:"test/verification-bootstrap/",parentPackId:"verification_process",
      sliceId:"process_fast_path_bootstrap",consumers:[]},
  ],...sourceClosure},{classification:"bounded-ready",approvedPackIds:["verification_process"],
    plannedPackIds:["verification_process"],expansionCauses:[],terminalFullObligations:[],
    proposedPrefixes:[
      {prefix:"scripts/verification-bootstrap/",parentPackId:"verification_process",
        sliceId:"process_fast_path_bootstrap",consumers:[]},
      {prefix:"test/verification-bootstrap/",parentPackId:"verification_process",
        sliceId:"process_fast_path_bootstrap",consumers:[]},
    ],...sourceClosure},closurePlan).taskKeys.length,closurePlan.tasks.length);
assert.throws(()=>projectBootstrapPlan({...transitionInput,
  changedPaths:[...transitionInput.changedPaths,"src/product.ts"]}),/no transition owner/u);
assert.deepEqual(parseMutationDiscovery("Found 0 mutation sites.\nChanged mutation sites: 0\n"),
  {total:0,changed:0});
assert.deepEqual(parseMutationDiscovery("Found 7 mutation sites.\nChanged mutation sites: 3\n"),
  {total:7,changed:3});
assert.equal(validateMutationTarget({changed:3},"acceptance-session:verification_process:bootstrap",
  transitionPlan).targetRequired,true);
assert.throws(()=>validateMutationTarget({changed:3},"unit:absent",transitionPlan),
  /target-specific/u);
assert.deepEqual(validateMutationExecution("3/3 mutants killed (100.0%)",3),
  {killed:3,total:3});
assert.throws(()=>validateMutationExecution("2/3 mutants killed (66.7%)",3),/survived/u);
assert.throws(()=>validateMutationExecution("2/2 mutants killed (100.0%)",3),/population/u);
assert.throws(()=>validateMutationExecution(
  "Baseline: FAIL — specs do not pass without mutations. Aborting.",3),
  /mutation baseline failed/u);
const fixedRegistry=fixedBootstrapRegistry();
assert.deepEqual(validateMutationPrerequisites(fixedRegistry),{
  parseKey:"acceptance-parse:features/verification-process-bootstrap-fast-path.feature",
  generateKey:"acceptance-generate:features/verification-process-bootstrap-fast-path.feature",
  mutationKey:"mutation-discovery:acceptance-bootstrap-handler",
  targetKey:"acceptance-session:verification_process:bootstrap",
});
const misplacedMutation=fixedRegistry.tasks.find(({stage})=>stage==="mutation-discovery");
assert.throws(()=>validateMutationPrerequisites({...fixedRegistry,tasks:[
  fixedRegistry.tasks[0],misplacedMutation,
  ...fixedRegistry.tasks.slice(1).filter((task)=>task!==misplacedMutation),
]}),/parse and generation.*before mutation/u);
const mutationCalls=[],restores=[];
const mutationResult=await discoverMutationSites("source.clj","target",{registry:{tasks:[{
  key:"target",executable:"bb",args:["target-test"],
}]},read:async()=>Buffer.from("source"),write:async(...values)=>restores.push(values),
run:(executable,args,options,callback)=>{
  mutationCalls.push({executable,args,options});
  const output=mutationCalls.length===1
    ?"Found 3 mutation sites.\nChanged mutation sites: 3\n"
    :"3/3 mutants killed (100.0%)\n";
  callback(null,output,"");
}});
assert.equal(mutationResult.executableMutants,3);
assert.deepEqual(mutationCalls[1].args,
  ["source.clj","--since-last-run","--test-command","bb target-test"]);
assert.equal(restores.length,1);
let zeroCalls=0;
assert.equal((await discoverMutationSites("source.clj","target",{registry:{tasks:[{
  key:"target",executable:"bb",args:["target-test"],
}]},run:(executable,args,options,callback)=>{zeroCalls+=1;callback(null,
  "Found 0 mutation sites.\nChanged mutation sites: 0\n","");}})).executableMutants,0);
assert.equal(zeroCalls,1);
await assert.rejects(()=>discoverMutationSites("source.clj","target",{registry:{tasks:[{
  key:"target",executable:"bb",args:["target-test"],
}]},read:async()=>Buffer.from("source"),write:async()=>{},
run:(executable,args,options,callback)=>{
  if (args.includes("--scan")) callback(null,
    "Found 1 mutation sites.\nChanged mutation sites: 1\n","");
  else callback(new Error("exit 1"),"","missing generated acceptance input");
}}),/mutation baseline failed.*missing generated acceptance input/us);

console.log("verification bootstrap fast-path contracts passed");
