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
