import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runVerificationReviewPreflight} from
  '../scripts/verification-review-preflight-workflow.mjs';

const commit=value=>value.repeat(40);
const calls={routes:0};
const task={key:'unit:test/a.mjs',stage:'unit',packId:'verification_process',executable:'node',
  args:['test/a.mjs'],target:'test/a.mjs',environment:null,requiredCapabilities:[],
  temporaryPathClass:'workspace',display:'node test/a.mjs'};
const result=await runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:['verification_process'],currentTasks:[task],
  historicalTasks:[task],authorizedAdditions:[],features:['features/a.feature'],
  featureOwners:new Map([['features/a.feature','verification_process']]),
},{
  resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>['scripts/a.mjs'],
  auditFeatureRoutes:async({featurePath,packId})=>{calls.routes+=1;return {packId,
    features:[{path:featurePath,scenarios:[{name:'scenario',steps:['a route']}]}],
    loadedRoutes:[{pattern:/a route/u}]};},
});
assert.equal(result.binding.reviewReadyProof,false);
assert.equal(result.population.result,'conserved population');
assert.deepEqual(result.registrationFindings,[]);
assert.equal(calls.routes,1);

await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('2'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:[],currentTasks:[],historicalTasks:[],authorizedAdditions:[],
  features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,
  changedPaths:async base=>base===commit('3')?['scripts/a.mjs','docs/spec.md']:['scripts/a.mjs'],
  auditFeatureRoutes:async()=>assert.fail('route audit must not run after a binding mismatch'),
}),/docs\/spec\.md/u);

const runner=await readFile(new URL('../scripts/verification-execution/runner.mjs',import.meta.url),'utf8');
assert.match(runner,/runVerificationReviewPreflight\(/u,
  'the production evidence runner must invoke review preflight');
assert.match(runner,/validatePreparedReview\(/u,
  'the production evidence runner must revalidate the binding before launch');
console.log('verification review preflight workflow tests passed');
