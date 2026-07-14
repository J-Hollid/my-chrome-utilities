(ns acceptance.unified-defect-builder-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.unified-defect-builder :as unified]
            [clojure.test :refer [deftest]]))

(deftest verifies-unified-defect-builder-features
  (feature-support/verify-feature-suite!
   unified/feature-files unified/handlers all/handlers))
