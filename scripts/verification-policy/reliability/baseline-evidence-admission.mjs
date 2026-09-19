import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";
import {lstat,readFile,realpath} from "node:fs/promises";
import path from "node:path";

const sha256Pattern=/^[a-f0-9]{64}$/u;
const sha1Pattern=/^[a-f0-9]{40}$/u;

function fail(message) {
  throw new Error(`Deterministic baseline admission ${message}`);
}

function exactKeys(value,expected) {
  return value&&typeof value==="object"&&!Array.isArray(value)&&
    JSON.stringify(Object.keys(value).sort())===JSON.stringify([...expected].sort());
}

function validTimestamp(value) {
  return typeof value==="string"&&!Number.isNaN(Date.parse(value));
}

function validateDiagnosticReceipt(receipt,{commit,tree,checkKey}) {
  const keys=["version","runIntent","commit","tree","toolchainDigest","checkKey",
    "relevantInputs","result","startedAt","completedAt"];
  if(!exactKeys(receipt,keys)||receipt.version!==1||receipt.runIntent!=="baseline-diagnostic"||
      receipt.commit!==commit||receipt.tree!==tree||receipt.checkKey!==checkKey||
      !sha256Pattern.test(receipt.toolchainDigest??"")||!Array.isArray(receipt.relevantInputs)||
      !receipt.relevantInputs.length||receipt.result?.status!=="failed"||
      !sha256Pattern.test(receipt.result?.failureDigest??"")||
      !validTimestamp(receipt.startedAt)||!validTimestamp(receipt.completedAt)) {
    fail("requires an authenticated complete diagnostic receipt");
  }
  const paths=receipt.relevantInputs.map(({path})=>path);
  if(new Set(paths).size!==paths.length||paths.some((path)=>typeof path!=="string"||!path)||
      receipt.relevantInputs.some(({digest})=>!sha256Pattern.test(digest??""))) {
    fail("requires a complete unique relevant input closure");
  }
  return receipt;
}

function validateSource(source) {
  if(typeof source?.path!=="string"||!source.path||
      !sha256Pattern.test(source?.sha256??"")||source.sha256!==source.authenticatedSha256) {
    fail("requires authenticated diagnostic source bytes");
  }
}

export async function baselineDiagnosticDocument(root,receiptPath) {
  const resolved=path.resolve(root,receiptPath);
  const receiptRoot=path.resolve(root,"tmp","verification-receipts");
  if(resolved!==receiptRoot&&!resolved.startsWith(`${receiptRoot}${path.sep}`)) {
    fail("source receipts must be under tmp/verification-receipts");
  }
  const details=await lstat(resolved);
  if(!details.isFile()||details.isSymbolicLink()||await realpath(resolved)!==resolved) {
    fail("source receipt must be a canonical regular file");
  }
  const bytes=await readFile(resolved);
  let receipt;
  try {receipt=JSON.parse(bytes);} catch {fail("source receipt is not valid JSON");}
  const sha256=timeoutIncidentDigest(bytes);
  return {receipt,source:{path:path.relative(root,resolved),sha256,authenticatedSha256:sha256}};
}

export function createDeterministicBaselineAdmission({
  incidentId,failureDigest,base,candidate,checkKey,baseReceipt,candidateReceipt,baseSource,candidateSource,
  evidenceTask,changeSetDigest,planDigest,selectedTaskKey,
}) {
  if(!incidentId||!sha256Pattern.test(failureDigest??"")||
      !sha1Pattern.test(base?.commit??"")||!sha1Pattern.test(base?.tree??"")||
      !sha1Pattern.test(candidate?.commit??"")||!sha1Pattern.test(candidate?.tree??"")||
      !checkKey||!evidenceTask||!selectedTaskKey||
      !sha256Pattern.test(changeSetDigest??"")||!sha256Pattern.test(planDigest??"")) {
    fail("requires exact task, incident, commit, tree, check, change-set, and plan identities");
  }
  validateDiagnosticReceipt(baseReceipt,{...base,checkKey});
  validateDiagnosticReceipt(candidateReceipt,{...candidate,checkKey});
  validateSource(baseSource);validateSource(candidateSource);
  if(baseReceipt.toolchainDigest!==candidateReceipt.toolchainDigest||
      timeoutIncidentDigest(baseReceipt.relevantInputs)!==
        timeoutIncidentDigest(candidateReceipt.relevantInputs)||
      baseReceipt.result.failureDigest!==candidateReceipt.result.failureDigest||
      failureDigest!==candidateReceipt.result.failureDigest) {
    fail("requires unchanged inputs and the same deterministic failure");
  }
  return {version:1,evidenceTask,incidentId,failureDigest,base:structuredClone(base),
    candidate:structuredClone(candidate),checkKey,selectedTaskKey,changeSetDigest,planDigest,
    toolchainDigest:baseReceipt.toolchainDigest,
    relevantInputsDigest:timeoutIncidentDigest(baseReceipt.relevantInputs),
    baseSource:{path:baseSource.path,sha256:baseSource.sha256,
      receiptDigest:timeoutIncidentDigest(baseReceipt)},
    candidateSource:{path:candidateSource.path,sha256:candidateSource.sha256,
      receiptDigest:timeoutIncidentDigest(candidateReceipt)}};
}

