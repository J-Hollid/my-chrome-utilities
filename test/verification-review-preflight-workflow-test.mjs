import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {loadedRouteAuditProgram,loadedRouteFindings,prepareRunnerReviewPreflight,
  historicalDeclarationTaskProjection,historicalReviewPackIds,reviewAuditFeatures,runVerificationReviewPreflight,
  projectGovernedHistoricalReviewAdditions,validatePreparedReviewAtLaunch} from
  '../scripts/verification-review-preflight-workflow.mjs';
import {selectedSessionFeaturesByPack} from
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

const registrationFeature='features/verification-registration-review-preflight.feature';
const baselineFeature='features/deterministic-baseline-evidence.feature';
const priorFeature='features/verification-process-compact-conservation.feature';
const priorSession={key:'acceptance-session:verification_process',stage:'acceptance-session',
  packId:'verification_process',executable:'bb',args:['acceptance-pack-runner','verification_process'],
  target:priorFeature,environment:null,requiredCapabilities:[],temporaryPathClass:'workspace',
  display:'bb acceptance-pack-runner verification_process'};
const [projectedSession]=projectGovernedHistoricalReviewAdditions([priorSession]);
const projectedPopulation=await runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:['verification_process'],currentTasks:[projectedSession],
  historicalTasks:[],authorizedAdditions:[projectedSession],features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>[],
  auditFeatureRoutes:async()=>assert.fail('no feature route is selected')});
assert.equal(projectedPopulation.population.result,'conserved population',
  'an added parent-fallback session receives the approved registration-review feature projection');
assert.equal(projectedSession.target,[priorFeature,registrationFeature,baselineFeature].sort().join(','));
await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:['verification_process'],
  currentTasks:[{...projectedSession,args:[...projectedSession.args,'unapproved']}],
  historicalTasks:[],authorizedAdditions:[projectedSession],features:[],featureOwners:new Map(),
},{resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>[],
  auditFeatureRoutes:async()=>assert.fail('feature drift blocks before route audit')}),
  /differing args field/u,'an unapproved session feature still fails closed');

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
const declarationTask={...task,key:'property:test/new-property.mjs',stage:'property',
  args:['test/new-property.mjs'],target:'test/new-property.mjs',display:'node test/new-property.mjs'};
const authenticatedProjection=historicalDeclarationTaskProjection([task,declarationTask],
  [task,removed],{entries:[{status:'A',path:'test/new-property.mjs'}]},true,
  [declarationTask.key]);
assert.deepEqual(authenticatedProjection,{
  historicalTasks:[task,removed],declarationAdditions:[declarationTask]},
  'authenticated declaration scope keeps missing historical identities and admits a selected added target');
assert.deepEqual(historicalDeclarationTaskProjection([task,declarationTask],[task,removed],{
  entries:[{status:'A',path:'test/new-property.mjs'}]},true,[]),{
  historicalTasks:[task,removed],declarationAdditions:[]},
  'an added target without selected-slice authority cannot become a governed addition');
assert.deepEqual(historicalDeclarationTaskProjection([task],[task,removed],{entries:[]},false),{
  historicalTasks:[task,removed],declarationAdditions:[]},
  'ordinary review keeps the full historical population');
