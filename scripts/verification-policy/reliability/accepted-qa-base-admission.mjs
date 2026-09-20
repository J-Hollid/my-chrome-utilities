import {execFile} from "node:child_process";

import {validateReviewReadyRecord} from "../../settled-final-verification-review.mjs";
import {normalized,timeoutIncidentDigest} from "../../verification-reliability-values.mjs";

const reviewNotesRef="refs/notes/swarmforge-review-ready";
const sha=/^[a-f0-9]{40}$/u;

const git=(root,args,input)=>new Promise((resolve,reject)=>execFile("git",args,
  {cwd:root,maxBuffer:16*1024*1024,...(input===undefined?{}:{input})},
  (error,stdout,stderr)=>error?reject(new Error(stderr.trim()||error.message)):resolve(stdout.trim())));
const ancestor=(root,left,right)=>git(root,["merge-base","--is-ancestor",left,right])
  .then(()=>true,()=>false);

async function reviewRecords(root) {
  let listed;
  try {listed=await git(root,["notes",`--ref=${reviewNotesRef}`,"list"]);}
  catch {return [];}
  return (await Promise.all(listed.split(/\r?\n/u).filter(Boolean).map(async(line)=>{
    const commit=line.trim().split(/\s+/u)[1];
    const note=JSON.parse(await git(root,["notes",`--ref=${reviewNotesRef}`,"show",commit]));
    return (note.records??[]).map(record=>({commit,record}));
  }))).flat();
}

export async function authenticateAcceptedQaBaseRepair({incident,repair,candidate,baseCommit,
  root=process.cwd(),recordsLoader=reviewRecords,isAncestor=(left,right)=>ancestor(root,left,right),
  treeLoader=(commit)=>git(root,["rev-parse",`${commit}^{tree}`]),
  reviewValidator=validateReviewReadyRecord}) {
  if(repair?.checkpoint?.baseCommit===baseCommit)return undefined;
  const requiredPaths=new Set(repair?.changedPaths??[]);
  const matches=[];
  for(const {commit,record} of await recordsLoader(root)) {
    if(commit!==record?.candidateCommit||record?.task!==repair.checkpoint?.evidenceTask||
        !record?.focusedScope?.taskKeys?.includes(repair.regression?.key)||
        !record.focusedScope.taskKeys.includes("package:extension")||
        [...requiredPaths].some(path=>!record.changeSet?.paths?.includes(path))||
        !await isAncestor(record.candidateCommit,baseCommit))continue;
    const tree=await treeLoader(record.candidateCommit);
    try {reviewValidator(record,{task:record.task,baseCommit:record.baseCommit,
      candidateCommit:record.candidateCommit,candidateTree:tree});}
    catch {continue;}
    if(!await isAncestor(repair.checkpoint.baseCommit,repair.candidate.commit)||
        !await isAncestor(repair.checkpoint.baseCommit,record.baseCommit)||
        !await isAncestor(record.baseCommit,record.candidateCommit)||
        !await isAncestor(baseCommit,candidate.commit))continue;
    matches.push({record,tree});
  }
  const latest=[];
  for(const match of matches) {
    const superseded=(await Promise.all(matches.filter(other=>
      other.record.candidateCommit!==match.record.candidateCommit).map(other=>
      isAncestor(match.record.candidateCommit,other.record.candidateCommit)))).some(Boolean);
    if(!superseded)latest.push(match);
  }
  if(latest.length!==1)throw new Error(`Eligible repair admission ${incident.id} lacks one bound accepted-QA review checkpoint`);
  const {record,tree}=latest[0];
  const unsigned={version:1,kind:"accepted-qa-base",incidentId:incident.id,
    failureDigest:incident.failureDigest,repairDigest:timeoutIncidentDigest(repair),
    originalCheckpoint:structuredClone(repair.checkpoint),
    effectiveCheckpoint:{baseCommit,evidenceTask:repair.checkpoint.evidenceTask},
    repairCandidate:structuredClone(repair.candidate),acceptedReview:{task:record.task,
      baseCommit:record.baseCommit,candidateCommit:record.candidateCommit,candidateTree:tree,
      receiptSha256:record.receipt.sha256,recordDigest:timeoutIncidentDigest(normalized(record))},
    currentCandidate:structuredClone(candidate),ancestry:"authenticated-review-chain"};
  return {...unsigned,digest:timeoutIncidentDigest(unsigned)};
}

export function validateAcceptedQaBaseRepair(proof,{incidentId,failureDigest,repairDigest,
  baseCommit,evidenceTask,candidate,originalCheckpoint,repairCandidate}) {
  if(!proof)return false;
  const unsigned={...proof};delete unsigned.digest;
  return proof.version===1&&proof.kind==="accepted-qa-base"&&proof.incidentId===incidentId&&
    proof.failureDigest===failureDigest&&proof.repairDigest===repairDigest&&
    timeoutIncidentDigest(proof.originalCheckpoint)===timeoutIncidentDigest(originalCheckpoint)&&
    timeoutIncidentDigest(proof.repairCandidate)===timeoutIncidentDigest(repairCandidate)&&
    proof.originalCheckpoint?.evidenceTask===evidenceTask&&
    proof.acceptedReview?.task===evidenceTask&&
    proof.effectiveCheckpoint?.baseCommit===baseCommit&&
    proof.effectiveCheckpoint?.evidenceTask===evidenceTask&&
    proof.currentCandidate?.commit===candidate.commit&&proof.currentCandidate?.tree===candidate.tree&&
    proof.ancestry==="authenticated-review-chain"&&sha.test(proof.acceptedReview?.candidateCommit??"")&&
    /^[a-f0-9]{64}$/u.test(proof.acceptedReview?.receiptSha256??"")&&
    /^[a-f0-9]{64}$/u.test(proof.acceptedReview?.recordDigest??"")&&
    proof.digest===timeoutIncidentDigest(unsigned);
}
