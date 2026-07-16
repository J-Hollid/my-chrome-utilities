(ns acceptance.allowed-values-rule-migration-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.allowed-values-rule-migration :as migration]
            [clojure.test :refer [deftest]]))

(deftest verifies-allowed-values-rule-migration-features
  (feature-support/verify-feature-suite! migration/feature-files migration/handlers all/handlers))
