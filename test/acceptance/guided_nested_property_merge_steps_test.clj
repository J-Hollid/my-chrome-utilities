(ns acceptance.guided-nested-property-merge-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.guided-nested-property-merge :as nested-merge]
            [clojure.test :refer [deftest]]))

(deftest verifies-guided-nested-property-merge-features
  (feature-support/verify-feature-suite!
   nested-merge/feature-files nested-merge/handlers all/handlers))
