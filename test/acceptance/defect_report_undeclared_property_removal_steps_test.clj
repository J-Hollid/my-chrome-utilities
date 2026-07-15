(ns acceptance.defect-report-undeclared-property-removal-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-report-undeclared-property-removal :as removal]
            [clojure.test :refer [deftest]]))

(deftest verifies-defect-report-undeclared-property-removal-features
  (feature-support/verify-feature-suite!
   removal/feature-files removal/handlers all/handlers))
