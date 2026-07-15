(ns acceptance.event-occurrence-defect-report-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.event-occurrence-defect-report :as occurrence]
            [clojure.test :refer [deftest]]))

(deftest verifies-event-occurrence-defect-report-features
  (feature-support/verify-feature-suite!
   occurrence/feature-files occurrence/handlers all/handlers))
