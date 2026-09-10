import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {copyFile,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createDistInputFingerprint} from '../../dist-artifact.mjs';
import {createRepositoryCheckpointIdentityGuard} from '../../run-focused-acceptance.mjs';
import {createTimeoutIncidentStore} from '../../verification-reliability-incidents.mjs';
import {timeoutIncidentDigest as digest} from '../../verification-reliability-values.mjs';

export async function checkGeneratedManifestSettlement() {
  const root=await mkdtemp(path.resolve('tmp/checkpoint-manifest-'));
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  try {
    const current=await readFile('manifest.json','utf8');
    const omitted=execFileSync('git',['show',
      '08bcdb764c13b0106bc5880ee3a12c49be419454:dist/manifest.json'],{encoding:'utf8'});
    assert.equal(JSON.parse(omitted).devtools_page,undefined);
    assert.equal(JSON.parse(current).devtools_page,'tealium/devtools/index.html');
    await mkdir(path.join(root,'dist'));
    await writeFile(path.join(root,'manifest.json'),current);
    await writeFile(path.join(root,'dist/manifest.json'),omitted);
    git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Test');
    git('add','.');git('commit','-qm','source activation without generated manifest');
    const base=git('rev-parse','HEAD');
    const inputOptions={inputPaths:['manifest.json'],toolchain:{node:process.versions.node}};
    const input=await createDistInputFingerprint({root,...inputOptions});
    const guard=()=>{
      const candidate={commit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),
        baseCommit:base,evidenceTask:'tealium-live'};
      return createRepositoryCheckpointIdentityGuard({repositoryRoot:root,
        expected:{commit:candidate.commit,tree:candidate.tree,
          artifactInputDigest:input.inputDigest??input.digest,
          artifactOutputDigest:null,artifactBuildIdentity:null},
        context:{receiptPath:path.join(root,'tmp/verification-receipts/source.json'),
          receipt:{runId:'generated-manifest-run',candidate,environment:{},plan:{mode:'exact'},artifactInput:input}},
        attemptId:'generated-manifest',inputFingerprintOptions:inputOptions});
    };
    const beforeGuard=guard();
    await beforeGuard.assertBefore({kind:'artifact-binding'});
    await copyFile(path.join(root,'manifest.json'),path.join(root,'dist/manifest.json'));
    await assert.rejects(()=>beforeGuard.assertBefore({kind:'artifact-binding'}),/identity drift/);
    const incidents=await createTimeoutIncidentStore({root}).list();
    assert.equal(incidents.length,1);
    const failure=incidents[0].failure;
    assert.equal(failure.lineage.baseCommit,base,'Future recording retains the checkpoint base');
    assert.equal(failure.lineage.evidenceTask,'tealium-live','Future recording retains the task');
    const before={trackedManifestDrift:failure.failedBoundary.trackedChanges
      .some(line=>line.trim()==='M dist/manifest.json')};
    assert.deepEqual(before,{trackedManifestDrift:true});
    git('add','dist/manifest.json');git('commit','-qm','include generated activation');
    const clean=await guard().assertBefore({kind:'artifact-binding'});
    const repaired={trackedManifestDrift:Boolean(clean.trackedChanges)};
    assert.deepEqual(repaired,{trackedManifestDrift:false});
    const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
      ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
    if(context?.causalCategory==='other:checkpoint identity lineage') {
      const fixture={id:'tealium-generated-manifest-settlement-v1',causalCategory:context.causalCategory,
        diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{omittedManifestSha256:digest(Buffer.from(omitted)),deliveredManifestSha256:digest(Buffer.from(current)),
          operation:'artifact-binding',changedPath:'dist/manifest.json'},
        expectedPreRepairFailure:{trackedManifestDrift:true},expectedRepairResult:{trackedManifestDrift:false}};
      const fixtureDigest=digest(fixture);
      console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
        incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
        preRepairResult:{status:'failed',fixtureDigest,observed:before},
        repairResult:{status:'passed',fixtureDigest,observed:repaired}}}));
    }
    console.log('The production checkpoint guard rejects omitted generated activation and accepts its committed artifact');
  } finally {await rm(root,{recursive:true,force:true});}
}
