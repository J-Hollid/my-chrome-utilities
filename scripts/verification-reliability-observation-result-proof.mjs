import {validateIncident} from "./verification-reliability-persistence.mjs";
import {execFileSync} from "node:child_process";
import {lstatSync,readFileSync,realpathSync} from "node:fs";
import path from "node:path";
import {parseBrowserObservationBatchOutput} from "./browser-observation/results.mjs";
import {browserObservationEvidenceLeaves} from "./verification-registry/validation.mjs";
import {planVerification,verificationTaskIdentity} from "./verification-planner/tasks/planner.mjs";
import {verificationTaskDigest} from "./verification-task-succession.mjs";
import {normalized,repositoryRoot,timeoutIncidentDigest} from "./verification-reliability-values.mjs";

const same=(a,b)=>JSON.stringify(normalized(a))===JSON.stringify(normalized(b));
const reject=()=>{throw new Error("Observation result repair requires authenticated original receipt evidence");};

export function observationResultRepairRequired(incident) {
  const failure=incident?.failure,task=failure?.task,boundary=failure?.failedBoundary;
  return failure?.failureClass==="nonzero-exit"&&failure.retryScope===undefined&&
    task?.stage==="browser-observation"&&task.args?.[0]==="scripts/run-browser-observation.mjs"&&
    Array.isArray(task.logicalTargetIds)&&task.logicalTargetIds.length>0&&
    same(task.args.slice(1),task.logicalTargetIds)&&boundary?.boundary==="cleanup"&&
    boundary.phase==="process-shutdown"&&boundary.completed===true&&
    failure.exitResult?.code===1&&failure.exitResult.signal===null;
}

function loadSourceReceipt(incident) {
  const relative=incident.failure.sourceReceipt;
  if(!/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(relative??""))reject();
  const absolute=path.resolve(repositoryRoot,relative),stat=lstatSync(absolute);
  if(!stat.isFile()||stat.isSymbolicLink()||realpathSync(absolute)!==absolute||
      stat.size>32*1024*1024)reject();
  const bytes=readFileSync(absolute,"utf8");
  return {path:relative,bytes,receipt:JSON.parse(bytes)};
}

function loadHistorical(incident,receipt) {
  const commit=incident.failure.lineage.commit;
  if(!/^[a-f0-9]{40}$/u.test(commit??""))reject();
  const git=(args)=>execFileSync("git",args,{cwd:repositoryRoot,encoding:"utf8",
    timeout:5000,maxBuffer:4*1024*1024}).trim();
  const packs=JSON.parse(git(["show",`${commit}:verification/packs.json`]));
  const plan=planVerification(packs,{packIds:receipt.plan?.selectedPackIds,includeProperties:true});
  return {commit,tree:git(["rev-parse",`${commit}^{tree}`]),packs,
    tasks:plan.tasks.map(verificationTaskIdentity)};
}

export function deriveObservationResultRepairProof(incident,{
  sourceReceiptLoader=loadSourceReceipt,historicalLoader=loadHistorical,
}={}) {
  validateIncident(incident);
  if(!observationResultRepairRequired(incident))reject();
  const failure=incident.failure,task=failure.task;
  const document=sourceReceiptLoader(incident),receipt=document.receipt;
  if(!same(JSON.parse(document.bytes),receipt)||document.path!==failure.sourceReceipt)reject();
  const historical=historicalLoader(incident,receipt),entry=receipt.tasks?.[task.key];
  const canonical=historical.tasks.filter(({key})=>key===task.key);
  if(receipt.version!==2||receipt.plan?.mode!=="exact"||receipt.runId!==failure.runnerRunId||
      receipt.candidate?.commit!==failure.lineage.commit||receipt.candidate?.tree!==failure.lineage.tree||
      historical.commit!==failure.lineage.commit||historical.tree!==failure.lineage.tree||
      canonical.length!==1||verificationTaskDigest(canonical[0])!==verificationTaskDigest(task)||
      !same(entry?.identity,task)||entry.status!=="failed"||entry.exitCode!==1||entry.signal!==null||
      entry.reliabilityIncidentId!==incident.id||entry.reliabilityFailureDigest!==incident.failureDigest||
      typeof entry.output!=="string"||typeof entry.stderr!=="string"||
      timeoutIncidentDigest(entry.output)!==failure.outputSha256||
      timeoutIncidentDigest(entry.stderr)!==failure.stderrSha256||
      timeoutIncidentDigest(receipt.plan)!==failure.planDigest||
      timeoutIncidentDigest(historical.packs)!==failure.registryDigest||
      receipt.registryDigest!==failure.registryDigest)reject();
  const observations=task.logicalTargetIds.map(id=>{
    const matches=historical.packs.flatMap(pack=>(pack.browserObservations??[])
      .filter(observation=>observation.id===id).map(observation=>({...observation,
        evidenceLeaves:browserObservationEvidenceLeaves(pack,observation)})));
    if(matches.length!==1||!Array.isArray(matches[0].evidenceLeaves)||!matches[0].evidenceLeaves.length)reject();
    return matches[0];
  });
  const priorResults=new Map();
  for(const line of entry.output.split(/\r?\n/u)) {
    try {const result=JSON.parse(line).swarmforgeBrowserTargetResult;
      if(task.logicalTargetIds.includes(result?.id))priorResults.set(result.id,result);
    } catch { /* Ignore ordinary diagnostic lines. */ }
  }
  if(task.logicalTargetIds.some(id=>priorResults.get(id)?.status!=="passed"))reject();
  const parsed=parseBrowserObservationBatchOutput(entry.output,observations);
  const failedIds=parsed.failures.map(({id})=>id);
  if(!failedIds.length||new Set(failedIds).size!==failedIds.length||
      !entry.stderr.includes(`Browser observation batch failed: ${failedIds.join(", ")}`))reject();
  const unsigned={version:1,kind:"browser-observation-result",incidentId:incident.id,
    failureDigest:incident.failureDigest,
    sourceReceipt:{path:document.path,sha256:timeoutIncidentDigest(document.bytes),runId:receipt.runId},
    taskDigest:verificationTaskDigest(task),registryDigest:failure.registryDigest,
    planDigest:failure.planDigest,outputSha256:failure.outputSha256,stderrSha256:failure.stderrSha256,
    failedBoundaryDigest:timeoutIncidentDigest(failure.failedBoundary),
    boundary:{kind:"target",logicalTargetIds:failedIds,
      executionArgs:["scripts/run-browser-observation.mjs",...failedIds]}};
  return {...unsigned,digest:timeoutIncidentDigest(unsigned)};
}

export function validateObservationResultRepairProof(incident,proof,loaders) {
  const expected=deriveObservationResultRepairProof(incident,loaders);
  if(!same(proof,expected))reject();
  return expected;
}
