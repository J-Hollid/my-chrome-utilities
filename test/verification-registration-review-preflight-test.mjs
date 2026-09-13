import assert from 'node:assert/strict';
import {prepareReviewBinding,validatePreparedReview} from
  '../scripts/verification-review-preparation.mjs';
import {auditLoadedStepRoutes,compareGovernedTaskPopulation} from
  '../scripts/verification-registration-preflight.mjs';
import {commandTask} from '../scripts/verification-planner/tasks/planner.mjs';

const commits={work:'1'.repeat(40),spec:'2'.repeat(40),evidence:'3'.repeat(40),candidate:'4'.repeat(40)};
const tree='5'.repeat(40);
const paths=new Map([
  [commits.evidence,['src/tool.ts','docs/spec.md']],
  [commits.spec,['src/tool.ts']],
]);
const input={task:'verification-registration-review-preflight',receivedWorkBase:commits.work,
  specificationCommit:commits.spec,evidenceBase:commits.evidence,handoffBase:commits.spec,
  candidateCommit:commits.candidate,candidateTree:tree,packIds:['shell','verification_process']};
const services={resolveCommit:async value=>value,isAncestor:async()=>true,
  changedPaths:async base=>paths.get(base)};

await assert.rejects(()=>prepareReviewBinding(input,services),error=>
  /Evidence base 3333.+handoff base 2222.+docs\/spec\.md/su.test(error.message));
const valid=await prepareReviewBinding({...input,handoffBase:commits.evidence},services);
assert.equal(valid.reviewReadyProof,false);
assert.deepEqual(valid.verification,{baseCommit:commits.evidence,packIds:['shell','verification_process'],
  task:input.task});
assert.equal(valid.recordReview.baseCommit,commits.evidence);
assert.equal(valid.handoff.baseCommit,commits.evidence);
assert.equal(validatePreparedReview(valid,{candidateCommit:commits.candidate,candidateTree:tree,
  evidenceBase:commits.evidence,handoffBase:commits.evidence}),true);
assert.throws(()=>validatePreparedReview(valid,{candidateCommit:commits.candidate,candidateTree:'6'.repeat(40),
  evidenceBase:commits.evidence,handoffBase:commits.evidence}),/candidate tree changed/u);
assert.throws(()=>validatePreparedReview(valid,{candidateCommit:commits.candidate,candidateTree:tree,
  evidenceBase:commits.spec,handoffBase:commits.evidence}),/evidence base changed/u);
assert.throws(()=>validatePreparedReview(valid,{candidateCommit:commits.candidate,candidateTree:tree,
  evidenceBase:commits.evidence,handoffBase:commits.spec}),/handoff base changed/u);

const canonicalBase='6f58bf54e05ab657747a3a4db85f4860d0eaff1b';
const equivalentServices={...services,
  resolveCommit:async value=>value==='6f58bf54e0'?canonicalBase:value,
  changedPaths:async()=>['src/tool.ts']};
const equivalent=await prepareReviewBinding({...input,receivedWorkBase:'6f58bf54e0',
  evidenceBase:'6f58bf54e0',handoffBase:canonicalBase},equivalentServices);
assert.equal(equivalent.evidenceBase,canonicalBase);
assert.equal(equivalent.handoffBase,canonicalBase);

const calls={changedPaths:0,expensive:0,records:0};
const mismatchServices={...services,changedPaths:async base=>{
  calls.changedPaths+=1;
  return base===commits.evidence?['src/tool.ts','docs/spec.md']:['src/tool.ts'];
}};
await assert.rejects(()=>prepareReviewBinding(input,mismatchServices),/docs\/spec\.md/u);
assert.deepEqual(calls,{changedPaths:2,expensive:0,records:0});
const feature={path:'features/example.feature',scenarios:[{name:'route',steps:['a step']}]};
assert.equal(auditLoadedStepRoutes({packId:'shell',features:[feature],loadedRoutes:[]})[0].result,
  'missing registration');
assert.equal(auditLoadedStepRoutes({packId:'shell',features:[feature],loadedRoutes:[
  {pattern:/a step/u},{pattern:/a .+/u}]})[0].result,'ambiguous registration');
assert.deepEqual(auditLoadedStepRoutes({packId:'shell',features:[feature],loadedRoutes:[
  {pattern:/a step/u}]}),[]);
const missingShellFeatures=['modular-acceptance-execution','modular-browser-runtime-adapters',
  'modular-chrome-utility-architecture'].map(name=>({path:`features/${name}.feature`,
    scenarios:[{name,steps:[`${name} is executable`]}]}));
assert.deepEqual(auditLoadedStepRoutes({packId:'shell',features:missingShellFeatures,loadedRoutes:[]})
  .map(finding=>finding.feature),missingShellFeatures.map(item=>item.path));
const reusableRoute={pattern:/modular-.+ is executable/gu};
assert.deepEqual(auditLoadedStepRoutes({packId:'shell',features:missingShellFeatures,
  loadedRoutes:[reusableRoute]}),[]);
const task=commandTask({key:'unit:test/example.mjs',stage:'unit',packId:'shell',executable:'node',
  args:['test/example.mjs'],target:'test/example.mjs'});
assert.equal(compareGovernedTaskPopulation([task],[task]).result,'conserved population');
const addition=commandTask({key:'unit:test/schema-addition.mjs',stage:'unit',packId:'schemas',
  executable:'node',args:['test/schema-addition.mjs'],target:'test/schema-addition.mjs'});
assert.equal(compareGovernedTaskPopulation([task,addition],[task],[addition]).result,
  'conserved population');
assert.equal(compareGovernedTaskPopulation([task,{...addition,args:['test/changed.mjs']}],[task],[addition]).result,
  'differing args field');
assert.equal(compareGovernedTaskPopulation([],[],[task]).result,'missing task identity');
assert.equal(compareGovernedTaskPopulation([task,{...task,args:['changed']}],[task]).result,
  'duplicate task identity');
assert.equal(compareGovernedTaskPopulation([{...task,args:['changed']}],[task]).result,
  'differing args field');
assert.equal(compareGovernedTaskPopulation([task,{...task,key:'unit:test/extra.mjs'}],[task]).result,
  'unauthorized task identity');
console.log('Verification registration review preflight tests passed');
