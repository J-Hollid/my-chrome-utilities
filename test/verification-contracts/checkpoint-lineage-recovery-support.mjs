import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createTimeoutIncidentStore} from '../../scripts/verification-reliability-incidents.mjs';
import {timeoutIncidentDigest as digest} from '../../scripts/verification-reliability-values.mjs';
import {validateIncident} from '../../scripts/verification-reliability-persistence.mjs';
import {validateInitialRepairCheckpoint} from '../../scripts/verification-policy/reliability/eligible-repair-checkpoint-correction.mjs';
import {buildEligibleRepairAdmissions} from '../../scripts/verification-policy/reliability/eligible-repair-admission.mjs';
import {loadVerificationPacks,planVerification} from '../../scripts/verification-packs.mjs';

export async function checkCheckpointLineageRecovery() {
  const root=await mkdtemp(path.resolve('tmp/checkpoint-lineage-'));
  const storeDirectory=path.join(root,'incidents');
  const receiptPath='tmp/verification-receipts/source.json';
  const candidate={commit:'a'.repeat(40),tree:'b'.repeat(40),
    baseCommit:'c'.repeat(40),evidenceTask:'tealium-live'};
  const plan={mode:'exact',tasks:['build:dist']};
  const artifact={inputDigest:'d'.repeat(64),outputDigest:'e'.repeat(64)};
  const receipt={version:2,runId:'source-run',candidate,plan,artifact,
    tasks:{'build:dist':{status:'passed',provenance:'fresh'}}};
  const bytes=Buffer.from(JSON.stringify(receipt)+'\n');
  const expected={receiptSha256:digest(bytes),runId:receipt.runId,...candidate};
  const boundary={kind:'checkpoint-identity',operation:'artifact-binding',stage:null,
    trackedChanges:['M dist/manifest.json']};
  const failure={failureClass:'execution-contract-failure',fingerprint:'f'.repeat(64),
    runnerRunId:receipt.runId,sourceReceipt:receiptPath,
    lineage:{commit:candidate.commit,tree:candidate.tree},planDigest:digest(plan),artifact,
    task:{key:'promotion:artifact-binding',stage:'promotion',executable:'internal',args:[]},
    failedBoundary:boundary,executionPrerequisite:{code:'IDENTITY_DRIFT',operation:boundary}};
  try {
    await mkdir(path.dirname(path.join(root,receiptPath)),{recursive:true});
    await writeFile(path.join(root,receiptPath),bytes);
    const store=createTimeoutIncidentStore({root,storeDirectory});
    const original=await store.read((await store.create(failure)).id);
    assert.throws(()=>validateInitialRepairCheckpoint(original,
      {baseCommit:candidate.baseCommit,evidenceTask:candidate.evidenceTask}),/failure lineage/);
    for(const field of ['receiptSha256','runId','commit','tree','baseCommit','evidenceTask']) {
      await assert.rejects(()=>store.recoverCheckpointLineage(original.id,{receiptPath,
        expected:{...expected,[field]:'wrong'}}),/checkpoint lineage/i,field);
    }
    await assert.rejects(()=>store.recoverCheckpointLineage(original.id,
      {receiptPath:'tmp/verification-receipts/missing.json',expected}),/ENOENT/);
    await writeFile(path.join(root,receiptPath),Buffer.concat([bytes,Buffer.from(' ')]));
    await assert.rejects(()=>store.recoverCheckpointLineage(original.id,
      {receiptPath,expected}),/checkpoint lineage/i);
    await writeFile(path.join(root,receiptPath),bytes);
    for(const change of [f=>{f.planDigest='0'.repeat(64);},
      f=>{f.artifact.outputDigest='0'.repeat(64);},
      f=>{f.failedBoundary.operation='other';},
      f=>{f.lineage.baseCommit='0'.repeat(40);}]) {
      const changed=structuredClone(failure);change(changed);
      const other=await store.create(changed);
      await assert.rejects(()=>store.recoverCheckpointLineage(other.id,
        {receiptPath,expected}),/checkpoint lineage/i);
    }
    const recovered=await store.recoverCheckpointLineage(original.id,{receiptPath,expected});
    assert.deepEqual(recovered.failure,original.failure);
    assert.equal(recovered.failureDigest,original.failureDigest);
    assert.equal(recovered.state,'unresolved');
    assert.equal(recovered.repair,undefined,'Metadata recovery is not causal repair');
    assert.equal(recovered.checkpointLineageRecovery.receiptUtf8,bytes.toString('utf8'));
    const checkpoint={baseCommit:candidate.baseCommit,evidenceTask:candidate.evidenceTask};
    assert.deepEqual(validateInitialRepairCheckpoint(recovered,checkpoint),checkpoint);
    await assert.rejects(()=>store.recoverCheckpointLineage(original.id,
      {receiptPath,expected}),/already/i);
    await rm(path.join(root,receiptPath));
    const reloaded=await createTimeoutIncidentStore({root,storeDirectory}).read(original.id);
    assert.deepEqual(validateInitialRepairCheckpoint(reloaded,checkpoint),checkpoint,
      'Reload uses durable original receipt bytes, not the removed temporary file');
    const packs=await loadVerificationPacks();
    const plan=planVerification(packs,{packIds:['verification_process']});
    const key='unit:test/verification-contracts/eligible-repair-checkpoint-base-correction-support.mjs';
    const repairedCandidate={commit:'1'.repeat(40),tree:'2'.repeat(40)};
    const eligible={...reloaded,repair:{status:'eligible',candidate:repairedCandidate,checkpoint,
      causalCategory:'other:checkpoint identity lineage',causalExplanation:'The delivered manifest is committed.',
      regression:{key,status:'passed',commit:repairedCandidate.commit,receiptSha256:'3'.repeat(64)},
      focusedReceipt:{status:'passed',commit:repairedCandidate.commit,provenance:'fresh',receiptSha256:'3'.repeat(64)},
      causalProtocol:{version:2,incidentId:reloaded.id,failureDigest:reloaded.failureDigest,
        preRepairResult:{status:'failed'},repairResult:{status:'passed'}}}};
    const admissionInput={incidents:[eligible],plan,packs,candidate:repairedCandidate,
      ...checkpoint,changeSetDigest:'4'.repeat(64),planDigest:'5'.repeat(64)};
    const admission=await buildEligibleRepairAdmissions(admissionInput);
    assert.equal(admission.entries[0].incidentId,reloaded.id);
    const changedAdmission=structuredClone(eligible);
    changedAdmission.checkpointLineageRecovery.receiptUtf8+=' ';
    await assert.rejects(()=>buildEligibleRepairAdmissions({...admissionInput,
      incidents:[changedAdmission]}),/checkpoint lineage/i);
    for(const mutate of [i=>{i.checkpointLineageRecovery.receiptUtf8+=' ';},
      i=>{i.checkpointLineageRecovery.checkpoint.baseCommit='0'.repeat(40);},
      i=>{i.transitions.at(-1).proofDigest='0'.repeat(64);},
      i=>{i.failure.lineage.baseCommit='0'.repeat(40);i.failureDigest=digest(i.failure);}]) {
      const changed=structuredClone(reloaded);mutate(changed);
      assert.throws(()=>validateIncident(changed),/checkpoint lineage/i);
      assert.throws(()=>validateInitialRepairCheckpoint(changed,checkpoint),/checkpoint lineage/i);
    }
    const envelope=JSON.parse(await readFile(path.join(storeDirectory,original.id+'.json'),'utf8'));
    envelope.incident.checkpointLineageRecovery.receiptUtf8+=' ';
    envelope.digest=digest(envelope.incident);
    await writeFile(path.join(storeDirectory,original.id+'.json'),JSON.stringify(envelope));
    await assert.rejects(()=>store.read(original.id),/checkpoint lineage/i);
    console.log('Checkpoint lineage recovery preserves failure bytes and rejects changed evidence');
  } finally {await rm(root,{recursive:true,force:true});}
}
