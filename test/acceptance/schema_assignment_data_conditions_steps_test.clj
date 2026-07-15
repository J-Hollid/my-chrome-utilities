(ns acceptance.schema-assignment-data-conditions-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-assignment-data-conditions :as assignment-conditions]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-assignment-data-conditions-features
  (feature-support/verify-feature-suite!
   assignment-conditions/feature-files assignment-conditions/handlers all/handlers))
