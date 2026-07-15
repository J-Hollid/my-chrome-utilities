(ns acceptance.defect-report-semantic-differences-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-report-semantic-differences :as differences]
            [clojure.test :refer [deftest]]))

(deftest verifies-defect-report-semantic-difference-features
  (feature-support/verify-feature-suite!
   differences/feature-files differences/handlers all/handlers))
