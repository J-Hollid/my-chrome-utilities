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
    (is (identical? inspected (#'modular/inspect! inspected)))))
