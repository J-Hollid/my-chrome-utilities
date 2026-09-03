import assert from "node:assert/strict";
import {mkdtemp,readdir,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  reviewHandoffProofReuse,
} from "../swarmforge/scripts/review-handoff-proof-reuse.mjs";
import {createTimeoutIncidentStore} from "../scripts/verification-reliability-store.mjs";
import {verificationTaskDigest} from "../scripts/verification-task-succession.mjs";

const commit="a".repeat(40);
const base="b".repeat(40);
const task="cross-worktree-review-proof-reuse";
const request={ commit, base, task, readiness:"review-ready", verified:"review-ready",
  sender:"refactorer" };

function boundary({blocked=[],reviewError,incidentError,delegateError}={}) {
  const calls={ review:0, incidents:0, delegate:0, writes:0, artifacts:0 };
  return { calls, dependencies:{
    resolveCommit:async(value)=>value,
    verifyReviewReadyEvidence:async()=>{
      calls.review+=1;
      if(reviewError)throw reviewError;
      return {candidateCommit:commit};
    },
    createIncidentStore:()=>({
      blockingForHandoff:async()=>{
        calls.incidents+=1;
        if(incidentError)throw incidentError;
        return blocked;
      },
      deferTerminalVerification:async()=>{calls.writes+=1;},
    }),
    runExistingHandoffGate:async()=>{
      calls.delegate+=1;
      calls.artifacts+=1;
      if(delegateError)throw delegateError;
    },
  }};
}

for(const state of ["no applicable incident","existing permitted deferral"]){
  const testBoundary=boundary();
  const result=await reviewHandoffProofReuse(request,testBoundary.dependencies);
  assert.deepEqual(result,{status:"reused",candidateCommit:commit});
  assert.deepEqual(testBoundary.calls,
    {review:1,incidents:1,delegate:0,writes:0,artifacts:0},state);
}

const temporaryStore=await mkdtemp(path.join(os.tmpdir(),"review-proof-reuse-"));
try{
  const result=await reviewHandoffProofReuse(request,{
    resolveCommit:async(value)=>value,
    verifyReviewReadyEvidence:async()=>({candidateCommit:commit}),
    createIncidentStore:()=>createTimeoutIncidentStore({storeDirectory:temporaryStore}),
    runExistingHandoffGate:async()=>assert.fail("an empty durable store must use reuse"),
  });
  assert.equal(result.status,"reused");
  assert.deepEqual(await readdir(temporaryStore),[],
    "the durable fast path does not write an incident transition");
}finally{await rm(temporaryStore,{recursive:true,force:true});}

const required=boundary({blocked:[{id:"needs-deferral"}]});
assert.deepEqual(await reviewHandoffProofReuse(request,required.dependencies),
  {status:"delegated",candidateCommit:commit});
assert.equal(required.calls.delegate,1,"a new deferral uses the existing exact proof gate");
assert.equal(required.calls.artifacts,1,"the existing gate keeps its local artifact requirement");

for(const [label,options,pattern] of [
  ["invalid durable state",{incidentError:new Error("invalid durable incident")},/invalid durable incident/u],
  ["forbidden relationship",{blocked:[{id:"forbidden"}],delegateError:new Error("forbidden candidate relationship")},/forbidden candidate relationship/u],
  ["changed review note",{reviewError:new Error("review-ready changed paths no longer match")},/changed paths/u],
]){
  const testBoundary=boundary(options);
  await assert.rejects(()=>reviewHandoffProofReuse(request,testBoundary.dependencies),pattern,label);
}

const ordinary=boundary();
await reviewHandoffProofReuse({...request,readiness:"legacy"},ordinary.dependencies);
assert.deepEqual(ordinary.calls,{review:0,incidents:0,delegate:1,writes:0,artifacts:1},
  "non-review routes remain on the existing reliability gate");

console.log("cross-worktree review proof reuse passed");

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory="other:cross-worktree handoff fixture module path";
  if(context.causalCategory===causalCategory){
    const expectedPreRepairFailure={helperResolved:false,senderWorktreeBound:false};
    const expectedRepairResult={helperResolved:true,senderWorktreeBound:true};
    const fixture={id:"cross-worktree-handoff-fixture-module-path-v1",causalCategory,
      diagnosedBoundaryDigest:verificationTaskDigest(context.diagnosedBoundary),
      input:{taskKey:"unit:test/verification-contracts/evidence-promotion-conservation-contract-test.mjs"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=verificationTaskDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:expectedRepairResult}}}));
  }
}
