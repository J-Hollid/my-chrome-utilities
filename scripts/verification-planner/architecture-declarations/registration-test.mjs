import {execFileSync} from 'node:child_process';
execFileSync('bb',['-e',`
(require '[acceptance.pack-runtime :as packs] '[acceptance.runtime :as runtime]
 '[acceptance.steps.verification-architecture-module-declarations :as subject]
 '[acceptance.steps.support :as support] '[aps.gherkin :as gherkin])
(let [feature (gherkin/parse-file subject/feature)
 handlers (packs/handlers-for-feature subject/feature)
 world {:acceptance/feature-name (:name feature) :architecture-declarations/active true}]
 (doseq [execution (runtime/expand-executions feature) step (:steps execution)]
  (let [selected (first (filter #(and (re-matches (:pattern %) (:text step))
   (or (nil? (:applies? %)) ((:applies? %) world))) handlers))]
   (assert (some #{selected} subject/handlers) (:text step))))
 (reset! subject/evidence nil)
 (with-redefs [support/verified-command-result (fn [& _] {:exit 1 :out ""})]
  (assert (try (runtime/run-feature! feature handlers) false (catch Exception _ true))))
 (doseq [relation subject/relations row (:rows relation)]
  (let [valid (zipmap (:keys relation) row)]
   (support/validate-example-relations! [relation] valid "valid")
   (assert (try (support/validate-example-relations! [relation]
    (assoc valid (last (:keys relation)) "invalid-value") "invalid") false
    (catch Exception _ true))))))
`],{encoding:'utf8',timeout:10000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']});
console.log('architecture declaration handler dispatch and failure propagation passed');
