import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {assertFreshDist} from '../../scripts/dist-artifact.mjs';
import {distArtifactLockEnvironmentKey,distArtifactAccessEnvironmentKey} from '../../scripts/dist-artifact-lease.mjs';
import {verificationDigest} from '../../scripts/verification-evidence.mjs';
const exec=promisify(execFile);
export async function packagedTealium() {
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  const repair=context?.causalCategory==='other:Tealium package read lease';
  let pre;
  if(repair) {
    assert.equal(process.env[distArtifactAccessEnvironmentKey],'read');
    try {await exec(process.execPath,['scripts/package.mjs']);assert.fail('The old write must fail');}
    catch(error) {
      assert.match(error.stderr??'',/A read-only artifact lease cannot authorize write access/);
      pre={writeDenied:true};
    }
  }
  if(!process.env[distArtifactLockEnvironmentKey])
    await exec(process.execPath,['scripts/package.mjs'],{maxBuffer:4*1024*1024});
  const extensionRoot=await mkdtemp(path.resolve('tmp/tealium-package-'));
  const close=()=>rm(extensionRoot,{recursive:true,force:true});
  try {
    await exec('unzip',['-q',path.resolve('build/package/my-chrome-utilities.zip'),'-d',extensionRoot]);
    const packaged=await assertFreshDist({root:process.cwd(),distDirectory:extensionRoot});
    const current=await assertFreshDist({root:process.cwd()});
    assert.deepEqual(packaged,current,'The browser must use the current complete packaged artifact');
    if(repair) {
      const post={packageMatchesCurrentArtifact:true,leaseAccess:process.env[distArtifactAccessEnvironmentKey]};
      const fixture={id:'tealium-post-package-read-lease-v1',causalCategory:context.causalCategory,
        diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
        input:{packageCommand:['node','scripts/package.mjs'],artifactIdentity:current.buildIdentity},
        expectedPreRepairFailure:pre,expectedRepairResult:post};
      const fixtureDigest=verificationDigest(fixture);
      console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
        incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
        preRepairResult:{status:'failed',fixtureDigest,observed:pre},
        repairResult:{status:'passed',fixtureDigest,observed:post}}}));
    }
    return {extensionRoot,close};
  }catch(error){await close();throw error;}
}
