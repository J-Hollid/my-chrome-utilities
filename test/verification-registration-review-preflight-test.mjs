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
const feature={path:'features/example.feature',scenarios:[{name:'route',steps:['a step']}]};
assert.equal(auditLoadedStepRoutes({packId:'shell',features:[feature],loadedRoutes:[]})[0].result,
  'missing registration');
assert.equal(auditLoadedStepRoutes({packId:'shell',features:[feature],loadedRoutes:[
  {pattern:/a step/u},{pattern:/a .+/u}]})[0].result,'ambiguous registration');
assert.deepEqual(auditLoadedStepRoutes({packId:'shell',features:[feature],loadedRoutes:[
  {pattern:/a step/u}]}),[]);
const task=commandTask({key:'unit:test/example.mjs',stage:'unit',packId:'shell',executable:'node',
  args:['test/example.mjs'],target:'test/example.mjs'});
assert.equal(compareGovernedTaskPopulation([task],[task]).result,'conserved population');
assert.equal(compareGovernedTaskPopulation([],[],[task]).result,'missing task identity');
assert.equal(compareGovernedTaskPopulation([task,{...task,args:['changed']}],[task]).result,
  'duplicate task identity');
assert.equal(compareGovernedTaskPopulation([{...task,args:['changed']}],[task]).result,
  'differing args field');
assert.equal(compareGovernedTaskPopulation([task,{...task,key:'unit:test/extra.mjs'}],[task]).result,
  'unauthorized task identity');
console.log('Verification registration review preflight tests passed');
