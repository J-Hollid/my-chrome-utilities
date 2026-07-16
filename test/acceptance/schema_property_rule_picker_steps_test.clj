(ns acceptance.schema-property-rule-picker-steps-test
  (:require [acceptance.steps.schema-property-rule-picker :as picker]
            [clojure.test :refer [deftest is]]))

(deftest dispatches-property-rule-example-assertions
  (is (nil? (#'picker/assert-example!
             {"property_name" "page_type" "property_type" "string" "rule_type" "Required" "availability" "available"}
             {:availability {(keyword "string:Required") "available"}})))
  (is (nil? (#'picker/assert-example!
             {"query" "Approved pages" "matched_metadata" "rule name"}
             {:searches {(keyword "rule name") ["Approved pages version 2"]}})))
  (is (nil? (#'picker/assert-example!
             {"property_name" "items" "property_type" "array" "rule_type" "Item count" "parameter_controls" "Comparison and non-negative Limit"}
             {:configurationControls {(keyword "array:Item count") "Comparison and non-negative Limit"}})))
  (is (nil? (#'picker/assert-example!
             {"rule_type" "Numeric range"
              "configuration" "minimum 10 maximum 20"
              "creation_result" "available"
              "assistance" "Ready to create rule"}
             {:validations {(keyword "Numeric range:minimum 10 maximum 20")
                            {:creationResult "available" :assistance "Ready to create rule"}}})))
  (is (nil? (#'picker/assert-example!
             {"picker_input" "Escape" "selection_outcome" "no rule is created or attached"}
             {:keyboard {:escapeClosed true}})))
  (is (nil? (#'picker/assert-example!
             {"navigation_action" "Cancel"
              "selection_outcome" "the dialog closes and focus returns to Add rule for product.sku"}
             {:navigation {:cancel {:closed true :focusReturned true}}}))))
