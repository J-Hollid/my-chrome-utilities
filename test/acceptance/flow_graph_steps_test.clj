(ns acceptance.flow-graph-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.flow-graph :as flow-graph]
            [clojure.test :refer [deftest is]]))

(deftest graph-namespace-owns-every-active-graph-step
  (is (empty? (feature-support/unhandled-step-texts flow-graph/feature-files flow-graph/handlers))))

(def complete-evidence
  (assoc (into {} (map (fn [number] [(keyword (format "runtime%03d" number)) {:exact true}]) (range 1 25)))
         :installedBoundary true))

(deftest evidence-maps-cannot-pass-vacuously
  (is (false? (boolean (flow-graph/all-true? nil))))
  (is (false? (boolean (flow-graph/all-true? {}))))
  (is (false? (boolean (flow-graph/all-true? {:exact false}))))
  (is (true? (boolean (flow-graph/all-true? {:first true :second true})))))

(deftest browser-evidence-requires-every-exact-category
  (is (false? (boolean (flow-graph/complete-browser-evidence? nil))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? {}))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (dissoc complete-evidence :runtime020)))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (assoc complete-evidence :runtime025 {:exact true})))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (dissoc complete-evidence :installedBoundary)))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (assoc-in complete-evidence [:runtime021 :exact] false)))))
  (is (true? (boolean (flow-graph/complete-browser-evidence? complete-evidence)))))

(deftest runtime009-examples-have-distinct-evidence-keys
  (is (= :pageContextExpectedNext (flow-graph/runtime009-example-key {"source" "Customer details Page" "source_port" "right" "target" "Payment Page" "target_port" "left" "kind" "expected_next"})))
  (is (= :pageToEventAlternative (flow-graph/runtime009-example-key {"source" "Customer details Page" "source_port" "top" "target" "Customer details add_payment_info" "target_port" "bottom" "kind" "alternative"})))
  (is (= :eventToPageMerge (flow-graph/runtime009-example-key {"source" "Customer details add_payment_info" "source_port" "bottom" "target" "Payment Page" "target_port" "top" "kind" "merge"})))
  (is (= :eventInteractionExpectedNext (flow-graph/runtime009-example-key {"source" "Customer details page_view" "source_port" "right" "target" "Customer details add_payment_info" "target_port" "left" "kind" "expected_next"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime009-example-key {"source" "Customer details Page" "source_port" "right" "target" "Payment Page" "target_port" "top" "kind" "merge"}))))

(deftest runtime023-examples-have-distinct-evidence-keys
  (is (= :labelled (flow-graph/runtime023-example-key {"kind" "expected_next" "source" "Customer details" "target" "Payment" "label_state" "label Checkout route" "accessible_name" "Delete relationship Checkout route, Customer details to Payment"})))
  (is (= :unlabelled (flow-graph/runtime023-example-key {"kind" "alternative" "source" "Customer details" "target" "ID verification" "label_state" "no label" "accessible_name" "Delete relationship Customer details to ID verification"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime023-example-key {"kind" "alternative" "source" "Customer details" "target" "ID verification" "label_state" "no label" "accessible_name" "Delete relationship wrong endpoint"}))))

(deftest runtime024-example-requires-exact-instance-values
  (is (= :repeated-page-instances (flow-graph/runtime024-example-key {"parent_value" "pending" "approved_value" "approved" "review_value" "manual_review" "declined_value" "declined"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime024-example-key {"parent_value" "pending" "approved_value" "approved" "review_value" "manual-review" "declined_value" "declined"}))))
