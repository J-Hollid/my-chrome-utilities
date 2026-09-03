import {pathToFileURL} from "node:url";
import {execFile} from "node:child_process";
import {promisify} from "node:util";

import {createTimeoutIncidentStore} from "../../scripts/verification-reliability-store.mjs";
import {git} from "../../scripts/verification-reliability-values.mjs";

const exec=promisify(execFile);

function reviewHandoffRequested({readiness,verified}) {
  return verified==="review-ready"&&["review-ready","qa-ready"].includes(readiness);
}

async function canonicalCommit(value) {
  return git(process.cwd(),"rev-parse",`${value}^{commit}`);
}

async function existingHandoffGate(request) {
  await exec(process.execPath,["scripts/verification-reliability-incidents.mjs","assert-handoff",
    request.commit,request.base,request.task,request.readiness,request.verified,request.sender],
  {cwd:process.cwd()});
}

async function verifyReview(commit,base,task) {
  await exec(process.execPath,["scripts/settled-final-verification.mjs","verify-review",
    commit,base,task],{cwd:process.cwd()});
}

export async function reviewHandoffProofReuse(request,{
  resolveCommit=canonicalCommit,
  verifyReviewReadyEvidence:validateReview=verifyReview,
  createIncidentStore=()=>createTimeoutIncidentStore({root:process.cwd()}),
  runExistingHandoffGate=existingHandoffGate,
}={}) {
  if(!reviewHandoffRequested(request)) {
    await runExistingHandoffGate(request);
    return {status:"delegated"};
  }
  const commit=await resolveCommit(request.commit);
  await validateReview(commit,request.base,request.task);
  const blocked=await createIncidentStore().blockingForHandoff({commit,base:request.base,
    readiness:request.readiness,sender:request.sender,verified:request.verified});
  if(blocked.length===0)return {status:"reused",candidateCommit:commit};
  await runExistingHandoffGate({...request,commit});
  return {status:"delegated",candidateCommit:commit};
}

export async function runReviewHandoffProofReuseCli(args) {
  const [commit,base,task,readiness,verified,sender]=args;
  const result=await reviewHandoffProofReuse({commit,base,task,readiness,verified,sender});
  if(result.status==="reused")console.log("reliability incident gate passed");
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  runReviewHandoffProofReuseCli(process.argv.slice(2))
    .catch((error)=>{console.error(error.message);process.exitCode=1;});
}
