import {normalized,timeoutIncidentDigest as digest} from '../../verification-reliability-values.mjs';

const sha=/^[a-f0-9]{64}$/u;
const commit=/^[a-f0-9]{40}$/u;
const task=/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const same=(a,b)=>JSON.stringify(normalized(a))===JSON.stringify(normalized(b));
const invalid=()=>new Error('Checkpoint lineage recovery evidence is missing, changed, or conflicting');

function recoveredCheckpoint(incident,receiptUtf8,expected) {
  const failure=incident.failure;
  if(typeof receiptUtf8!=='string'||!expected||!sha.test(expected.receiptSha256??'')||
      !commit.test(expected.commit??'')||!commit.test(expected.tree??'')||
      !commit.test(expected.baseCommit??'')||!task.test(expected.evidenceTask??'')||
      typeof expected.runId!=='string'||!expected.runId||
      digest(Buffer.from(receiptUtf8,'utf8'))!==expected.receiptSha256||
      incident.failureDigest!==digest(failure)) throw invalid();
  let receipt;
  try {receipt=JSON.parse(receiptUtf8);} catch {throw invalid();}
  const checkpoint={baseCommit:expected.baseCommit,evidenceTask:expected.evidenceTask};
  const boundary=failure?.failedBoundary;
  if(receipt.version!==2||receipt.runId!==expected.runId||
      failure.runnerRunId!==expected.runId||
      receipt.candidate?.commit!==expected.commit||receipt.candidate?.tree!==expected.tree||
      failure.lineage?.commit!==expected.commit||failure.lineage?.tree!==expected.tree||
      !same({baseCommit:receipt.candidate?.baseCommit,evidenceTask:receipt.candidate?.evidenceTask},checkpoint)||
      !receipt.plan||digest(receipt.plan)!==failure.planDigest||
      !sha.test(failure.artifact?.inputDigest??'')||
      !same(receipt.artifact??receipt.artifactInput??null,failure.artifact)||
      failure.failureClass!=='execution-contract-failure'||
      failure.task?.key!=='promotion:artifact-binding'||failure.task?.stage!=='promotion'||
      boundary?.kind!=='checkpoint-identity'||boundary.operation!=='artifact-binding'||
      failure.executionPrerequisite?.code!=='IDENTITY_DRIFT'||
      !same(failure.executionPrerequisite.operation,boundary)||
      receipt.tasks?.['build:dist']?.status!=='passed') throw invalid();
  for(const field of ['baseCommit','evidenceTask']) {
    if(failure.lineage[field]!==undefined&&failure.lineage[field]!==checkpoint[field]) throw invalid();
  }
  if(failure.lineage.baseCommit!==undefined&&failure.lineage.evidenceTask!==undefined) throw invalid();
  return checkpoint;
}

export function createCheckpointLineageRecovery(incident,{receiptUtf8,sourceReceipt,expected,recordedAt}) {
  if(incident.checkpointLineageRecovery) throw new Error('Checkpoint lineage is already recovered');
  if(incident.state!=='unresolved'||incident.repair||sourceReceipt!==incident.failure.sourceReceipt||
      !Number.isFinite(Date.parse(recordedAt))) throw invalid();
  const checkpoint=recoveredCheckpoint(incident,receiptUtf8,expected);
  const proof={version:1,incidentId:incident.id,failureDigest:incident.failureDigest,
    sourceReceipt,receiptUtf8,expected:structuredClone(expected),checkpoint,recordedAt};
  return {...proof,digest:digest(proof)};
}

export function validateCheckpointLineageRecovery(incident) {
  const proof=incident.checkpointLineageRecovery;
  const transitions=(incident.transitions??[]).filter(t=>t.type==='checkpoint-lineage-recovered');
  if(proof===undefined) {
    if(transitions.length) throw invalid();
    return undefined;
  }
  const {digest:proofDigest,...unsigned}=proof;
  if(proof.version!==1||proof.incidentId!==incident.id||proof.failureDigest!==incident.failureDigest||
      proof.sourceReceipt!==incident.failure.sourceReceipt||!sha.test(proofDigest??'')||
      proofDigest!==digest(unsigned)||!Number.isFinite(Date.parse(proof.recordedAt))||
      transitions.length!==1||transitions[0].proofDigest!==proofDigest||
      transitions[0].at!==proof.recordedAt) throw invalid();
  const checkpoint=recoveredCheckpoint(incident,proof.receiptUtf8,proof.expected);
  if(!same(checkpoint,proof.checkpoint)) throw invalid();
  return checkpoint;
}

export function effectiveFailureCheckpoint(incident) {
  return validateCheckpointLineageRecovery(incident)??{
    baseCommit:incident?.failure?.lineage?.baseCommit,
    evidenceTask:incident?.failure?.lineage?.evidenceTask,
  };
}

export function checkpointIdentityCausalKey(incident) {
  const checkpoint=effectiveFailureCheckpoint(incident),failure=incident.failure;
  if(failure?.failureClass!=='execution-contract-failure'||
      failure.task?.key!=='promotion:artifact-binding'||
      failure.failedBoundary?.kind!=='checkpoint-identity'||
      failure.failedBoundary.operation!=='artifact-binding'||
      !commit.test(checkpoint.baseCommit??'')||!task.test(checkpoint.evidenceTask??'')||
      incident.failureDigest!==digest(failure)) return undefined;
  return digest({failureDigest:incident.failureDigest,task:failure.task,
    boundary:failure.failedBoundary,checkpoint});
}
