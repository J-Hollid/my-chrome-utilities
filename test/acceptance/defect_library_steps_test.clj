(ns acceptance.defect-library-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.defect-library :as defect-library]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest verifies-defect-library-features
  (doseq [feature-file defect-library/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          defect-library/handlers)))
        feature-file)))
