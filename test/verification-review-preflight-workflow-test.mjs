import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {loadedRouteAuditProgram,runVerificationReviewPreflight,validatePreparedReviewAtLaunch} from
  '../scripts/verification-review-preflight-workflow.mjs';
import {governedHistoricalReviewTasks} from
  '../scripts/verification-planner/manifest-declarations/historical-conservation.mjs';

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

const removed={...task,key:'unit:test/removed.mjs',args:['test/removed.mjs'],target:'test/removed.mjs',
  display:'node test/removed.mjs'};
await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:[],currentTasks:[task],
  historicalTasks:governedHistoricalReviewTasks([task,removed]),authorizedAdditions:[],
  features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>[],
  auditFeatureRoutes:async()=>assert.fail('route audit must not authorize removed history'),
}),/missing task identity/u);

const handlers=`(let [invoked (atom false)]
 [{:pattern #".*" :applies? (fn [_] false)
   :handler (fn [& _] (reset! invoked true) (throw (Exception. "handler ran")))}
  {:pattern #".*" :applies? (fn [world] (string? (:acceptance/scenario-name world)))
   :handler (fn [& _] (reset! invoked true) (throw (Exception. "handler ran")))}])`;
const {stdout}=await promisify(execFile)('bb',['-e',loadedRouteAuditProgram(handlers),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
const routeRows=JSON.parse(stdout.trim());
assert.ok(routeRows.length>0);
assert.ok(routeRows.every(row=>row.matches===1),
  'two regex matches are not ambiguous when only one route applies');
const nonApplicable=`[{:pattern #".*" :applies? (fn [_] false)
  :handler (fn [& _] (throw (Exception. "handler ran")))}]`;
const nonApplicableRun=await promisify(execFile)('bb',[
  '-e',loadedRouteAuditProgram(nonApplicable),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
assert.ok(JSON.parse(nonApplicableRun.stdout.trim()).every(row=>row.matches===0),
  'a regex match with a false applicability predicate is not a selected route');
const statefulHandlers=`(support/feature-scoped-stateful-handlers
 ["features/verification-registration-review-preflight.feature"]
 #(= % "review preparation has a candidate, specification commit, received work base, evidence base, and intended handoff base")
 :audit/active
 (fn [& _] (throw (Exception. "product handler ran"))))`;
const statefulRun=await promisify(execFile)('bb',[
  '-e',loadedRouteAuditProgram(statefulHandlers),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
const statefulRows=JSON.parse(statefulRun.stdout.trim());
assert.ok(statefulRows.length>1);
assert.ok(statefulRows.every(row=>row.matches===1),
  'the pure routing transition makes every later stateful route applicable');
console.log('verification review preflight workflow tests passed');
