(ns acceptance.schema-documentation-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.schema-documentation :as documentation]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-schema-documentation-step
  (doseq [feature-file documentation/feature-files
          :let [feature (gherkin/parse-file feature-file)]
          text (map :text (concat (:background feature) (mapcat :steps (:scenarios feature))))]
    (is (some #(re-matches (:pattern %) text) documentation/handlers) text)))

(deftest binds-every-schema-documentation-example
  (let [observation (documentation/browser-observation!)]
    (doseq [feature-file documentation/feature-files
            {:keys [example]} (runtime/expand-executions (gherkin/parse-file feature-file))]
      (is (= observation (documentation/validate-example! example observation))))))

(deftest validates-built-schema-documentation-boundaries
  (is (map? (documentation/validate-browser-observation!
             (documentation/browser-observation!)))))
