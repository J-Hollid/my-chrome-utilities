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
  (testing "each specified row requires matching fixture evidence"
    (let [observation {:outlineRows authoritative-rows}]
      (doseq [row authoritative-rows]
        (is (= row (live-flow/validate-observed-example! row observation)))))
    (is (thrown? Exception
                 (live-flow/validate-observed-example!
                  (first authoritative-rows)
                  {:outlineRows (rest authoritative-rows)})))
    (is (thrown? Exception
                 (live-flow/validate-observed-example!
                  (first authoritative-rows)
                  {}))))
  (testing "changing any one of the 18 outline values is rejected"
    (let [mutants (for [row authoritative-rows
                        key (keys row)]
                    (update row key str " mutated"))]
      (is (= 18 (count mutants)))
      (doseq [mutant mutants]
        (is (thrown? Exception
                     (live-flow/validate-observed-example!
                      mutant
                      {:outlineRows authoritative-rows}))))))
  (testing "scenarios without outline parameters remain valid"
    (is (= {} (live-flow/validate-observed-example! {} {:outlineRows []})))))

(deftest selects-observed-rows-by-contract-mode
  (let [model-row (first authoritative-rows)
        runtime-row (second authoritative-rows)]
    (reset! live-flow/model-observation {:outlineRows [model-row]})
    (reset! live-flow/browser-observation {:outlineRows [runtime-row]})
    (try
      (is (= model-row (live-flow/validate-example! :model model-row)))
      (is (= runtime-row (live-flow/validate-example! :runtime runtime-row)))
      (is (thrown? Exception
                   (live-flow/validate-example! :model runtime-row)))
      (is (thrown? Exception
                   (live-flow/validate-example! :runtime model-row)))
      (finally
        (reset! live-flow/model-observation nil)
        (reset! live-flow/browser-observation nil)))))
