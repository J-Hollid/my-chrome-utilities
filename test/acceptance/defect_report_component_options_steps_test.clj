(ns acceptance.defect-report-component-options-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-report-component-options :as component-options]
            [clojure.test :refer [deftest]]))

(deftest verifies-defect-report-component-options-features
  (feature-support/verify-feature-suite!
   component-options/feature-files component-options/handlers all/handlers))
