(ns acceptance.defect-report-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-report :as defect-report]
            [clojure.test :refer [deftest]]))

(deftest verifies-defect-report-features
  (feature-support/verify-feature-suite!
   defect-report/feature-files defect-report/handlers all/handlers))
