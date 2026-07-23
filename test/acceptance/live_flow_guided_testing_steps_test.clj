(ns acceptance.live-flow-guided-testing-steps-test
  (:require [acceptance.steps.live-flow-guided-testing :as live-flow]
            [clojure.test :refer [deftest is testing]]))

(def authoritative-rows
  [{"relationship_kind" "expected_next"
    "next_step" "Payment Page frame"
    "label_state" "no label"
    "display_name" "Cart to Payment"}
   {"relationship_kind" "alternative"
    "next_step" "Cart PayPal Event occurrence"
    "label_state" "label PayPal route"
    "display_name" "PayPal route"}
   {"relationship_kind" "merge"
    "next_step" "Confirmation Page frame"
    "label_state" "no label"
    "display_name" "Cart to Confirmation"}
   {"flow_step" "Payment Page frame"
    "effective_schema" "its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution"}
   {"flow_step" "Payment add_payment_info occurrence"
    "effective_schema" "its Page-instance branch, Event branch, and Event-occurrence contribution"}
   {"capture_order" "before"}
   {"capture_order" "after"}])

(deftest validates-every-live-flow-outline-value
  (testing "both contracts accept every specified row"
    (doseq [mode [:model :runtime]
            row authoritative-rows]
      (is (= row (live-flow/validate-example! mode row)))))
  (testing "changing any one of the 18 outline values is rejected"
    (let [mutants (for [row authoritative-rows
                        key (keys row)]
                    (update row key str " mutated"))]
      (is (= 18 (count mutants)))
      (doseq [mode [:model :runtime]
              mutant mutants]
        (is (thrown? Exception
                     (live-flow/validate-example! mode mutant))))))
  (testing "scenarios without outline parameters remain valid"
    (is (= {} (live-flow/validate-example! :model {})))))
