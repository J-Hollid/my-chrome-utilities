(ns acceptance.modular-architecture-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.modular-architecture :as modular]
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
