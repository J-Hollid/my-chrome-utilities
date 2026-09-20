import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";
import {completeTaskInputClosure} from "../../verification-reliability-closure.mjs";
import {authenticateBaselineDiagnosticPair} from "./baseline-diagnostic-authentication.mjs";
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
  const keys=["version","runIntent","commit","tree","toolchainDigest","checkKey","task","taskDigest",
    "relevantInputs","result","startedAt","completedAt"];
  if(!exactKeys(receipt,keys)||receipt.version!==1||receipt.runIntent!=="baseline-diagnostic"||
      receipt.commit!==commit||receipt.tree!==tree||receipt.checkKey!==checkKey||
      !sha256Pattern.test(receipt.toolchainDigest??"")||receipt.task?.key!==checkKey||
      typeof receipt.task?.executable!=="string"||!Array.isArray(receipt.task?.args)||
      !sha256Pattern.test(receipt.taskDigest??"")||
      receipt.result?.status!=="failed"||
      !sha256Pattern.test(receipt.result?.failureDigest??"")||
      !validTimestamp(receipt.startedAt)||!validTimestamp(receipt.completedAt)) {
    fail("requires an authenticated complete diagnostic receipt");
  }
  try {completeTaskInputClosure(receipt.relevantInputs);} catch {fail("requires a complete relevant input closure");}
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
  diagnosticBase=base,diagnosticCandidate=candidate,
}) {
  if(!incidentId||!sha256Pattern.test(failureDigest??"")||
      !sha1Pattern.test(base?.commit??"")||!sha1Pattern.test(base?.tree??"")||
      !sha1Pattern.test(candidate?.commit??"")||!sha1Pattern.test(candidate?.tree??"")||
      !checkKey||!evidenceTask||!selectedTaskKey||
      !sha256Pattern.test(changeSetDigest??"")||!sha256Pattern.test(planDigest??"")) {
    fail("requires exact task, incident, commit, tree, check, change-set, and plan identities");
  }
  validateDiagnosticReceipt(baseReceipt,{...diagnosticBase,checkKey});
  validateDiagnosticReceipt(candidateReceipt,{...diagnosticCandidate,checkKey});
  validateSource(baseSource);validateSource(candidateSource);
  if(baseReceipt.taskDigest!==timeoutIncidentDigest(baseReceipt.task)||
      candidateReceipt.taskDigest!==timeoutIncidentDigest(candidateReceipt.task)||
      baseReceipt.taskDigest!==candidateReceipt.taskDigest||
      baseReceipt.toolchainDigest!==candidateReceipt.toolchainDigest||
      completeTaskInputClosure(baseReceipt.relevantInputs).digest!==
        completeTaskInputClosure(candidateReceipt.relevantInputs).digest||
      baseReceipt.result.failureDigest!==candidateReceipt.result.failureDigest) {
    fail("requires unchanged inputs and the same deterministic failure");
  }
  return {version:1,evidenceTask,incidentId,failureDigest,base:structuredClone(base),
    candidate:structuredClone(candidate),checkKey,selectedTaskKey,changeSetDigest,planDigest,
    toolchainDigest:baseReceipt.toolchainDigest,taskDigest:baseReceipt.taskDigest,
    diagnosticFailureDigest:baseReceipt.result.failureDigest,
    relevantInputsDigest:completeTaskInputClosure(baseReceipt.relevantInputs).digest,
    baseSource:{path:baseSource.path,sha256:baseSource.sha256,
      receiptDigest:timeoutIncidentDigest(baseReceipt)},
    candidateSource:{path:candidateSource.path,sha256:candidateSource.sha256,
      receiptDigest:timeoutIncidentDigest(candidateReceipt)}};
}

