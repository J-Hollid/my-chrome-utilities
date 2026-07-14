(ns acceptance.schema-rule-property-identity-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-rule-property-identity :as identity]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-rule-property-identity-features
  (feature-support/verify-feature-suite!
   identity/feature-files identity/handlers all/handlers))
