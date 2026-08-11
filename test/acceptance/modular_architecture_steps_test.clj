(ns acceptance.modular-architecture-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.modular-architecture :as modular]
            [acceptance.verification-support.isolated-handler-audit :as isolation-audit]
            [acceptance.verification-support.modular-architecture-vtd006-handlers :as vtd006]
            [acceptance.verification-support.modular-architecture-vtd007-handlers :as vtd007]
            [acceptance.verification-support.modular-architecture-vtd009-handlers :as vtd009]
            [acceptance.verification-support.modular-architecture-vtd014-handlers :as vtd014]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(load "modular_architecture_vtd014_steps_test_fragment")
(load "modular_architecture_vtd014_scenarios_test_fragment")

(def feature-files
  ["features/modular-chrome-utility-architecture.feature"
   "features/modular-verification-packs.feature"
   "features/modular-acceptance-execution.feature"
   "features/modular-browser-runtime-adapters.feature"])

(deftest verifies-modular-architecture-features
  (doseq [feature-file feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          modular/handlers)))
        feature-file)))

(deftest modular-inspection-is-cached-after-validating-the-pack-boundary
  (is (false? (#'modular/enough-verification-packs? (range 5))))
  (is (true? (#'modular/enough-verification-packs? (range 6))))
  (let [inspected (#'modular/inspect! {})]
    (is (true? (:modular/inspected inspected)))
    (is (seq (:modular/registry inspected)))
    (is (= "shared"
           (get (:modular/browser-adapter-modes inspected)
                "test/browser-packs/flow-graph.mjs")))
    (is (not (contains? (:modular/browser-adapter-modes inspected)
                        "test/browser-packs/flow-graph-legacy.mjs")))
    (is (= "integration"
           (get (:modular/browser-adapter-modes inspected)
                "test/twatility-projects-browser-test.mjs")))
    (is (identical? inspected (#'modular/inspect! inspected)))))

(deftest vtd013-steps-use-dedicated-production-backed-semantics
  (let [characterization (#'modular/flow-characterization)
        focused (#'modular/flow-sample-world {} "focused single-target")
        loaded (#'modular/flow-sample-world {} "normally loaded terminal lane 4 of 4")
        maturity (#'modular/flow-maturity-world {} "4" "5" "5")
        budget (#'modular/flow-budget-world {} "12.892 seconds")]
    (is (= "complete" (get-in characterization [:completion :status])))
    (is (= "normal" (:vtd013/execution-load focused)))
    (is (= "loaded" (:vtd013/execution-load loaded)))
    (is (= ["provisional" "non-provisional"]
           [(:vtd013/focused-status maturity) (:vtd013/loaded-status maturity)]))
    (is (= "fail" (:vtd013/budget-result budget))))
  (let [characterization (#'modular/flow-characterization)
        expanded (-> characterization
                     (assoc-in [:classes :focusedNormal :sampleCount] 6)
                     (update-in [:classes :focusedNormal :receiptDigests]
                                conj (apply str (repeat 64 "a")))
                     (assoc-in [:classes :normallyLoaded :sampleCount] 6)
                     (update-in [:classes :normallyLoaded :receiptDigests]
                                conj (apply str (repeat 64 "b"))))]
    (with-redefs-fn {#'modular/flow-characterization (constantly expanded)}
      #(is (= 6 (get-in (#'modular/flow-completion-world {})
                        [:vtd013/focused :sampleCount]))
           "the at-least-five contract accepts additional independent samples")))
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        steps (->> (:scenarios feature)
                   (filter #(re-matches #"Modular verification packs 03[0-3]" (:name %)))
                   (mapcat :steps)
                   (map :text))]
    (is (= 4 (count (filter #(re-matches #"Modular verification packs 03[0-3]" (:name %))
                            (:scenarios feature)))))
    (doseq [step steps]
      (let [handler (first (filter #(re-matches (:pattern %) step) modular/handlers))]
        (is (some? handler) step)
        (is (not= "^.*$" (str (:pattern handler))) step)))))

(deftest vtd003-steps-use-dedicated-production-backed-semantics
  (let [calibration (#'modular/performance-calibration)
        pack-world (#'modular/calibration-pack-world
                    {} "flow_graph" "src/flow-graph/workspace-section-ui.ts")
        target-world (#'modular/calibration-target-world
                      {} "FLOW_GRAPH_EXAMPLES_TARGET")]
    (is (= "complete" (get-in calibration [:completion :status])))
    (is (= ["flow_graph"] (:vtd003/selected-packs pack-world)))
    (is (= 4596 (get-in target-world [:vtd003/target-budget :limit]))))
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        scenarios (filter #(re-matches #"Modular verification packs 03[4-9]" (:name %))
                          (:scenarios feature))]
    (is (= 6 (count scenarios)))
    (doseq [step (map :text (mapcat :steps scenarios))]
      (let [handler (first (filter #(re-matches (:pattern %) step) modular/handlers))]
        (is (some? handler) step)
        (is (not= "^.*$" (str (:pattern handler))) step)))))

(defn- assert-dedicated-scenario-handlers! [scenario-pattern expected-count]
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        scenarios (filter #(re-matches scenario-pattern (:name %))
                          (:scenarios feature))]
    (is (= expected-count (count scenarios)))
    (doseq [step (map :text (mapcat :steps scenarios))]
      (let [handler (first (filter #(re-matches (:pattern %) step) modular/handlers))]
        (is (some? handler) step)
        (is (not= "^.*$" (str (:pattern handler))) step)))))

(deftest vtd004-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 04[0-5]" 6))

(deftest vtd004-durable-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:4[6-9]|5[0-2])" 7))

(deftest vtd004-event-library-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 05[3-9]" 7))

(deftest vtd004-event-library-isolation-audit-uses-dedicated-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 060" 1))

(deftest vtd004-capture-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 06[1-7]" 7))

(deftest vtd004-schemas-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:6[8-9]|7[0-4])" 7))

(deftest vtd005-layered-editor-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:7[5-9]|80)" 6))

(deftest vtd009-helper-shell-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 08[1-7]" 7))

(deftest vtd007-browser-control-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:8[8-9]|9[0-4])" 7))

(deftest vtd007-handlers-reject-mutated-example-outcomes-and-deadline-owners
  (let [handlers (vtd007/handlers {:example-values (fn [_ captures] captures)})
        invoke (fn [world text captures]
                 ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
                  world nil captures))
        readiness (-> {}
                      (invoke "a shared browser readiness check for target TARGET-READY, phase navigation, and predicate \"the requested workspace is mounted\"" [])
                      (invoke "its monotonic deadline is 100 milliseconds, poll interval is 25 milliseconds, maximum snapshot is 80 characters, and stability interval is 0 milliseconds" ["0 milliseconds"])
                      (invoke "its observed ready states are true" ["true"]))
        deadline (invoke {} "the browser boundary Chrome termination has its own bounded deadline"
                         ["Chrome termination"])]
    (is (thrown? Exception
                 (invoke readiness "the readiness outcome is succeeds after 50 milliseconds"
                         ["succeeds after 50 milliseconds"])))
    (is (thrown? Exception
                 (invoke deadline
                         "the failure names DevTools protocol call rather than a product readiness predicate"
                         ["DevTools protocol call"])))))

(deftest vtd007-handlers-reject-permuted-forced-failure-descriptions
  (let [handlers (vtd007/handlers {:example-values (fn [_ captures] captures)})
        invoke (fn [world text captures]
                 ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
                  world nil captures))
        rows [["Chrome debug-port startup" "Chrome never exposes a debugging port"]
              ["DevTools protocol call" "a requested protocol response never arrives"]
              ["logical target outer work" "target work never completes"]
              ["Chrome termination" "the browser ignores graceful termination"]
              ["profile cleanup" "the browser profile remains temporarily busy"]]]
    (doseq [[[owner failure] [_ permuted]] (map vector rows (concat (rest rows) [(first rows)]))]
      (let [world (invoke {} (str "the browser boundary " owner " has its own bounded deadline")
                          [owner])]
        (is (thrown? Exception
                     (invoke world (str permuted " is forced independently") [permuted]))
            (str failure " must not accept " permuted))))))

(deftest vtd007-handlers-reject-disconnected-surface-phase-program-and-plan-evidence
  (let [handlers (vtd007/handlers {:example-values (fn [_ captures] captures)})
        invoke (fn [world text captures]
                 ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
                  world nil captures))
        evidence {:surfaces [{:browserSurface "the shared side-panel harness"
                              :readinessBoundary "initial navigation, post-fixture reload, and installed reload"
                              :stabilityRequirement "no extra stability interval"
                              :productionFacts {:entryPoint "test/browser-packs/shared-harness.mjs"
                                                :predicateOwner
                                                "test/browser-packs/shared-harness.mjs"
                                                :phases ["navigation" "post-fixture reload"
                                                         "installed reload"]
                                                :sharedCalls 1
                                                :compoundPredicateOutcomes
                                                [true false false false]}}]
                  :timing {:identity "swarmforgeBrowserTargetTiming"
                           :passConserved true
                           :failurePartialPhase "fixture"
                           :realRunners
                           {:flowFailure
                            {:activePhase "interaction" :timingRecords 1
                             :timing {:phaseNames ["target setup" "navigation" "fixture"
                                                   "readiness" "interaction" "persistence"
                                                   "assertion" "cleanup"]
                                      :applicableNonZeroPhases
                                      ["target setup" "navigation" "interaction" "cleanup"]
                                      :phaseTotal 10 :durationMs 10}}
                            :installedFailure
                            {:activePhase "interaction" :timingRecords 1
                             :timing {:phaseNames ["target setup" "navigation" "fixture"
                                                   "interaction" "persistence" "assertion"
                                                   "target cleanup"]
                                      :applicableNonZeroPhases
                                      ["target setup" "navigation" "interaction"
                                       "target cleanup"]
                                      :phaseTotal 10 :durationMs 10}}}}
                  :programs {:invalidRejected true :targetAndPhase true
                             :invalidTransmissionCount 0 :invalidCaseCount 5
                             :validProgramCount 5
                             :protocolAdapters
                             [{:pathname "test/browser-packs/shared-harness.mjs"
                               :transmissionCount 1 :allValidated true}
                              {:pathname "test/support/browser-target-session.mjs"
                               :transmissionCount 1 :allValidated true}
                              {:pathname "test/browser-packs/flow-graph.mjs"
                               :transmissionCount 1 :allValidated true}]
                             :policyEntryPoints
                             ["test/browser-packs/shared-harness.mjs"
                              "test/support/browser-target-session.mjs"
                              "test/support/layered-schema-targets.mjs"
                              "test/browser-packs/flow-graph.mjs"
                              "test/support/flow-examples-timing.mjs"]
                             :fixedDelays [{:milliseconds 20 :reasonAdjacent true}]
                             :fixedAttempts [{:condition "count<20"
                                              :reasonAdjacent true}]
                             :fixedWaitsBehaviorOnly true
                             :validResults (mapv #(hash-map :phase %)
                                                 ["setup" "workflow" "readiness"
                                                  "persistence" "observation"])}
                  :conservation {:targetsOnce true :tasksUnchanged true}}
        with-evidence (fn [value work]
                        (with-redefs-fn {#'vtd007/production-boundary (delay value)} work))]
    (with-evidence
      (assoc-in evidence [:surfaces 0 :productionFacts :phases]
                ["navigation" "installed reload"])
      #(is (thrown? Exception
                    (invoke {} "the shared side-panel harness currently owns local fixed-attempt readiness loops"
                            ["the shared side-panel harness"]))))
    (with-evidence
      (assoc-in evidence [:surfaces 0 :productionFacts :compoundPredicateOutcomes]
                [true true false false])
      #(is (thrown? Exception
                    (invoke {} "the shared side-panel harness currently owns local fixed-attempt readiness loops"
                            ["the shared side-panel harness"]))))
    (with-evidence
      (assoc-in evidence [:surfaces 0 :productionFacts :predicateOwner]
                "test/support/browser-observation-control.mjs")
      #(is (thrown? Exception
                    (invoke {} "the shared side-panel harness currently owns local fixed-attempt readiness loops"
                            ["the shared side-panel harness"]))))
    (with-evidence
      (assoc-in evidence [:timing :realRunners :flowFailure :activePhase] "readiness")
      #(let [world (invoke {} "a browser target records target setup, navigation, fixture, interaction, persistence, assertion, and cleanup when those phases apply" [])]
         (is (thrown? Exception
                      (invoke world "a failure retains completed phase durations and identifies the active partial phase" [])))))
    (doseq [mutated [(assoc-in evidence
                               [:timing :realRunners :flowFailure :timing :phaseNames]
                               ["navigation" "target setup"])
                     (assoc-in evidence
                               [:timing :realRunners :flowFailure :timing :durationMs] 11)
                     (assoc-in evidence
                               [:timing :realRunners :flowFailure :timing
                                :applicableNonZeroPhases]
                               ["target setup" "navigation" "interaction"])]]
      (with-evidence
        mutated
        #(let [world (invoke {} "a browser target records target setup, navigation, fixture, interaction, persistence, assertion, and cleanup when those phases apply" [])]
           (is (thrown? Exception
                        (invoke world "its target-scoped phase durations are finite, non-negative, ordered, and cover the target duration exactly once within rounding tolerance" []))))))
    (with-evidence
      (assoc-in evidence [:programs :validResults 0 :phase] "observation")
      #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
         (is (thrown? Exception
                      (invoke world "valid setup, workflow, readiness, persistence, and observation programs retain their current results" [])))))
    (with-evidence
      (assoc-in evidence [:programs :invalidTransmissionCount] 1)
      #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
         (is (thrown? Exception
                      (invoke world "it is rejected before transmission with its logical target and phase" [])))))
    (doseq [mutated [(assoc-in evidence [:programs :invalidCaseCount] 4)
                     (assoc-in evidence [:programs :protocolAdapters 0 :allValidated] false)]]
      (with-evidence
        mutated
        #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
           (is (thrown? Exception
                        (invoke world "it is rejected before transmission with its logical target and phase" []))))))
    (with-evidence
      (assoc-in evidence [:programs :fixedDelays 0 :reasonAdjacent] false)
      #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
         (is (thrown? Exception
                      (invoke world "fixed waits in those shared entry points remain only where elapsed time or animation is the behavior under test and the reason is adjacent" [])))))
    (doseq [mutated [(assoc-in evidence [:programs :fixedAttempts 0 :reasonAdjacent] false)
                     (update-in evidence [:programs :policyEntryPoints] pop)]]
      (with-evidence
        mutated
        #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
           (is (thrown? Exception
                        (invoke world "fixed waits in those shared entry points remain only where elapsed time or animation is the behavior under test and the reason is adjacent" []))))))
    (with-evidence
      (assoc-in evidence [:conservation :targetsOnce] false)
      #(let [world (invoke {} "VTD-007 adds one shared browser-observation control helper consumed transitively by all 20 runnable packs" [])]
         (is (thrown? Exception
                      (invoke world "every logical browser target, feature, and handler executes exactly once as before" [])))))
    (with-evidence
      (assoc-in evidence [:conservation :tasksUnchanged] false)
      #(let [world (invoke {} "VTD-007 adds one shared browser-observation control helper consumed transitively by all 20 runnable packs" [])]
         (is (thrown? Exception
                      (invoke world "the migration neither adds nor removes a planned task or evidence leaf in exact-pack and terminal-full scope" [])))))))

(deftest vtd009-scope-labels-and-history-changes-resolve-exactly
  (is (= 20 (#'vtd009/scope "every runnable pack")))
  (is (= ["flow_graph" "layered_schema"]
         (#'vtd009/scope "layered_schema and flow_graph")))
  (is (= ["capture dependant closure" "shell" "10 packs"]
         (#'vtd009/scope "capture dependant closure, shell, and 10 packs")))
  (is (= :deleteHelper
         (#'vtd009/history-key
          "delete test/support/layered-schema-usability-targets.mjs")))
  (is (= :renameToPlatform
         (#'vtd009/history-key
          "rename src/workspace-tabs-ui.ts to src/platform/workspace-tabs-ui.ts")))
  (is (= :unavailable (#'vtd009/history-key "modify an unrelated file"))))

(defn- assert-parsed-cross-pack-step-consumer!
  [{:keys [owner owner-feature handler consumer consumer-feature pattern step message]}]
  (let [packs [{:id owner
                :dependencies []
                :features [owner-feature]
                :isolatedVerificationHandlers [handler]}
               {:id consumer
                :dependencies [owner]
                :features [consumer-feature]}]]
    (with-redefs-fn {#'acceptance.verification-support.isolated-handler-audit/namespace-handlers
                     (constantly [{:pattern pattern}])}
      #(is (= [{:handler handler
                :consumerPack consumer
                :feature consumer-feature
                :step step}]
              (isolation-audit/loaded-cross-pack-step-consumers packs))
           message))))

(deftest event-library-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (assert-parsed-cross-pack-step-consumer!
   {:owner "event-library"
    :owner-feature "features/data-layer-event-template-library.feature"
    :handler "acceptance/src/acceptance/steps/event_template_library.clj"
    :consumer "project_event_transport"
    :consumer-feature "features/data-layer-project-event-transport-settings.feature"
    :pattern #"<project> is active"
    :step "<project> is active"
    :message "handler feature metadata cannot conceal a pattern matching a parsed dependant step"}))

(deftest capture-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (assert-parsed-cross-pack-step-consumer!
   {:owner "capture"
    :owner-feature "features/data-layer-event-feed-query-builder.feature"
    :handler "acceptance/src/acceptance/steps/event_feed_query.clj"
    :consumer "schemas"
    :consumer-feature "features/data-layer-schema-validation-workflow.feature"
    :pattern #"captured event event-7 has no matching automatic assignment or manual attachment"
    :step "captured event event-7 has no matching automatic assignment or manual attachment"
    :message "Capture feature metadata cannot conceal a parsed cross-pack step"}))

(deftest schemas-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (assert-parsed-cross-pack-step-consumer!
   {:owner "schemas"
    :owner-feature "features/data-layer-live-allowed-value-expansion.feature"
    :handler "acceptance/src/acceptance/steps/allowed_value_expansion.clj"
    :consumer "defects"
    :consumer-feature "features/data-layer-defect-library.feature"
    :pattern #"a testing session contains captured events with schema validation results"
    :step "a testing session contains captured events with schema validation results"
    :message "Schemas feature metadata cannot conceal a parsed cross-pack step"}))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-11T10:33:54.698500639+02:00", :module-hash "1865389853", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 10, :hash "1702029269"} {:id "form/1/load", :kind "load", :line 12, :end-line 12, :hash "1015067900"} {:id "form/2/load", :kind "load", :line 13, :end-line 13, :hash "1685151164"} {:id "def/feature-files", :kind "def", :line 15, :end-line 19, :hash "-21201147"} {:id "form/4/deftest", :kind "deftest", :line 21, :end-line 26, :hash "-244926829"} {:id "form/5/deftest", :kind "deftest", :line 28, :end-line 42, :hash "-328044063"} {:id "form/6/deftest", :kind "deftest", :line 44, :end-line 78, :hash "228982377"} {:id "form/7/deftest", :kind "deftest", :line 80, :end-line 96, :hash "-2078493593"} {:id "defn-/assert-dedicated-scenario-handlers!", :kind "defn-", :line 98, :end-line 106, :hash "1621011564"} {:id "form/9/deftest", :kind "deftest", :line 108, :end-line 109, :hash "245194227"} {:id "form/10/deftest", :kind "deftest", :line 111, :end-line 112, :hash "554417531"} {:id "form/11/deftest", :kind "deftest", :line 114, :end-line 115, :hash "1323694502"} {:id "form/12/deftest", :kind "deftest", :line 117, :end-line 118, :hash "138892075"} {:id "form/13/deftest", :kind "deftest", :line 120, :end-line 121, :hash "2013011596"} {:id "form/14/deftest", :kind "deftest", :line 123, :end-line 124, :hash "-1365660205"} {:id "form/15/deftest", :kind "deftest", :line 126, :end-line 127, :hash "-514588585"} {:id "form/16/deftest", :kind "deftest", :line 129, :end-line 130, :hash "-310595953"} {:id "form/17/deftest", :kind "deftest", :line 132, :end-line 133, :hash "802773267"} {:id "form/18/deftest", :kind "deftest", :line 135, :end-line 152, :hash "997833335"} {:id "form/19/deftest", :kind "deftest", :line 154, :end-line 169, :hash "-1885039904"} {:id "form/20/deftest", :kind "deftest", :line 171, :end-line 309, :hash "463997460"} {:id "form/21/deftest", :kind "deftest", :line 311, :end-line 323, :hash "1260497997"} {:id "defn-/assert-parsed-cross-pack-step-consumer!", :kind "defn-", :line 325, :end-line 341, :hash "571745781"} {:id "form/23/deftest", :kind "deftest", :line 343, :end-line 352, :hash "-1052248530"} {:id "form/24/deftest", :kind "deftest", :line 354, :end-line 363, :hash "130986114"} {:id "form/25/deftest", :kind "deftest", :line 365, :end-line 374, :hash "1719726216"}]}
;; clj-mutate-manifest-end
