(ns acceptance.schema-property-copy-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-property-copy :as property-copy]
            [clojure.test :refer [deftest]]))
(deftest verifies-schema-property-copy-features
  (feature-support/verify-feature-suite! property-copy/feature-files property-copy/handlers all/handlers))
