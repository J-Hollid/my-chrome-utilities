(ns acceptance.schema-specification-container-defaults-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-specification-container-defaults :as defaults]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-specification-container-defaults-features
  (feature-support/verify-feature-suite! defaults/feature-files defaults/handlers all/handlers))
