(ns acceptance.schema-specification-builder-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-specification-builder :as specification-builder]
            [clojure.test :refer [deftest]]))
(deftest verifies-schema-specification-builder-features
  (feature-support/verify-feature-suite! specification-builder/feature-files specification-builder/handlers all/handlers))
