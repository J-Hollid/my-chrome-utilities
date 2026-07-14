(ns acceptance.allowed-value-expansion-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.allowed-value-expansion :as expansion]
            [clojure.test :refer [deftest]]))

(deftest verifies-allowed-value-expansion-features
  (feature-support/verify-feature-suite!
   expansion/feature-files expansion/handlers all/handlers))
