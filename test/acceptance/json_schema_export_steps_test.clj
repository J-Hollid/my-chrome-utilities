(ns acceptance.json-schema-export-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.json-schema-export :as json-schema-export]
            [clojure.test :refer [deftest]]))

(deftest verifies-json-schema-export-features
  (feature-support/verify-feature-suite!
   json-schema-export/feature-files json-schema-export/handlers all/handlers))
