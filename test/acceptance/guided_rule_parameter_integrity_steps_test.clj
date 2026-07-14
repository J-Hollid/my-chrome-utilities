(ns acceptance.guided-rule-parameter-integrity-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.guided-rule-parameter-integrity :as integrity]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest verifies-guided-rule-parameter-integrity-features
  (doseq [feature-file integrity/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          integrity/handlers)))
        feature-file)))
