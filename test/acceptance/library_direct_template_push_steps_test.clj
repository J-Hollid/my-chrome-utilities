(ns acceptance.library-direct-template-push-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.library-direct-template-push :as direct-push]
            [clojure.test :refer [deftest]]))

(deftest verifies-library-direct-template-push-features
  (feature-support/verify-feature-suite!
   direct-push/feature-files direct-push/handlers all/handlers))
