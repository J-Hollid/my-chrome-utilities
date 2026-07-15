(ns acceptance.schema-renaming-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-renaming :as schema-renaming]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-renaming-features
  (feature-support/verify-feature-suite!
   schema-renaming/feature-files schema-renaming/handlers all/handlers))
