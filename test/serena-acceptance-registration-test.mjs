import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadVerificationPacks,planVerification} from '../scripts/verification-packs.mjs';
const cases=[['serena-development-tools','swarmforge-serena-development-tools','the Serena pilot uses local stdio and the Codex context'],
 ['serena-startup-reading','swarmforge-serena-startup-reading','the role uses the generated startup instruction and shared Serena usage rule'],
 ['verification-ownership-query','verification-ownership-query','the ownership query uses the repository registry and canonical planning APIs']];
for(const [namespace,feature,entry] of cases)execFileSync('bb',['-e',`
(require '[acceptance.pack-runtime :as packs] '[acceptance.steps.${namespace} :as subject]
 '[acceptance.steps.support :as support])
(let [feature "features/${feature}.feature"
 world {:acceptance/feature-name (:name (aps.gherkin/parse-file feature))}
 selected (first (filter #(and (re-matches (:pattern %) ${JSON.stringify(entry)})
  (or (nil? (:applies? %)) ((:applies? %) world))) (packs/handlers-for-feature feature)))]
 (assert (some #{selected} subject/handlers))
 (doseq [{:keys [keys rows] :as relation} subject/relations row rows]
  (let [valid (zipmap keys row) invalid (assoc valid (last keys) "unsupported-value")]
   (support/validate-example-relations! [relation] valid "valid row")
   (assert (try (support/validate-example-relations! [relation] invalid "must reject") false
    (catch Exception _ true))))))`],{encoding:'utf8'});
const packs=await loadVerificationPacks();
for(const [source,packId,sliceId] of [['scripts/verification-ownership-query.mjs','verification_process','ownership_query'],
 ['swarmforge/scripts/serena/server.mjs','shell','serena_development_tools'],['jsconfig.json','shell','serena_development_tools']]){
 const plan=planVerification(packs,{changedPaths:[source],includeProperties:true});
 assert.ok(plan.selectedVerificationSlices[packId].includes(sliceId));
 const slice=packs.find(p=>p.id===packId).verificationSlices.find(s=>s.id===sliceId);
 for(const key of slice.tasks)assert.ok(plan.tasks.some(t=>t.key===key),key);
 if(packId==='shell')assert.ok(plan.selectedVerificationSlices.shell.includes('swarmforge-handoff-control'));
}
console.log(JSON.stringify({serenaAcceptance:{registration:true,relationsRejectWrongValues:true,ownedTasks:true}}));
