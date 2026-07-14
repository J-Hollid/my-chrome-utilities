(ns acceptance.missing-event-payload-hardening-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.missing-event-payload-hardening :as hardening]
            [clojure.test :refer [deftest]]))

(deftest verifies-missing-event-payload-hardening-features
  (feature-support/verify-feature-suite!
   hardening/feature-files hardening/handlers all/handlers))
