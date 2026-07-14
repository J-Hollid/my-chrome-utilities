(ns acceptance.schema-documentation-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.feature-support :as feature-support]
            [acceptance.steps.schema-documentation :as documentation]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-schema-documentation-step
  (doseq [text (feature-support/unhandled-step-texts documentation/feature-files documentation/handlers)]
    (is false text)))

(deftest binds-every-schema-documentation-example
  (let [observation (documentation/browser-observation!)]
    (doseq [feature-file documentation/feature-files
            {:keys [example]} (runtime/expand-executions (gherkin/parse-file feature-file))]
      (is (= observation (documentation/validate-example! example observation))))))

(deftest validates-built-schema-documentation-boundaries
  (is (map? (documentation/validate-browser-observation!
             (documentation/browser-observation!)))))
