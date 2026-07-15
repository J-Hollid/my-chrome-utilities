(ns acceptance.schema-property-filter-sort-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-property-filter-sort :as property-filter-sort]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-property-filter-sort-features
  (feature-support/verify-feature-suite!
   property-filter-sort/feature-files property-filter-sort/handlers all/handlers))
