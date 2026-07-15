(ns acceptance.schema-property-example-values-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-property-example-values :as example-values]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-property-example-values-features
  (feature-support/verify-feature-suite!
   example-values/feature-files example-values/handlers all/handlers))
