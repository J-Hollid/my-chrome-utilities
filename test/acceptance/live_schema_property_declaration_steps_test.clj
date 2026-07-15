(ns acceptance.live-schema-property-declaration-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.live-schema-property-declaration :as declaration]
            [clojure.test :refer [deftest]]))
(deftest verifies-live-schema-property-declaration
  (feature-support/verify-feature-suite! declaration/feature-files declaration/handlers all/handlers))
