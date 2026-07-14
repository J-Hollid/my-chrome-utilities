(ns acceptance.local-rule-promotion-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.local-rule-promotion :as promotion]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [deftest is]]))

(deftest verifies-local-rule-promotion-features
  (is (set/subset? (set promotion/handlers) (set all/handlers)))
  (doseq [feature-file promotion/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          promotion/handlers)))
        feature-file)))
