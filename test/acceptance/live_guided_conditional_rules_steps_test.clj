(ns acceptance.live-guided-conditional-rules-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.live-guided-conditional-rules :as guided-conditional]
            [clojure.test :refer [deftest]]))

(deftest verifies-live-guided-conditional-rule-features
  (feature-support/verify-feature-suite!
   guided-conditional/feature-files guided-conditional/handlers all/handlers))
