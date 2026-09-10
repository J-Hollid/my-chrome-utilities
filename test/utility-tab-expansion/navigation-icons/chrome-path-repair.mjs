import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createTealiumChromeTemporaryDirectory} from '../../tealium/browser.mjs';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';
export async function recordChromePathRepair() {
 const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;if(!raw)return;
 const context=JSON.parse(raw);if(context.causalCategory!=='other:icon Chrome socket path')return;
 const commit='899b93f1',sourcePath='test/tealium/browser.mjs';
 const source=execFileSync('git',['show',`${commit}:${sourcePath}`],{encoding:'utf8'});
 assert.ok(source.includes("mkdtemp(path.join(chromeTemporaryRoot,'tealium-'))"));
 const root=process.env.SWARMFORGE_CHROME_TMPDIR;assert.ok(root);
 const temporary=await createTealiumChromeTemporaryDirectory();
 assert.equal(temporary.directory,root);assert.equal(temporary.owned,false);
 const socket='com.google.Chrome.123456/SingletonSocket';
 const previous=Buffer.byteLength(path.join(root,'tealium-123456',socket));
 const current=Buffer.byteLength(path.join(temporary.directory,socket));
 assert.ok(previous>107);assert.ok(current<=107);
 const before={accepted:false,socketBytes:previous},after={accepted:true,socketBytes:current,runnerOwnsCleanup:true};
 const fixture={id:'icon-Chrome-socket-path-v1',causalCategory:context.causalCategory,
  diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{commit,sourcePath,sourceDigest:digest(source),root},
  expectedPreRepairFailure:before,expectedRepairResult:after};
 console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
  incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
  preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:before},
  repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:after}}}));
}
