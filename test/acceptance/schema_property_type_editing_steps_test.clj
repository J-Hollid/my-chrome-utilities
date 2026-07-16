(ns acceptance.schema-property-type-editing-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-property-type-editing :as type-editing]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-property-type-editing-features
  (feature-support/verify-feature-suite!
   type-editing/feature-files type-editing/handlers all/handlers))
