import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';
export const iconFeatures=['utility-navigation-icons','utility-navigation-icons-runtime']
 .map(name=>`features/${name}.feature`).sort();
export const iconKeys=iconFeatures.flatMap(file=>['parse','generate'].map(stage=>`acceptance-${stage}:${file}`)).sort();
export const iconRegistryCommit='511bb177';
let recorded=false;
export function recordIconTaskRepair(kind,actual,expected,oldExpected) {
 const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;if(!raw)return;
 const context=JSON.parse(raw);if(context.causalCategory!=='other:icon task conservation'||recorded)return;
 const wanted=context.diagnosedBoundary.taskKey?.endsWith('/registration-test.mjs')?'session':'host';
 if(kind!==wanted)return;
 const failedCommit='12d34304';
 const path=`scripts/verification-planner/manifest-declarations/${kind==='host'?'isolation':'historical-conservation'}.mjs`;
 const source=execFileSync('git',['show',`${failedCommit}:${path}`],{encoding:'utf8'});
 let previous=oldExpected;
 if(kind==='host') {
  const start=source.indexOf('const hostUnits='),end=source.indexOf('const keys=',start);
  assert.ok(start>=0&&end>start);previous=new Function(`${source.slice(start,end)};return hostKeys;`)();
 }
 assert.throws(()=>assert.deepEqual(actual,previous),assert.AssertionError);
 assert.deepEqual(actual,expected);recorded=true;
 const before={accepted:false,expected:previous,actual},after={accepted:true,actual};
 const fixture={id:`icon-${kind}-task-conservation-v1`,causalCategory:context.causalCategory,
  diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{failedCommit,path,sourceDigest:digest(source)},
  expectedPreRepairFailure:before,expectedRepairResult:after};
 console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
  incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
  preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:before},
  repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:after}}}));
}
