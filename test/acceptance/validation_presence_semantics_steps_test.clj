(ns acceptance.validation-presence-semantics-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.validation-presence-semantics :as presence]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest verifies-validation-presence-semantics-features
  (doseq [feature-file presence/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          presence/handlers)))
        feature-file)))
