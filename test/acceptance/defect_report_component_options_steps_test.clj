(ns acceptance.defect-report-component-options-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-report-component-options :as component-options]
            [clojure.test :refer [deftest is]]))

(deftest verifies-defect-report-component-options-features
  (feature-support/verify-feature-suite!
   component-options/feature-files component-options/handlers all/handlers))

(deftest entry-handlers-only-apply-to-component-option-features
  (doseq [entry-step component-options/entry-steps
          :let [handler (first (filter #(re-matches (:pattern %) entry-step)
                                       component-options/handlers))
                applies? (:applies? handler)]]
    (is (true? (boolean (applies? #:acceptance{:feature-name "Data layer defect report component options"}))))
    (is (false? (boolean (applies? #:acceptance{:feature-name "Data layer defect report provenance presentation runtime"}))))))
