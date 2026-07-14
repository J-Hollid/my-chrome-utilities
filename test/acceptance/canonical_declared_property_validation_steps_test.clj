(ns acceptance.canonical-declared-property-validation-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.canonical-declared-property-validation :as canonical]
            [clojure.test :refer [deftest]]))

(deftest verifies-canonical-declared-property-validation-features
  (feature-support/verify-feature-suite!
   canonical/feature-files canonical/handlers all/handlers))
