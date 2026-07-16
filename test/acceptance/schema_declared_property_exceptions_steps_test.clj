(ns acceptance.schema-declared-property-exceptions-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-declared-property-exceptions :as exceptions]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-declared-property-exceptions-feature
  (feature-support/verify-feature-suite!
   [exceptions/feature-file] exceptions/handlers all/handlers))
