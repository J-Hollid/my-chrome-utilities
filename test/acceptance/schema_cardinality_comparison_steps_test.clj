(ns acceptance.schema-cardinality-comparison-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-cardinality-comparison :as cardinality]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-cardinality-comparison-feature
  (feature-support/verify-feature-suite!
   [cardinality/feature-file] cardinality/handlers all/handlers))
