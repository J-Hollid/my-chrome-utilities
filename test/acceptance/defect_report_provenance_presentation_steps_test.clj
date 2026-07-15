(ns acceptance.defect-report-provenance-presentation-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-report-provenance-presentation :as provenance]
            [clojure.test :refer [deftest]]))

(deftest verifies-defect-report-provenance-presentation-features
  (feature-support/verify-feature-suite!
   provenance/feature-files provenance/handlers all/handlers))
