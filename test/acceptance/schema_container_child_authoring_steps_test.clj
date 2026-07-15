(ns acceptance.schema-container-child-authoring-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-container-child-authoring :as child-authoring]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-container-child-authoring-features
  (feature-support/verify-feature-suite!
   child-authoring/feature-files child-authoring/handlers all/handlers))
