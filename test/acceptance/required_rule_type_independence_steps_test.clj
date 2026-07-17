(ns acceptance.required-rule-type-independence-steps-test
  (:require [acceptance.steps.required-rule-type-independence]
            [clojure.test :refer [deftest is]]))

(defn- runtime-assertion []
  (deref (ns-resolve 'acceptance.steps.required-rule-type-independence
                     'assert-runtime!)))

(defn- example-validator []
  (deref (ns-resolve 'acceptance.steps.required-rule-type-independence
                     'validate-example!)))

(deftest validates-required-rule-type-independence-runtime-observation
  (let [offered (mapv (fn [path]
                        {:path path
                         :enabled true
                         :metadata "Required · type any · version 3"})
                      ["/title" "/quantity" "/consented" "/customer" "/products"])
        attachments (mapv (fn [path]
                            {:id "reusable-required-7"
                             :version 3
                             :propertyPath path})
                          ["/title" "/quantity" "/consented" "/customer" "/products"])
        observed {:offered offered
                  :attachments attachments
                  :libraryCount 1
                  :ruleUnchanged true
                  :reloadPreserved true
                  :validation {:missingStatuses (vec (repeat 5 "error"))
                               :presentStatuses (vec (repeat 5 "pass"))
                               :notApplicableStatuses (vec (repeat 5 "not-applicable"))
                               :presentIssues 0
                               :notApplicableIssues 0}}]
    (is (= observed ((runtime-assertion) observed)))))

(deftest validates-required-rule-type-independence-example-contract
  (let [validate (example-validator)
        attachment {"property_path" "/quantity"
                    "property_type" "number"}
        evaluation {"property_type" "array"
                    "page_type_value" "category"
                    "property_state" "missing"
                    "rule_result" "Not applicable"
                    "issue_count" "0"}
        picker {"rule_definition" "Numeric range type number"
                "property_type" "string"
                "picker_outcome" "no attachment action for that reusable rule"}]
    (is (= attachment (validate :model attachment)))
    (is (= evaluation (validate :model evaluation)))
    (is (= picker (validate :runtime picker)))
    (is (thrown? Exception
                 (validate :model (assoc attachment "property_type" "object"))))
    (is (thrown? Exception
                 (validate :model (assoc evaluation "rule_result" "Passed"))))
    (is (thrown? Exception
                 (validate :runtime (assoc picker "property_type" "boolean"))))))