await assert.rejects(()=>runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:[],currentTasks:[task,declarationTask],
  historicalTasks:governedHistoricalReviewTasks(authenticatedProjection.historicalTasks),
  authorizedAdditions:authenticatedProjection.declarationAdditions,
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
const statefulRun=await promisify(execFile)('bb',[
  '-e',loadedRouteAuditProgram(),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
const statefulRows=JSON.parse(statefulRun.stdout.trim());
assert.ok(statefulRows.length>1);
assert.ok(statefulRows.every(row=>row.matches===1),
  'the pure routing transition makes every later stateful route applicable');
const sharedFactoryHandlers=`(support/feature-scoped-stateful-handlers
 ["features/verification-registration-review-preflight.feature"]
 #(= % "review preparation has a candidate, specification commit, received work base, evidence base, and intended handoff base")
 :shared-factory/active
 (fn [& _] (throw (Exception. "product handler ran"))))`;
const sharedFactoryRun=await promisify(execFile)('bb',[
  '-e',loadedRouteAuditProgram(sharedFactoryHandlers),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
assert.ok(JSON.parse(sharedFactoryRun.stdout.trim()).every(row=>row.matches===1),
  'shared stateful factory routes advance without product handler execution');
const customHandlers=`[{:pattern #"review preparation.*" :applies? (fn [_] true)
  :routing-transition (fn [world] (assoc world :custom/active true))
  :handler (fn [& _] (throw (Exception. "product handler ran")))}
 {:pattern #"the selected plan.*" :applies? :custom/active
  :handler (fn [& _] (throw (Exception. "product handler ran")))}]`;
const customRun=await promisify(execFile)('bb',['-e',loadedRouteAuditProgram(customHandlers),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
assert.deepEqual(JSON.parse(customRun.stdout.trim()).slice(0,2).map(row=>row.matches),[1,1]);
const unsupportedHandlers=customHandlers.replace(
  ':routing-transition (fn [world] (assoc world :custom/active true))','');
const unsupportedRun=await promisify(execFile)('bb',[
  '-e',loadedRouteAuditProgram(unsupportedHandlers),'--',
  'features/verification-registration-review-preflight.feature'],{cwd:new URL('..',import.meta.url)});
const unsupportedRows=JSON.parse(unsupportedRun.stdout.trim());
assert.equal(unsupportedRows[1].routingMetadataUnsupported,true);
assert.equal(loadedRouteFindings(unsupportedRows,{packId:'custom',featurePath:'features/custom.feature'})
  .find(finding=>finding.step.startsWith('the selected plan')).result,'unsupported routing metadata');
assert.deepEqual(reviewAuditFeatures({
  features:['features/changed.feature','features/activated.feature'],
  changedPaths:['features/changed.feature'],
  explicitlyActivatedFeatures:['features/activated.feature'],
}),['features/activated.feature','features/changed.feature']);
assert.throws(()=>reviewAuditFeatures({features:['features/known.feature'],changedPaths:[],
  explicitlyActivatedFeatures:['features/unknown.feature']}),/absent from the selected plan/u);
const activatedAuditCalls=[];
const activatedFeatures=reviewAuditFeatures({features:['features/unchanged.feature'],changedPaths:[],
  explicitlyActivatedFeatures:['features/unchanged.feature']});
await runVerificationReviewPreflight({
  task:'review-task',receivedWorkBase:commit('1'),specificationCommit:commit('2'),
  evidenceBase:commit('3'),handoffBase:commit('3'),candidateCommit:commit('4'),
  candidateTree:commit('5'),packIds:['verification_process'],currentTasks:[task],
  historicalTasks:[task],authorizedAdditions:[],features:activatedFeatures,
  featureOwners:new Map([['features/unchanged.feature','verification_process']]),
},{resolveCommit:async value=>value,isAncestor:async()=>true,changedPaths:async()=>[],
  auditFeatureRoutes:async input=>{activatedAuditCalls.push(input);return[];}});
assert.deepEqual(activatedAuditCalls,[{featurePath:'features/unchanged.feature',
  packId:'verification_process'}]);

const selectedFeature='features/selected.feature';
const sessionTask={...task,key:'acceptance-session:shell',stage:'acceptance-session',packId:'shell',
  target:'features/selected.feature,features/other.feature'};
const sessionPlan={selectedPackIds:['shell'],selectedVerificationSliceTaskKeys:{shell:[
  'acceptance-parse:features/selected.feature']},tasks:[sessionTask]};
assert.equal(selectedSessionFeaturesByPack(sessionPlan).size,0,
  'a full pack session is not projected to the smaller selected slice');
assert.deepEqual(selectedSessionFeaturesByPack({...sessionPlan,tasks:[{
  ...sessionTask,target:'features/selected.feature'}]}).get('shell'),[selectedFeature]);
assert.deepEqual(historicalReviewPackIds({requestedPackIds:['schemas','shell'],
  selectedPackIds:['shell']}),['schemas','shell'],
"historical preflight retains every explicitly approved owner of a shared path");
assert.deepEqual(historicalReviewPackIds({requestedPackIds:[],selectedPackIds:['shell']}),['shell'],
"historical preflight uses selected packs when the caller did not request an explicit set");
const runnerPlan={changedPaths:[],selectedPackIds:[],selectedVerificationSliceTaskKeys:{},
  tasks:[],features:[selectedFeature],includeProperties:false};
const runnerPacks=[{id:'verification_process',features:[selectedFeature]}];
const runnerGitValue=async(command,...args)=>{
  if(command==='rev-parse')return args[0].replace(/\^\{commit\}$/u,'');
  if(command==='merge-base'||command==='diff')return '';
  throw new Error(`Unexpected Git command: ${command}`);
};
const runnerInput=(explicitlyActivatedFeatures,auditFeatureRoutes)=>({
  evidenceTask:'review-task',options:{reviewReceivedBase:commit('1'),
    reviewSpecificationCommit:commit('2'),reviewHandoffBase:commit('3'),
    explicitlyActivatedFeatures},plan:runnerPlan,packs:runnerPacks,changedSince:commit('3'),
  candidateCommit:commit('4'),candidateTree:commit('5'),repositoryRoot:new URL('..',import.meta.url),
  gitValue:runnerGitValue,gitFileAt:async()=>null,auditFeatureRoutes,
});
const runnerAuditCalls=[];
await prepareRunnerReviewPreflight(runnerInput([selectedFeature],async input=>{
  runnerAuditCalls.push(input);
  return [];
}));
assert.deepEqual(runnerAuditCalls,[{featurePath:selectedFeature,packId:'verification_process'}],
  'runner preparation audits an unchanged explicitly activated selected feature');
await assert.rejects(()=>prepareRunnerReviewPreflight(runnerInput(
  ['features/not-in-plan.feature'],async()=>assert.fail('an absent feature must not run an audit'))),
  /absent from the selected plan/u);
for(const resultName of ['missing registration','ambiguous registration']) {
  await assert.rejects(()=>prepareRunnerReviewPreflight(runnerInput([selectedFeature],async input=>[{
    result:resultName,packId:input.packId,feature:input.featurePath,scenario:'scenario',step:'step',
  }])),new RegExp(resultName,'u'),`${resultName} stops during runner preparation`);
}
console.log('verification review preflight workflow tests passed');
