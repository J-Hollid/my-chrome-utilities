(ns acceptance.modular-architecture-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.modular-architecture :as modular]
            [acceptance.verification-support.isolated-handler-audit :as isolation-audit]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

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

(deftest event-library-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (let [packs [{:id "event-library"
                :dependencies []
                :features ["features/data-layer-event-template-library.feature"]
                :isolatedVerificationHandlers ["acceptance/src/acceptance/steps/event_template_library.clj"]}
               {:id "project_event_transport"
                :dependencies ["event-library"]
                :features ["features/data-layer-project-event-transport-settings.feature"]}]]
    (with-redefs-fn {#'acceptance.verification-support.isolated-handler-audit/namespace-handlers
                     (constantly [{:pattern #"<project> is active"}])}
      #(is (= [{:handler "acceptance/src/acceptance/steps/event_template_library.clj"
                :consumerPack "project_event_transport"
                :feature "features/data-layer-project-event-transport-settings.feature"
                :step "<project> is active"}]
              (isolation-audit/loaded-cross-pack-step-consumers packs))
           "handler feature metadata cannot conceal a pattern matching a parsed dependant step"))))

(deftest capture-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (let [packs [{:id "capture"
                :dependencies []
                :features ["features/data-layer-event-feed-query-builder.feature"]
                :isolatedVerificationHandlers ["acceptance/src/acceptance/steps/event_feed_query.clj"]}
               {:id "schemas"
                :dependencies ["capture"]
                :features ["features/data-layer-schema-validation-workflow.feature"]}]]
    (with-redefs-fn {#'acceptance.verification-support.isolated-handler-audit/namespace-handlers
                     (constantly [{:pattern #"captured event event-7 has no matching automatic assignment or manual attachment"}])}
      #(is (= [{:handler "acceptance/src/acceptance/steps/event_feed_query.clj"
                :consumerPack "schemas"
                :feature "features/data-layer-schema-validation-workflow.feature"
                :step "captured event event-7 has no matching automatic assignment or manual attachment"}]
              (isolation-audit/loaded-cross-pack-step-consumers packs))
           "Capture feature metadata cannot conceal a parsed cross-pack step"))))