export function validateDeterministicBaselineAdmissionReceipt(receipt,admission) {
  if(deterministicBaselineAdmissionEntries(admission).length===0||
      receipt?.candidate?.commit!==admission.candidate.commit||
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
      if(result.status!=="failed"||
          result.deterministicBaselineFailureIdentity!==admission.diagnosticFailureDigest) {
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
  const storedAdmission=createDeterministicBaselineAdmission({...proof.binding,
    incidentId:proof.incidentId,
    failureDigest:proof.failureDigest,
    baseReceipt:proof.baseReceipt,candidateReceipt:proof.candidateReceipt,
    baseSource:proof.baseSource,candidateSource:proof.candidateSource});
  if(timeoutIncidentDigest(storedAdmission)!==proof.admissionDigest) {
    fail("stored proof does not match its recorded identities");
  }
  return proof;
}

export async function authenticateStoredDeterministicBaselineProof(root,proof,{execute}={}) {
  const [baseDocument,candidateDocument]=await Promise.all([
    baselineDiagnosticDocument(root,proof.baseSource.path),
    baselineDiagnosticDocument(root,proof.candidateSource.path),
  ]);
  if(baseDocument.source.sha256!==proof.baseSource.sha256||
      candidateDocument.source.sha256!==proof.candidateSource.sha256) {
    fail("stored source bytes changed");
  }
  await authenticateBaselineDiagnosticPair({root,baseDocument,candidateDocument,execute});
  return {baseDocument,candidateDocument};
}

export function deterministicBaselineAdmissionCandidates(incidents) {
  return incidents.filter((incident)=>incident.state==="unresolved"&&
    incident.deterministicBaselineProof?.status==="eligible");
}

function deterministicBaselineEquivalenceIdentity(admission) {
  if(!admission||admission.version!==1)return null;
  const {incidentId:ignoredIncidentId,failureDigest:ignoredFailureDigest,
    equivalentAdmissions:ignoredEquivalentAdmissions,...identity}=admission;
  return identity;
}

export function deterministicBaselineAdmissionsEquivalent(left,right) {
  const leftIdentity=deterministicBaselineEquivalenceIdentity(left);
  const rightIdentity=deterministicBaselineEquivalenceIdentity(right);
  return Boolean(leftIdentity&&rightIdentity&&
    timeoutIncidentDigest(leftIdentity)===timeoutIncidentDigest(rightIdentity));
}

export function deterministicBaselineAdmissionEntries(admission) {
  if(!admission)return [];
  const entries=[admission,...(admission.equivalentAdmissions??[])];
  if(!entries.every((entry)=>deterministicBaselineAdmissionsEquivalent(admission,entry)))return [];
  const incidentIds=entries.map(({incidentId})=>incidentId);
  return new Set(incidentIds).size===incidentIds.length?entries:[];
}

export function deterministicBaselineAdmissionCoversIncident(admission,incident,commit) {
  return deterministicBaselineAdmissionEntries(admission).some((entry)=>
    entry.candidate?.commit===commit&&entry.selectedTaskKey===incident?.failure?.task?.key&&
    entry.incidentId===incident.id&&entry.failureDigest===incident.failureDigest);
}

export async function buildDeterministicBaselineAdmission({incident,candidate,baseCommit,evidenceTask,
  changeSetDigest,planDigest,root,execute}) {
  const proof=validateStoredDeterministicBaselineProof(incident.deterministicBaselineProof,
    {failureDigest:incident.failureDigest});
  if(!root)fail("consumption requires a repository root");
  const authenticated=await authenticateStoredDeterministicBaselineProof(root,proof,{execute});
  const binding={...proof.binding,incidentId:incident.id,failureDigest:incident.failureDigest,
    candidate,base:{...proof.binding.base,commit:baseCommit},evidenceTask,changeSetDigest,planDigest};
  const admission=createDeterministicBaselineAdmission({...binding,
    diagnosticBase:proof.binding.base,diagnosticCandidate:proof.binding.candidate,
    baseReceipt:authenticated.baseDocument.receipt,
    candidateReceipt:authenticated.candidateDocument.receipt,
    baseSource:authenticated.baseDocument.source,candidateSource:authenticated.candidateDocument.source});
  return admission;
}
