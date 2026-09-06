(ns acceptance.steps.verification-architecture-module-declarations
  (:require [acceptance.steps.support :as support]))

(def feature "features/verification-architecture-module-declarations.feature")
(def prefix "scripts/verification-planner/architecture-declarations/")
(def changes #{"add a module entry" "edit a module entry" "delete a module entry"
               "rename a source path" "change a contract edge"})
(def relations
  [{:keys ["change_kind"] :rows (set (map vector changes))}
   {:keys ["change_class" "required_treatment"]
    :rows #{["shared architecture rule change" "existing global rule coverage"]
            ["mixed rule and declaration changes" "coverage including the shared rule change"]
            ["ambiguous or unavailable base identity" "fail closed or retain conservative scope"]
            ["invalid declaration" "reject passing architecture evidence"]
            ["unresolved affected consumer" "fail closed or retain conservative scope"]}}])
(def expected
  {"delta-test.mjs" {:delta true :invalid true :cycles true}
   "planner-test.mjs" {:planner true :readiness true :callerLabelsRejected true :mixed true
                       :invalid true :unresolved true :unavailable true :baseConsumers true :sameRange true}
   "checker-test.mjs" {:completeChecker true :newModule true :invalidLayer true :invalidImport true}})
(defonce evidence (atom nil))
(defn- verify! []
  (or @evidence
      (reset! evidence
        (into {} (for [[file values] expected]
          (let [result (support/verified-command-result "node" (str prefix file))
                report (support/json-observation (:out result) :architectureDeclarations)]
            (support/assert! (and (zero? (:exit result)) (= values (select-keys report (keys values))))
                             "Architecture declaration behavior failed." {:file file :result result})
            (when (= file "planner-test.mjs")
              (support/assert! (= changes (set (:changes report)))
                               "All declaration deltas need planner proof." {:report report}))
            [file report]))))))
(defn- transition [world example captures _]
  (verify!)
  (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
  (support/validate-example-relations! relations example "Unsupported declaration treatment.")
  (assoc world :architecture-declarations/active true))
(def handlers
  (support/feature-scoped-stateful-handlers [feature]
    #{"verification compares the exact base and candidate architecture inputs"}
    :architecture-declarations/active transition))
