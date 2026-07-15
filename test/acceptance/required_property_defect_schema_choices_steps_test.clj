(ns acceptance.required-property-defect-schema-choices-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.required-property-defect-schema-choices :as choices]
            [clojure.test :refer [deftest]]))

(deftest verifies-required-property-defect-schema-choice-features
  (feature-support/verify-feature-suite!
   choices/feature-files choices/handlers all/handlers))
