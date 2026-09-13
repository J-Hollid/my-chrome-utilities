import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {auditLoadedStepRoutes,compareGovernedTaskPopulation} from
  './verification-registration-preflight.mjs';
import {prepareReviewBinding} from './verification-review-preparation.mjs';

const execFileAsync=promisify(execFile);
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/gu,'\\$&');

export async function auditFeatureRoutesWithLoadedPack({featurePath,packId,repositoryRoot}) {
  const program=`
(require '[acceptance.pack-runtime :as packs] '[acceptance.steps.support :as support]
 '[aps.gherkin :as gherkin] '[acceptance.runtime :as runtime] '[cheshire.core :as json])
(let [path (first *command-line-args*) feature (gherkin/parse-file path)
 handlers (packs/handlers-for-feature path) rows (atom [])]
 (with-redefs [support/cached-command-verification! (fn [& _] nil)]
  (doseq [execution (runtime/expand-executions feature)]
   (reduce (fn [world step]
    (let [matches (filter #(and (re-matches (:pattern %) (:text step))
      (or (nil? (:applies? %)) ((:applies? %) world))) handlers)]
     (swap! rows conj {:scenario (:name execution) :step (:text step) :matches (count matches)})
     (if (= 1 (count matches))
      (runtime/execute-step! world (:example execution) step handlers) world)))
    {:acceptance/feature-name (:name feature)
     :acceptance/scenario-name (get-in execution [:scenario :name])
     :acceptance/scenario-index (:scenario-index execution)
     :acceptance/scenario-steps (mapv :text (get-in execution [:scenario :steps]))}
    (:steps execution))))
 (println (json/generate-string @rows)))`;
  const {stdout}=await execFileAsync('bb',['-e',program,'--',featurePath],{
    cwd:repositoryRoot,maxBuffer:8*1024*1024});
  const rows=JSON.parse(stdout.trim());
  return rows.flatMap(row=>auditLoadedStepRoutes({packId,features:[{path:featurePath,
    scenarios:[{name:row.scenario,steps:[row.step]}]}],loadedRoutes:Array.from({length:row.matches},
    ()=>({pattern:new RegExp(`^${escapeRegex(row.step)}$`,'u')}))}));
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
