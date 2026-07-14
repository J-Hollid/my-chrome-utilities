(ns acceptance.allowed-value-expansion-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.allowed-value-expansion :as expansion]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [deftest is]]))

(deftest verifies-allowed-value-expansion-features
  (is (set/subset? (set expansion/handlers) (set all/handlers)))
  (doseq [feature-file expansion/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          expansion/handlers)))
        feature-file)))
