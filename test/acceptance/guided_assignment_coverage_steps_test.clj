(ns acceptance.guided-assignment-coverage-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.feature-support :as feature-support]
            [acceptance.steps.guided-assignment-coverage :as coverage]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-guided-assignment-coverage-step
  (doseq [text (feature-support/step-texts coverage/feature-file)]
    (is (some #(re-matches (:pattern %) text) coverage/handlers) text)))

(deftest binds-every-guided-assignment-example-to-browser-evidence
  (let [feature (gherkin/parse-file coverage/feature-file)
        observation (coverage/browser-observation!)]
    (doseq [{:keys [example]} (runtime/expand-executions feature)]
      (is (= observation (coverage/validate-example! example observation))))))

(deftest validates-production-guided-assignment-boundaries
  (is (map? (coverage/validate-browser-observation!
             (coverage/browser-observation!)))))
