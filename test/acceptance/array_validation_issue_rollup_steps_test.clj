(ns acceptance.array-validation-issue-rollup-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.array-validation-issue-rollup :as rollup]
            [clojure.test :refer [deftest]]))

(deftest verifies-array-validation-issue-rollup-features
  (feature-support/verify-feature-suite!
   rollup/feature-files rollup/handlers all/handlers))
