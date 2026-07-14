(ns acceptance.missing-event-defect-report-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.missing-event-defect-report :as missing-event]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest verifies-missing-event-defect-report-features
  (doseq [feature-file missing-event/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          missing-event/handlers)))
        feature-file)))
