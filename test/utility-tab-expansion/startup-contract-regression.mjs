import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verificationDigest as digest} from '../../scripts/verification-evidence/core.mjs';

export function verifyStartupContract(sidePanelSource,workspaceEntrySource) {
  assert.match(sidePanelSource,/await mountInstalledUtilityWorkspace\(\)/u,
    'the stable composition root must mount the installed utility workspace');
  assert.match(workspaceEntrySource,
    /await mountInstalledDataLayerRuntime\(document, localStorage, workspace\.tabs\)/u,
    'the workspace entry must mount the installed data-layer runtime with shared navigation');
  if(!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if(context.causalCategory!=='other:utility entry composition contract')return;
  const oldSource=execFileSync('git',['show',
    'b23a09be:test/live-target-permission-recovery-preparation-contract-test.mjs'],{encoding:'utf8'});
  const start=oldSource.indexOf('assert.match(sidePanelSource, /mountInstalledDataLayerRuntime/u,');
  assert.ok(start>=0,'the recorded failed candidate must contain the original assertion');
  const end=oldSource.indexOf(';',start)+1;
  const originalCheck=new Function('assert','sidePanelSource',oldSource.slice(start,end));
  assert.throws(()=>originalCheck(assert,sidePanelSource),
    /the stable composition root must mount the installed data-layer runtime/u);
  const before={directMountContract:'failed'},after={workspaceMountContract:'passed'};
  const fixture={id:'utility-entry-composition-contract-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{failedCandidate:'b23a09be',entry:'src/side-panel.ts',adapter:'src/utility-host/installed-entry.ts'},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
