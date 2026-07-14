(ns acceptance.unified-defect-builder-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.unified-defect-builder :as unified]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [deftest is]]))

(deftest verifies-unified-defect-builder-features
  (is (set/subset? (set unified/handlers) (set all/handlers)))
  (doseq [feature-file unified/feature-files]
    (is (= :passed (:status (runtime/run-feature! (gherkin/parse-file feature-file) unified/handlers))) feature-file)))
