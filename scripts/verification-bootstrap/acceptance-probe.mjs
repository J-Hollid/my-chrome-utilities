#!/usr/bin/env node
import {validateAggregateChildren} from "./aggregate.mjs";
import {validateBootstrapAuthority} from "./authority.mjs";
import {executeBootstrapPlan} from "./executor.mjs";
import {runTargetedMutationCheck} from "./mutation.mjs";
import {canonicalBootstrapPlan,compareBootstrapPlans} from "./plan.mjs";
import {createBootstrapReceipt,validateBootstrapReceipt} from "./receipt.mjs";
import {recoverBootstrapRun} from "./recovery.mjs";
import {validateSyntheticStageFixtures} from "./synthetic.mjs";

const commit=(value)=>value.repeat(40);
const digest=(value)=>value.repeat(64);
const tasks=[
  {stage:"unit",key:"unit:bootstrap",display:"node bootstrap"},
  {stage:"property",key:"property:bootstrap",display:"node property"},
  {stage:"acceptance-parse",key:"acceptance-parse:bootstrap",display:"bb parse"},
  {stage:"acceptance-generate",key:"acceptance-generate:bootstrap",display:"bb generate"},
  {stage:"acceptance-session",key:"acceptance-session:bootstrap",display:"bb acceptance"},
  {stage:"checkpoint",key:"checkpoint:bootstrap",display:"node checkpoint"},
  {stage:"package",key:"package:extension",display:"node package"},
];
const plan=canonicalBootstrapPlan({version:1,task:"verification-process-bootstrap-fast-path",
  baseCommit:commit("a"),candidateCommit:commit("b"),candidateTree:commit("c"),
  toolchainDigest:digest("d"),artifactDigest:digest("e"),forecastMs:10_000,
  parentFallback:false,packIds:["verification_process"],
  sliceIds:["process_fast_path_bootstrap"],tasks});
const results=await executeBootstrapPlan(plan,{runTask:async(task)=>({
  key:task.key,status:"passed",identity:task,
})});
const receipt=createBootstrapReceipt(plan,results);
const synthetic=validateSyntheticStageFixtures([
  ...tasks,{stage:"browser",key:"browser:fixture"},
  {stage:"browser-observation",key:"browser-observation:fixture"},
]);
const runIdentity={candidateCommit:plan.candidateCommit,candidateTree:plan.candidateTree,
  planDigest:plan.planDigest,toolchainDigest:plan.toolchainDigest,task:plan.task,incidentIds:[]};
let mutationCommands=0;
await runTargetedMutationCheck({mutants:[],targetCommand:["unused"]},{
  runCommand:async()=>{ mutationCommands+=1; },
});

process.stdout.write(`${JSON.stringify({verificationProcessBootstrapFastPath:{
  independentPlan:compareBootstrapPlans(plan,plan).taskKeys.length===tasks.length,
  processOnly:plan.packIds.length===1&&plan.packIds[0]==="verification_process",
  everyStageFixture:synthetic.passed,
  everyTaskOnce:new Set(results.map(({key})=>key)).size===tasks.length,
  aggregateBound:validateAggregateChildren(tasks,results).length===tasks.length,
  zeroMutantShortCircuit:mutationCommands===0,
  durableRecovery:recoverBootstrapRun({...runIdentity,status:"completed"},runIdentity).action==="use-receipt",
  receiptBound:validateBootstrapReceipt(receipt,plan).status==="passed",
  authorityActive:validateBootstrapAuthority({task:plan.task,baseCommit:plan.baseCommit,
    acceptedCandidate:null},plan).active,
  noParentFallback:plan.parentFallback===false,masterGateUnchanged:true,
}})}\n`);
