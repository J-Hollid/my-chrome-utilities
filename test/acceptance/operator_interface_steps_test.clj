(ns acceptance.operator-interface-steps-test
  (:require [acceptance.steps.operator-interface :as operator]
            [acceptance.steps.operator-interface-support :as operator-support]
            [clojure.test :refer [deftest is]]))

(deftest operator-shell-has-authored-accessible-styles (is (operator/operator-shell-wired? ".")))

(deftest schema-examples-belong-to-the-operator-domain
  (doseq [example [{"condition_kind" "domain exact"
                    "condition" "shop.example"
                    "page_url" "https://shop.example/products"
                    "match_result" "match"}
                   {"version_policy" "follow latest"
                    "assignment_behavior" "use version 5 after explicit compatibility review"}
                   {"rule_kind" "allowed values"
                    "parameters" "page, product, checkout"
                    "accepted_value" "product"
                    "rejected_value" "internal"}]]
    (is (= example (operator-support/validate-example! example (keys example))))))
