(ns acceptance.validation-presence-semantics-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.validation-presence-semantics :as presence]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [deftest is]]))

(deftest registers-validation-presence-semantics-handlers
  (is (set/subset? (set presence/handlers) (set all/handlers))))

(deftest verifies-validation-presence-semantics-features
  (is (not-any? (fn [feature-file]
                  (not= :passed
                        (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                                       presence/handlers))))
                presence/feature-files)))
