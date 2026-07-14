(ns acceptance.missing-event-report-fidelity-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.missing-event-report-fidelity :as fidelity]
            [clojure.test :refer [deftest]]))

(deftest verifies-missing-event-report-fidelity-features
  (feature-support/verify-feature-suite!
   fidelity/feature-files fidelity/handlers all/handlers))
