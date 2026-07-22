(ns acceptance.flow-graph-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.flow-graph :as flow-graph]
            [clojure.test :refer [deftest is]]))

(deftest graph-namespace-owns-every-active-graph-step
  (is (empty? (feature-support/unhandled-step-texts flow-graph/feature-files flow-graph/handlers))))

(def complete-evidence
  (assoc (into {} (map (fn [number] [(keyword (format "runtime%03d" number)) {:exact true}]) (range 1 23)))
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
  (is (false? (boolean (flow-graph/complete-browser-evidence? (assoc complete-evidence :runtime023 {:exact true})))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (dissoc complete-evidence :installedBoundary)))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (assoc-in complete-evidence [:runtime021 :exact] false)))))
  (is (true? (boolean (flow-graph/complete-browser-evidence? complete-evidence)))))

(deftest runtime009-examples-have-distinct-evidence-keys
  (is (= :pageContextProgression (flow-graph/runtime009-example-key {"source" "Customer details Page" "target" "Payment Page"})))
  (is (= :eventExpectedWithinPage (flow-graph/runtime009-example-key {"source" "Customer details Page" "target" "Customer details add_payment_info"})))
  (is (= :eventLeadsToNextPage (flow-graph/runtime009-example-key {"source" "Customer details add_payment_info" "target" "Payment Page"})))
  (is (= :eventInteractionProgression (flow-graph/runtime009-example-key {"source" "Customer details page_view" "target" "Customer details add_payment_info"}))))
