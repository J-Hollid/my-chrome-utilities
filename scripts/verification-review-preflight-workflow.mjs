import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {auditLoadedStepRoutes,compareGovernedTaskPopulation} from
  './verification-registration-preflight.mjs';
import {prepareReviewBinding,validatePreparedReview} from './verification-review-preparation.mjs';
import {planVerification} from './verification-packs.mjs';
import {timeoutRepairPackageTaskIdentity} from './verification-reliability-incidents.mjs';
import {governedHistoricalReviewTasks,governedHistoricalTaskAdditions} from
  './verification-planner/manifest-declarations/historical-conservation.mjs';

const reviewBaseOptions=new Set(['--review-received-base','--review-specification-commit',
  '--review-handoff-base']);

export function consumeReviewOption({argument,args,index,options,once,valueArgument,changedPath}) {
  if(reviewBaseOptions.has(argument)) {
    once(argument);
    const value=valueArgument(args,index,argument);
    if(value.startsWith('-')||/\s/u.test(value))
      throw new Error(`Use a Git revision with ${argument}: ${value}`);
    if(argument==='--review-received-base')options.reviewReceivedBase=value;
    else if(argument==='--review-specification-commit')options.reviewSpecificationCommit=value;
    else options.reviewHandoffBase=value;
    return index+1;
  }
  if(argument!=='--review-feature')return undefined;
  const value=changedPath(valueArgument(args,index,argument));
  options.explicitlyActivatedFeatures??=[];
  if(options.explicitlyActivatedFeatures.includes(value))
    throw new Error(`Activate every review feature once: ${value}`);
  options.explicitlyActivatedFeatures.push(value);
  return index+1;
}

export function validateReviewFeatureOptions(options) {
  if(options.explicitlyActivatedFeatures&&!options.prepareEvidence)
    throw new Error('Use --review-feature only with --prepare-evidence');
}

export function validateReviewReferenceOptions(options) {
  const references=[options.reviewReceivedBase,options.reviewSpecificationCommit,
    options.reviewHandoffBase].filter(Boolean);
  if(references.length&&(!options.prepareEvidence||references.length!==3))
    throw new Error('Review base selectors require fresh evidence and all three review references');
}

export async function validatePreparedReviewAtLaunch(prepared,current,resolveCommit) {
  const [evidenceBase,handoffBase]=await Promise.all([
    resolveCommit(current.evidenceBase),resolveCommit(current.handoffBase),
  ]);
  return validatePreparedReview(prepared,{...current,evidenceBase,handoffBase});
}

export function reviewAuditFeatures({features,changedPaths,explicitlyActivatedFeatures=[]}) {
  const available=new Set(features);
  const unknown=explicitlyActivatedFeatures.find(feature=>!available.has(feature));
  if(unknown)throw new Error(`Explicit review feature is absent from the selected plan: ${unknown}`);
  const activated=explicitlyActivatedFeatures.filter(feature=>available.has(feature));
  return [...new Set([...changedPaths.filter(path=>available.has(path)),...activated])].sort();
}

const execFileAsync=promisify(execFile);
export function loadedRouteAuditProgram(handlersExpression='(packs/handlers-for-feature path)') {
  return `
(require '[acceptance.pack-runtime :as packs] '[acceptance.steps.support :as support]
 '[aps.gherkin :as gherkin] '[acceptance.runtime :as runtime] '[cheshire.core :as json])
(let [path (first *command-line-args*) feature (gherkin/parse-file path) rows (atom [])
 original-stateful support/stateful-semantic-handlers
 original-feature-mode support/feature-mode-handlers
 add-routing (fn [handlers state-key]
               (mapv #(assoc % :routing-transition (fn [world] (assoc world state-key true)))
                     handlers))
 handlers (with-redefs
            [support/stateful-semantic-handlers
             (fn [step-specs entry-step? state-key transition]
               (add-routing (original-stateful step-specs entry-step? state-key transition)
                            state-key))
             support/feature-mode-handlers
             (fn [feature-files entry-modes state-key transition]
               (add-routing (original-feature-mode feature-files entry-modes state-key transition)
                            state-key))]
            ${handlersExpression})]
 (with-redefs [support/cached-command-verification! (fn [& _] nil)]
  (doseq [execution (runtime/expand-executions feature)]
   (let [initial-routing-context {:acceptance/feature-name (:name feature)
                          :acceptance/scenario-name (get-in execution [:scenario :name])
                          :acceptance/scenario-index (:scenario-index execution)
                          :acceptance/scenario-steps (mapv :text (get-in execution [:scenario :steps]))}]
    (reduce (fn [routing-context step]
              (let [pattern-matches (filterv #(re-matches (:pattern %) (:text step)) handlers)
                    matches (filterv (fn [{:keys [applies?]}]
                                       (or (nil? applies?) (applies? routing-context)))
                                     pattern-matches)
                    selected (when (= 1 (count matches)) (first matches))]
               (swap! rows conj {:scenario (:name execution) :step (:text step)
                                 :matches (count matches)
                                 :routingMetadataUnsupported
                                 (and (seq pattern-matches) (empty? matches)
                                      (boolean (some :applies? pattern-matches)))})
               (if-let [routing-transition (:routing-transition selected)]
                 (routing-transition routing-context)
                 routing-context)))
            initial-routing-context (:steps execution))))
 (println (json/generate-string @rows))))`;
}

