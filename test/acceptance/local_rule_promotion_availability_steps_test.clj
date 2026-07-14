(ns acceptance.local-rule-promotion-availability-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.local-rule-promotion-availability :as availability]
            [clojure.test :refer [deftest]]))

(deftest verifies-local-rule-promotion-availability-features
  (feature-support/verify-feature-suite!
   availability/feature-files availability/handlers all/handlers))
