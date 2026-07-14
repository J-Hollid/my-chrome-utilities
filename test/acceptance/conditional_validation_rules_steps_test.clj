(ns acceptance.conditional-validation-rules-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.conditional-validation-rules :as conditional]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-conditional-validation-step
  (doseq [feature-file conditional/feature-files
          :let [feature (gherkin/parse-file feature-file)]
          text (map :text (concat (:background feature) (mapcat :steps (:scenarios feature))))]
    (is (some #(re-matches (:pattern %) text) conditional/handlers) text)))

(deftest binds-every-conditional-validation-example
  (let [observation (conditional/browser-observation!)]
    (doseq [feature-file conditional/feature-files
            {:keys [example]} (runtime/expand-executions (gherkin/parse-file feature-file))]
      (is (= observation (conditional/validate-example! example observation))))))

(deftest validates-built-conditional-boundaries
  (is (map? (conditional/validate-browser-observation!
             (conditional/browser-observation!)))))