export function validateDeterministicBaselineAdmissionReceipt(receipt,admission) {
  if(admission?.version!==1||receipt?.candidate?.commit!==admission.candidate.commit||
      receipt?.candidate?.tree!==admission.candidate.tree||
      receipt?.candidate?.baseCommit!==admission.base.commit||
      receipt?.candidate?.evidenceTask!==admission.evidenceTask||
      receipt?.candidate?.changeSetDigest!==admission.changeSetDigest||
      receipt?.plan?.taskPlanDigest!==admission.planDigest) {
    fail("receipt binding is missing or changed");
  }
  if(!validTimestamp(receipt.startedAt)||!validTimestamp(receipt.completedAt)) {
    fail("requires a complete fresh review receipt");
  }
  const entries=Object.entries(receipt.tasks??{});
  if(!entries.length) fail("requires a complete selected plan");
  for(const [key,result] of entries) {
    if(result?.provenance!=="fresh") fail(`requires fresh result ${key}`);
    if(key===admission.selectedTaskKey) {
      if(result.status!=="failed"||result.reliabilityFailureDigest!==admission.failureDigest) {
        fail("requires the fresh matching admitted failure");
      }
    } else if(result.status!=="passed") fail(`does not admit additional failure ${key}`);
  }
  if(!Object.hasOwn(receipt.tasks,admission.selectedTaskKey)) {
    fail("requires the admitted check result");
  }
  const packageResult=entries.map(([,result])=>result)
    .find(({identity})=>identity?.stage==="package");
  if(packageResult?.status!=="passed"||packageResult.provenance!=="fresh") {
    fail("requires fresh package proof");
  }
  return admission;
}

export function deterministicBaselineDispositionValid(disposition) {
  return disposition?.basis==="deterministic-baseline"&&
    disposition.baselineAdmission?.version===1&&
    disposition.failureDigest===disposition.baselineAdmission.failureDigest;
}

export function validateStoredDeterministicBaselineProof(proof,{failureDigest}={}) {
  if(proof?.version!==1||proof.status!=="eligible"||proof.failureDigest!==failureDigest||
      !validTimestamp(proof.recordedAt)||
      proof.digest!==timeoutIncidentDigest({...proof,digest:undefined})) {
    fail("stored proof is malformed");
  }
  createDeterministicBaselineAdmission({...proof.binding,
    incidentId:proof.incidentId,
    failureDigest:proof.failureDigest,
    baseReceipt:proof.baseReceipt,candidateReceipt:proof.candidateReceipt,
    baseSource:proof.baseSource,candidateSource:proof.candidateSource});
  return proof;
}

export function deterministicBaselineAdmissionCandidates(incidents) {
  return incidents.filter((incident)=>incident.state==="unresolved"&&
    incident.deterministicBaselineProof?.status==="eligible");
}

export function buildDeterministicBaselineAdmission({incident,candidate,baseCommit,evidenceTask,
  changeSetDigest,planDigest}) {
  const proof=validateStoredDeterministicBaselineProof(incident.deterministicBaselineProof,
    {failureDigest:incident.failureDigest});
  const binding={...proof.binding,incidentId:incident.id,failureDigest:incident.failureDigest,
    candidate,base:{...proof.binding.base,commit:baseCommit},evidenceTask,changeSetDigest,planDigest};
  const admission=createDeterministicBaselineAdmission({...binding,
    baseReceipt:proof.baseReceipt,candidateReceipt:proof.candidateReceipt,
    baseSource:proof.baseSource,candidateSource:proof.candidateSource});
  if(timeoutIncidentDigest(admission)!==proof.admissionDigest) {
    fail("stored proof does not match the current review identities");
  }
  return admission;
}
