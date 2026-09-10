import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';
let emitted=false;
export async function emitIconCompanionRepair(socket,evaluate,measure) {
 const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
 if(!raw||emitted)return;
 const context=JSON.parse(raw);
 if(context.causalCategory!=='other:icon companion geometry')return;
 const commit='c65fafd8',path='test/support/side-panel-companion/measure.mjs';
 const source=execFileSync('git',['show',`${commit}:${path}`],{encoding:'utf8'}).replace('export function','function');
 await evaluate(socket,'document.getElementById("workspace-tab-data-layer").focus()');
 const old=await evaluate(socket,`(()=>{${source};return measureCompanion();})()`);
 const current=await evaluate(socket,`(${measure.toString()})()`);
 const prior=old.controls.find(c=>c.id==='workspace-tab-data-layer');
 const actual=current.controls.find(c=>c.id==='workspace-tab-data-layer');
 assert.equal(prior.clipped,true);assert.equal(prior.radius,8);
 assert.equal(actual.utilityIcon,true);assert.equal(actual.clipped,false);assert.equal(actual.radius,8);
 emitted=true;
 const before={accepted:false,control:prior},after={accepted:true,control:actual};
 const fixture={id:'icon-companion-visible-tooltip-v1',causalCategory:context.causalCategory,
  diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{commit,path,sourceDigest:digest(source)},
  expectedPreRepairFailure:before,expectedRepairResult:after};
 console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
  incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
  preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:before},
  repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:after}}}));
}
