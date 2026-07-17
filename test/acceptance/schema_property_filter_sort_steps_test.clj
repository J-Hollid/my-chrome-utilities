(ns acceptance.schema-property-filter-sort-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-property-filter-sort :as property-filter-sort]
            [clojure.test :refer [deftest is]]))

(deftest verifies-schema-property-filter-sort-features
  (feature-support/verify-feature-suite!
   property-filter-sort/feature-files property-filter-sort/handlers all/handlers))

(deftest entry-handlers-only-apply-to-filter-sort-features
  (doseq [entry-step property-filter-sort/entry-steps
          :let [handler (first (filter #(re-matches (:pattern %) entry-step)
                                       property-filter-sort/handlers))
                applies? (:applies? handler)]]
    (is (true? (applies? #:acceptance{:feature-name "Data layer schema property filtering and sorting"})))
    (is (false? (applies? #:acceptance{:feature-name "Data layer schema rule property identity"})))))
