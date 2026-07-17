(ns acceptance.non-applicable-property-visibility-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.non-applicable-property-visibility :as visibility]
            [clojure.test :refer [deftest]]))

(deftest verifies-non-applicable-property-visibility-features
  (feature-support/verify-feature-suite!
   visibility/feature-files visibility/handlers all/handlers))
