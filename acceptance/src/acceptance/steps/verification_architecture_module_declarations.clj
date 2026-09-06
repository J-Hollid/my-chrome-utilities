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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-06T17:11:29.111283499+02:00", :module-hash "1470802948", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1377572659"} {:id "def/feature", :kind "def", :line 4, :end-line 4, :hash "-137803588"} {:id "def/prefix", :kind "def", :line 5, :end-line 5, :hash "-1487582480"} {:id "def/changes", :kind "def", :line 6, :end-line 7, :hash "1954131385"} {:id "def/relations", :kind "def", :line 8, :end-line 15, :hash "-870450324"} {:id "def/expected", :kind "def", :line 16, :end-line 20, :hash "1002020663"} {:id "form/6/defonce", :kind "defonce", :line 21, :end-line 21, :hash "701185655"} {:id "defn-/verify!", :kind "defn-", :line 22, :end-line 33, :hash "-910793555"} {:id "defn-/transition", :kind "defn-", :line 34, :end-line 38, :hash "283655230"} {:id "def/handlers", :kind "def", :line 39, :end-line 42, :hash "2132570140"}]}
;; clj-mutate-manifest-end
