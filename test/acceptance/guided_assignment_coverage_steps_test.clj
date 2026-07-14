(ns acceptance.guided-assignment-coverage-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.guided-assignment-coverage :as coverage]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-guided-assignment-coverage-step
  (let [feature (gherkin/parse-file coverage/feature-file)
        texts (map :text (concat (:background feature)
                                 (mapcat :steps (:scenarios feature))))]
    (doseq [text texts]
      (is (some #(re-matches (:pattern %) text) coverage/handlers) text))))

(deftest binds-every-guided-assignment-example-to-browser-evidence
  (let [feature (gherkin/parse-file coverage/feature-file)
        observation (coverage/browser-observation!)]
    (doseq [{:keys [example]} (runtime/expand-executions feature)]
      (is (= observation (coverage/validate-example! example observation))))))

(deftest validates-production-guided-assignment-boundaries
  (is (map? (coverage/validate-browser-observation!
             (coverage/browser-observation!)))))
