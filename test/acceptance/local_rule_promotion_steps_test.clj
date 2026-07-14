(ns acceptance.local-rule-promotion-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.local-rule-promotion :as promotion]
            [clojure.test :refer [deftest]]))

(deftest verifies-local-rule-promotion-features
  (feature-support/verify-feature-suite!
   promotion/feature-files promotion/handlers all/handlers))
