(ns acceptance.recursive-declared-property-validation-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.recursive-declared-property-validation :as recursive]
            [clojure.test :refer [deftest]]))

(deftest verifies-recursive-declared-property-validation-features
  (feature-support/verify-feature-suite!
   recursive/feature-files recursive/handlers all/handlers))
