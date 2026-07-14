(ns acceptance.cross-tab-reattachment-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.cross-tab-reattachment :as reattachment]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-cross-tab-reattachment-step-with-regex-handlers
  (let [feature (gherkin/parse-file reattachment/feature-file)
        texts (map :text (concat (:background feature)
                                 (mapcat :steps (:scenarios feature))))]
    (doseq [text texts]
      (is (some #(re-matches (:pattern %) text) reattachment/handlers) text))))

(deftest binds-every-cross-tab-example-to-production-runtime-observations
  (let [feature (gherkin/parse-file reattachment/feature-file)
        observation (reattachment/runtime-observation!)]
    (doseq [{:keys [example]} (runtime/expand-executions feature)]
      (is (= observation
             (reattachment/validate-example! example observation))))))

(deftest validates-cross-tab-production-boundaries
  (is (= 6 (count (:cases
                   (reattachment/validate-runtime-observation!
                    (reattachment/runtime-observation!)))))))
