import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {runVerificationReviewPreflight,validatePreparedReviewAtLaunch} from
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

assert.equal(await validatePreparedReviewAtLaunch(result.binding,{
  candidateCommit:commit('4'),candidateTree:commit('5'),evidenceBase:'3333333333',
  handoffBase:commit('3'),
},async value=>value==='3333333333'?commit('3'):value),true);

await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('2'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:[],currentTasks:[],historicalTasks:[],authorizedAdditions:[],
  features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,
  changedPaths:async base=>base===commit('3')?['scripts/a.mjs','docs/spec.md']:['scripts/a.mjs'],
  auditFeatureRoutes:async()=>assert.fail('route audit must not run after a binding mismatch'),
}),/docs\/spec\.md/u);

await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:[],currentTasks:[{...task,executable:'changed'}],
  historicalTasks:[task],authorizedAdditions:[],features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>[],
  auditFeatureRoutes:async()=>assert.fail('route audit must not authorize changed history'),
}),/differing executable field/u);

await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:[],currentTasks:[task,{...task,key:'unit:test/extra.mjs'}],
  historicalTasks:[task],authorizedAdditions:[],features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>[],
  auditFeatureRoutes:async()=>assert.fail('route audit must not authorize an extra task'),
}),/unauthorized task identity/u);

const {stdout}=await promisify(execFile)('bb',['-e',`(let [invoked (atom false)
      handlers [{:pattern #"a route" :handler (fn [& _] (reset! invoked true)
        (throw (Exception. "handler ran")))}]
      matches (filterv #(re-matches (:pattern %) "a route") handlers)]
  (println (str (count matches) ":" @invoked)))`],{cwd:new URL('..',import.meta.url)});
assert.equal(stdout.trim(),'1:false','route resolution must not invoke the matched handler');
console.log('verification review preflight workflow tests passed');
