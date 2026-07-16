(ns acceptance.schema-nested-path-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-nested-path :as nested-path]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-nested-path-features
  (feature-support/verify-feature-suite! nested-path/feature-files nested-path/handlers all/handlers))
