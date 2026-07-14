(ns acceptance.conditional-validation-rules-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.feature-support :as feature-support]
            [acceptance.steps.conditional-validation-rules :as conditional]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-conditional-validation-step
  (doseq [text (feature-support/unhandled-step-texts conditional/feature-files conditional/handlers)]
    (is false text)))

(deftest binds-every-conditional-validation-example
  (let [observation (conditional/browser-observation!)]
    (doseq [feature-file conditional/feature-files
            {:keys [example]} (runtime/expand-executions (gherkin/parse-file feature-file))]
      (is (= observation (conditional/validate-example! example observation))))))

(deftest validates-built-conditional-boundaries
  (is (map? (conditional/validate-browser-observation!
             (conditional/browser-observation!)))))
