(ns acceptance.missing-event-defect-report-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.missing-event-defect-report :as missing-event]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest registers-missing-event-defect-report-handlers
  (let [registered (set all/handlers)]
    (doseq [handler missing-event/handlers]
      (is (contains? registered handler)))))

(deftest verifies-missing-event-defect-report-features
  (is (every? (fn [feature-file]
                (= :passed
                   (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                                  missing-event/handlers))))
              missing-event/feature-files)))
