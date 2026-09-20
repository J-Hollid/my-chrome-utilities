import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {mkdir,mkdtemp,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";

import {recordEligibleRepairReviewTransaction,createReviewReadyRecord} from
  "../../scripts/settled-final-verification.mjs";
import {createDeterministicBaselineAdmission} from
  "../../scripts/verification-policy/reliability/baseline-evidence-admission.mjs";
import {boundedClosureContractRevision} from
  "../../scripts/verification-reliability-closure.mjs";
import {createTimeoutIncidentStore} from "../../scripts/verification-reliability-store.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
import {canonicalVerificationChangeSet} from "../../scripts/verification-changes.mjs";

const exec=promisify(execFile);
const sha=(value)=>timeoutIncidentDigest(value);

export async function verifyBaselineTransactionRealStoreGates() {
  const root=await mkdtemp(path.join(os.tmpdir(),"baseline-transaction-store-"));
  try {
    await exec("git",["init","-q","--initial-branch=master"],{cwd:root});
    await exec("git",["config","user.name","Baseline Transaction Test"],{cwd:root});
    await exec("git",["config","user.email","baseline@example.test"],{cwd:root});
    await writeFile(path.join(root,"README.md"),"base\n");
    await exec("git",["add","README.md"],{cwd:root});
    await exec("git",["commit","-qm","base"],{cwd:root});
    const base=(await exec("git",["rev-parse","HEAD"],{cwd:root})).stdout.trim();
    const baseTree=(await exec("git",["rev-parse","HEAD^{tree}"],{cwd:root})).stdout.trim();
    await writeFile(path.join(root,"runner.mjs"),"export const baseline = true;\n");
    await exec("git",["add","runner.mjs"],{cwd:root});
    await exec("git",["commit","-qm","candidate"],{cwd:root});
    const commit=(await exec("git",["rev-parse","HEAD"],{cwd:root})).stdout.trim();
    const tree=(await exec("git",["rev-parse","HEAD^{tree}"],{cwd:root})).stdout.trim();
    const task={key:"acceptance-session:verification_process",stage:"acceptance-session",
      packId:"verification_process",executable:"bb",args:["acceptance-pack-runner"],
      target:null,environment:null,requiredCapabilities:[]};
    const store=createTimeoutIncidentStore({root,storeDirectory:path.join(root,"incidents"),
      randomId:()=>"baseline-real-transaction",now:()=>"2026-09-20T03:00:00.000Z",
      isAncestor:async()=>true,currentCandidate:async()=>({commit,tree}),
      candidateChangedPaths:async()=>["runner.mjs"],authenticateBaselineProof:async()=>true});
    const incident=await store.create({failureClass:"nonzero-exit",fingerprint:sha("runner failure"),
      task,lineage:{commit:base,tree:baseTree,baseCommit:base,
        evidenceTask:"baseline-real-transaction",changeSetDigest:sha("change")},
      environment:{node:"24.19.0"},artifact:null,planDigest:sha("plan"),registryDigest:sha("registry"),
      configuredTimeoutMs:600000,resolvedDeadlines:{},durationMs:1,
      exitResult:{code:1,signal:null},termination:{signal:null,escalatedTo:null}});
    const relevantInputs={contractRevision:boundedClosureContractRevision,task,
      transitiveCode:{complete:true,paths:["runner.mjs"],digest:sha("code")},
      featureInputs:{complete:true,paths:[],digest:sha("features")},
      handlerInputs:{complete:true,paths:[],digest:sha("handlers")},
      generatedInputs:{complete:true,paths:[],digest:sha("generated")},
      productArtifact:{required:false},runnerSemantics:{digest:sha("runner")},
      prerequisiteSemantics:{digest:sha("prerequisites")},environment:null,
      toolchain:{digest:sha("toolchain")},limits:{}};
    const diagnosticFailureDigest=sha("diagnostic failure");
    const diagnostic=(revision,revisionTree)=>({version:1,runIntent:"baseline-diagnostic",
      commit:revision,tree:revisionTree,toolchainDigest:sha("locked toolchain"),checkKey:task.key,
      task,taskDigest:sha(task),relevantInputs,
      result:{status:"failed",failureDigest:diagnosticFailureDigest},
      startedAt:"2026-09-20T02:58:00.000Z",completedAt:"2026-09-20T02:59:00.000Z"});
    const baseReceipt=diagnostic(base,baseTree),candidateReceipt=diagnostic(commit,tree);
    const source=(name)=>({path:`tmp/verification-receipts/${name}.json`,
      sha256:sha(name),authenticatedSha256:sha(name)});
    const binding={base:{commit:base,tree:baseTree},candidate:{commit,tree},checkKey:task.key,
      evidenceTask:"baseline-real-transaction",changeSetDigest:sha("change"),
      planDigest:sha("plan"),selectedTaskKey:task.key};
    await store.recordDeterministicBaselineProof(incident.id,{binding,baseReceipt,candidateReceipt,
      baseSource:source("base"),candidateSource:source("candidate")});
    const admission=createDeterministicBaselineAdmission({...binding,incidentId:incident.id,
      failureDigest:incident.failureDigest,baseReceipt,candidateReceipt,
      baseSource:source("base"),candidateSource:source("candidate")});
    await mkdir(path.join(root,"build","package"),{recursive:true});
    await writeFile(path.join(root,"build","package","my-chrome-utilities.zip"),"package");
    const receipt={version:2,runIntent:"review-evidence",startedAt:"2026-09-20T03:01:00.000Z",
      completedAt:"2026-09-20T03:02:00.000Z",candidate:{commit,tree,baseCommit:base,
        evidenceTask:binding.evidenceTask,changeSetDigest:binding.changeSetDigest},
      plan:{taskPlanDigest:binding.planDigest,changedPaths:["runner.mjs"],
        requestedPackIds:["verification_process"]},deterministicBaselineAdmission:admission,
      tasks:{[task.key]:{identity:task,status:"failed",provenance:"fresh",
        reliabilityFailureDigest:incident.failureDigest,
        reliabilityFailureFingerprint:diagnosticFailureDigest},
      "package:canonical":{identity:{key:"package:canonical",stage:"package"},
        status:"passed",provenance:"fresh"}}};
    const changeSet=await canonicalVerificationChangeSet({base,commit,repositoryRoot:root});
    const record=createReviewReadyRecord({task:binding.evidenceTask,baseCommit:base,
      candidateCommit:commit,candidateTree:tree,changeSet,receipt,
      receiptPath:"tmp/verification-receipts/review.json",receiptSha256:sha("review receipt"),
      recordedAt:"2026-09-20T03:03:00.000Z"});
    const options={repositoryRoot:root,store,receiptLoader:async()=>structuredClone(receipt),
      packsLoader:async()=>[],baselineAdmissionBuilder:async()=>admission};
    await assert.rejects(()=>recordEligibleRepairReviewTransaction(record,{version:1,records:[]},{
      ...options,afterJournalCommitted:async()=>{throw new Error("committed journal crash");}}),
    /committed journal crash/u);
    assert.deepEqual((await store.blockingForEvidence({commit})).map(({id})=>id),[incident.id],
      "the production evidence gate rejects a prepared baseline deferral");
    assert.deepEqual((await store.blockingForHandoff({commit,base,readiness:"review-ready",
      sender:"coder",verified:"review-ready"})).map(({id})=>id),[incident.id],
    "the production handoff gate rejects a prepared baseline deferral");
    await recordEligibleRepairReviewTransaction(record,{version:1,records:[]},options);
    assert.deepEqual(await store.blockingForEvidence({commit}),[],
      "resume promotes the exact deferral through the production evidence gate");
    assert.deepEqual(await store.blockingForHandoff({commit,base,readiness:"review-ready",
      sender:"coder",verified:"review-ready"}),[],
    "resume promotes the exact deferral through the production handoff gate");
  } finally {
    await rm(root,{recursive:true,force:true});
  }
}
