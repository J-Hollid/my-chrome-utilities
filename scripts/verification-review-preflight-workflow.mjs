import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {auditLoadedStepRoutes,compareGovernedTaskPopulation} from
  './verification-registration-preflight.mjs';
import {prepareReviewBinding,validatePreparedReview} from './verification-review-preparation.mjs';

export async function validatePreparedReviewAtLaunch(prepared,current,resolveCommit) {
  const [evidenceBase,handoffBase]=await Promise.all([
    resolveCommit(current.evidenceBase),resolveCommit(current.handoffBase),
  ]);
  return validatePreparedReview(prepared,{...current,evidenceBase,handoffBase});
}

export function reviewAuditFeatures({features,changedPaths,selectedVerificationSliceTaskKeys={}}) {
  const available=new Set(features);
  const activated=Object.values(selectedVerificationSliceTaskKeys).flat()
    .filter(key=>key.startsWith('acceptance-parse:'))
    .map(key=>key.slice('acceptance-parse:'.length));
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
