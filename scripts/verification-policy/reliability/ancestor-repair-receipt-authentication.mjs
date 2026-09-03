import {execFile} from "node:child_process";

import {canonicalVerificationChangeSet,verificationPacksAtCommit} from
  "../../verification-changes.mjs";
import {canonicalReliabilityRepairPlan} from
  "../../verification-execution/exact-slice-evidence-plan.mjs";
import {canonicalRepairTaskIdentities} from
  "../../verification-pack-cardinality/reliability-adapter.mjs";
import {verificationTaskIdentity} from "../../verification-packs.mjs";
import {timeoutRepairFocusedExecutionTaskPlan} from "../../verification-reliability-repair.mjs";
import {normalized} from "../../verification-reliability-values.mjs";
import {verificationTaskDigest} from "../../verification-task-succession.mjs";

const same=(left,right)=>JSON.stringify(normalized(left))===JSON.stringify(normalized(right));

function git(root,...args){
  return new Promise((resolve,reject)=>execFile("git",args,{cwd:root},
    (error,stdout,stderr)=>error?reject(new Error(stderr.trim()||error.message))
      :resolve(stdout.trim())));
}

export async function loadRepairCandidateRegistry(root,incident){
  const candidate=incident.repair.candidate;
  const tree=await git(root,"rev-parse",`${candidate.commit}^{tree}`);
  const packs=await verificationPacksAtCommit(candidate.commit,{
    repositoryRoot:root,historicalRegistryFallback:false,
  });
  const changeSet=await canonicalVerificationChangeSet({
    base:incident.repair.checkpoint.baseCommit,commit:candidate.commit,repositoryRoot:root,
  });
  const plan=await canonicalReliabilityRepairPlan(packs,{
    evidenceTask:incident.repair.checkpoint.evidenceTask,changeSet,repositoryRoot:root,
  });
  const identities=canonicalRepairTaskIdentities(packs,{
    planVerification:()=>plan,verificationTaskIdentity,
  });
  return {tree,identities};
}

function expandedRepairPlan(incident,canonicalIdentities){
  return timeoutRepairFocusedExecutionTaskPlan(
    incident.repair.focusedTaskPlan,canonicalIdentities);
}

function executionMatches(descriptor,result){
  if(descriptor.executionArgs===undefined&&descriptor.executionLogicalTargetIds===undefined){
    return true;
  }
  return same(result?.execution,{
    args:descriptor.executionArgs??descriptor.identity.args,
    logicalTargetIds:descriptor.executionLogicalTargetIds??[],
  });
}

export async function authenticateAncestorRepairReceiptExecution({
  root,incident,receipt,
  registryLoader=loadRepairCandidateRegistry,
}){
  const candidate=incident?.repair?.candidate;
  const registry=await registryLoader(root,incident);
  if(registry?.tree!==candidate?.tree||!Array.isArray(registry?.identities)){
    throw new Error("Ancestor repair receipt candidate registry identity changed");
  }
  const executionPlan=expandedRepairPlan(incident,registry.identities);
  const recorded=receipt?.plan?.executionTaskPlan;
  if(!Array.isArray(recorded)||!same(recorded,executionPlan)){
    throw new Error("Ancestor repair receipt expanded plan identity changed");
  }
  const expectedKeys=executionPlan.map(({identity})=>identity.key).sort();
  const receiptKeys=Object.keys(receipt?.tasks??{}).sort();
  if(expectedKeys.length!==new Set(expectedKeys).size||!same(receiptKeys,expectedKeys)){
    throw new Error("Ancestor repair receipt task closure changed");
  }
  for(const descriptor of executionPlan){
    const result=receipt.tasks[descriptor.identity.key];
    if(verificationTaskDigest(result?.identity)!==verificationTaskDigest(descriptor.identity)||
        !executionMatches(descriptor,result)){
      throw new Error("Ancestor repair receipt task identity changed");
    }
  }
  return executionPlan;
}
