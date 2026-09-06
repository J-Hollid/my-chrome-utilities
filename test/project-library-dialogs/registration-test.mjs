import {execFileSync} from "node:child_process";
execFileSync("bb", ["-e", `
(require '[acceptance.pack-runtime :as packs] '[acceptance.runtime :as runtime]
 '[acceptance.steps.project-library-dialogs :as subject]
 '[acceptance.steps.support :as support] '[aps.gherkin :as gherkin])
(let [feature (gherkin/parse-file subject/feature)
 handlers (packs/handlers-for-feature subject/feature)
 world {:acceptance/feature-name (:name feature)}]
 (with-redefs [support/verified-command-result
  (fn [& command] {:exit 0 :out
   (if (= (last command) "test/project-library-dialogs/structure-test.mjs")
    "{\\\"projectLibraryDialogStructure\\\":{\\\"modules\\\":true,\\\"callbacks\\\":true,\\\"presentation\\\":true,\\\"completeArchitecture\\\":true}}"
    "{\\\"projectLibraryDialogs\\\":{\\\"installed\\\":true,\\\"lifecycle\\\":true,\\\"coordinator\\\":true}}")})]
  (doseq [execution (runtime/expand-executions feature)]
   (reduce (fn [state step]
    (let [selected (first (filter #(and (re-matches (:pattern %) (:text step))
     (or (nil? (:applies? %)) ((:applies? %) state))) handlers))]
     (assert (some #{selected} subject/handlers) (:text step))
     (runtime/execute-step! state (:example execution) step handlers)))
    world (:steps execution))))
 (reset! subject/evidence nil)
 (with-redefs [support/verified-command-result (fn [& _] {:exit 1 :out ""})]
  (assert (try (runtime/run-feature! feature handlers) false (catch Exception _ true)))))
`], {encoding:"utf8",timeout:10000,maxBuffer:1024*1024});
console.log("Project Library dialog acceptance dispatch and failure propagation passed");