export async function auditFeatureRoutesWithLoadedPack({featurePath,packId,repositoryRoot}) {
  const program=loadedRouteAuditProgram();
  const {stdout}=await execFileAsync('bb',['-e',program,'--',featurePath],{
    cwd:repositoryRoot,maxBuffer:8*1024*1024});
  const rows=JSON.parse(stdout.trim());
  return loadedRouteFindings(rows,{packId,featurePath});
}

export function loadedRouteFindings(rows,{packId,featurePath}) {
  return rows.flatMap(row=>row.matches===1?[]:[{packId,feature:featurePath,
    scenario:row.scenario,step:row.step,
    result:row.matches?'ambiguous registration':row.routingMetadataUnsupported
      ?'unsupported routing metadata':'missing registration'}]);
}

export async function runVerificationReviewPreflight(input,services) {
  const binding=await prepareReviewBinding(input,services);
  const population=compareGovernedTaskPopulation(input.currentTasks,input.historicalTasks,
    input.authorizedAdditions);
  if(population.result!=='conserved population')throw new Error(
    `Verification task population failed: ${population.result} ${population.key??''}`.trim());
  const registrationFindings=[];
  for(const featurePath of input.features) {
    const packId=input.featureOwners.get(featurePath);
    if(!packId)throw new Error(`Acceptance feature has no owning pack: ${featurePath}`);
    const result=await services.auditFeatureRoutes({featurePath,packId});
    if(Array.isArray(result))registrationFindings.push(...result);
    else registrationFindings.push(...auditLoadedStepRoutes(result));
  }
  if(registrationFindings.length) {
    const finding=registrationFindings[0];
    throw new Error(`${finding.result}: ${finding.packId} ${finding.feature} ${finding.scenario} ${finding.step}`);
  }
  return {binding,population,registrationFindings};
}

export async function prepareRunnerReviewPreflight({evidenceTask,options,plan,packs,
  changedSince,candidateCommit,candidateTree,repositoryRoot,gitValue,gitFileAt}) {
  if(!evidenceTask)return undefined;
  const historicalChangedPaths=options.basePacks?(await Promise.all(plan.changedPaths
    .map(async filePath=>[filePath,await gitFileAt(changedSince,filePath)])))
    .filter(([,contents])=>contents!==null).map(([filePath])=>filePath):plan.changedPaths;
  const historicalPlan=options.basePacks?planVerification(options.basePacks,{
    packIds:plan.selectedPackIds,includeProperties:plan.includeProperties,
    changedPaths:historicalChangedPaths}):plan;
  const selectedFeaturesByPack=new Map(plan.selectedPackIds.flatMap(packId=>{
    const features=(plan.selectedVerificationSliceTaskKeys?.[packId]??[])
      .filter(key=>key.startsWith('acceptance-parse:'))
      .map(key=>key.slice('acceptance-parse:'.length));
    return features.length?[[packId,features]]:[];
  }));
  const sessionPrerequisitesByPack=new Map(plan.tasks
    .filter(({stage})=>stage==='acceptance-session')
    .map(task=>[task.packId,task.prerequisiteTaskKeys??[]]));
  const historicalTasks=governedHistoricalReviewTasks(historicalPlan.tasks,
    selectedFeaturesByPack,sessionPrerequisitesByPack);
  const featureOwners=new Map(plan.features.map(feature=>[feature,
    packs.find(pack=>pack.features.includes(feature))?.id]));
  const packagePrerequisites=plan.tasks.find(({key})=>
    key===timeoutRepairPackageTaskIdentity.key)?.prerequisiteTaskKeys;
  const packageTask={...timeoutRepairPackageTaskIdentity,requiredCapabilities:[],
    display:[timeoutRepairPackageTaskIdentity.executable,
      ...timeoutRepairPackageTaskIdentity.args].join(' ')};
  const governedPackageTask=packagePrerequisites
    ?{...packageTask,prerequisiteTaskKeys:packagePrerequisites}:packageTask;
  const prepared=await runVerificationReviewPreflight({
    task:evidenceTask,receivedWorkBase:options.reviewReceivedBase??changedSince,
    specificationCommit:options.reviewSpecificationCommit??changedSince,
    evidenceBase:changedSince,handoffBase:options.reviewHandoffBase??changedSince,
    candidateCommit,candidateTree,packIds:plan.selectedPackIds,currentTasks:plan.tasks,
    historicalTasks,authorizedAdditions:governedHistoricalTaskAdditions(
      plan.tasks.map(({key})=>key),historicalTasks.map(({key})=>key),{
        basePacks:options.basePacks,
        browserTargetIds:plan.tasks.filter(({stage})=>stage==='browser-observation')
          .map(({key})=>key.slice('browser-observation:'.length)),
        governedTasks:[governedPackageTask]}),
    features:reviewAuditFeatures(plan),featureOwners,
  },{
    resolveCommit:value=>gitValue('rev-parse',`${value}^{commit}`),
    isAncestor:async(ancestor,commit)=>{
      try{await gitValue('merge-base','--is-ancestor',ancestor,commit);return true;}
      catch{return false;}
    },
    changedPaths:async(base,commit)=>(await gitValue('diff','--name-only',
      `${base}..${commit}`)).split('\n').filter(Boolean),
    auditFeatureRoutes:input=>auditFeatureRoutesWithLoadedPack({...input,repositoryRoot}),
  });
  console.error(`[verify:review-preflight] ${JSON.stringify(prepared.binding)}`);
  await validatePreparedReviewAtLaunch(prepared.binding,{candidateCommit,candidateTree,
    evidenceBase:changedSince,handoffBase:options.reviewHandoffBase??changedSince},
  value=>gitValue('rev-parse',`${value}^{commit}`));
  return prepared;
}
