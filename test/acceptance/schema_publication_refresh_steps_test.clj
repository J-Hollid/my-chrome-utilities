(ns acceptance.schema-publication-refresh-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-publication-refresh :as publication]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [deftest is]]))

(deftest verifies-schema-publication-refresh-features
  (is (set/subset? (set publication/handlers) (set all/handlers)))
  (doseq [feature-file publication/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          publication/handlers)))
        feature-file)))
