import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {timeoutIncidentDigest as digest} from '../../../scripts/verification-reliability-values.mjs';
const result=execFileSync('bb',['test/utility-tab-expansion/navigation-icons/choice-dispatch.clj'],{encoding:'utf8'});
const observed=JSON.parse(result.trim().split('\n').at(-1)).tealiumChoiceDispatch;
assert.deepEqual(observed.after.actions,['Go to u.extend','Go to u.send']);
assert.equal(observed.after.replay.length,4);
const feature='features/tealium-source-navigation.feature',commit='5eb7aa01';
const previous=execFileSync('git',['show',`${commit}:${feature}`],{encoding:'utf8'});
const current=readFileSync(feature,'utf8');
// Tool-owned mutation comments do not change the acceptance contract.
const contract=text=>text.split('\n').filter(line=>!line.trimStart().startsWith('#')).join('\n').trim();
assert.equal(contract(current),contract(previous.replace('When the user chooses <action>','When the user chooses Tealium source action <action>')));
const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
if(raw){
 const context=JSON.parse(raw);
 if(context.causalCategory==='other:Tealium source choice dispatch'){
  const fixture={id:'tealium-source-choice-dispatch-v1',causalCategory:context.causalCategory,
   diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{commit,feature,sourceDigest:digest(previous)},
   expectedPreRepairFailure:observed.before,expectedRepairResult:observed.after};
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
   incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
   preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:observed.before},
   repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:observed.after}}}));
 }
}
console.log(JSON.stringify({tealiumChoiceDispatch:observed.after}));
