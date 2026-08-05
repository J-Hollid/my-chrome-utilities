(ns acceptance.flow-graph-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.flow-graph :as flow-graph]
            [clojure.test :refer [deftest is]]))

(deftest graph-namespace-owns-every-active-graph-step
  (is (empty? (feature-support/unhandled-step-texts flow-graph/feature-files flow-graph/handlers))))

(defn- private-var [symbol]
  (ns-resolve 'acceptance.steps.flow-graph symbol))

(deftest model-verification-runs-once-per-process
  (let [commands (atom [])
        verify! (var-get (private-var 'verify-model!))
        checked-var (private-var 'checked-command!)]
    (reset! flow-graph/model-verified? false)
    (try
      (with-redefs-fn
        {checked-var (fn [& command]
                       (swap! commands conj command)
                       {:exit 0})}
        #(do (verify!) (verify!)))
    (is (= 8 (count @commands))
          "normal acceptance reuses unit evidence and does not embed a property run")
      (is (true? @flow-graph/model-verified?))
      (finally
        (reset! flow-graph/model-verified? false)))))

(deftest browser-observation-is-keywordized-and-cached
  (let [commands (atom [])
        observe! (var-get (private-var 'observe-browser!))
        checked-var (private-var 'checked-command!)]
    (reset! flow-graph/browser-observation nil)
    (try
      (with-redefs-fn
        {checked-var (fn [& command]
                       (swap! commands conj command)
                       {:exit 0
                        :out "noise\n{\"flowGraph\":{\"runtime001\":{\"exact\":true}}}\n"})}
        #(do
           (is (= {:runtime001 {:exact true}} (observe!)))
           (is (= {:runtime001 {:exact true}} (observe!)))))
      (is (= 3 (count @commands)) "independent browser shards are each consumed once")
      (finally
        (reset! flow-graph/browser-observation nil)))))

(def complete-evidence
  (assoc (into {} (map (fn [number] [(keyword (format "runtime%03d" number)) {:exact true}]) (range 1 27)))
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
  (is (true? (boolean (flow-graph/complete-browser-evidence? (assoc complete-evidence :runtime026 {:exact true})))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (dissoc complete-evidence :installedBoundary)))))
  (is (false? (boolean (flow-graph/complete-browser-evidence? (assoc-in complete-evidence [:runtime021 :exact] false)))))
  (is (true? (boolean (flow-graph/complete-browser-evidence? complete-evidence)))))

(deftest flow005-examples-require-exact-mode-specific-values
  (is (= :pointer-activation (flow-graph/flow005-example-key :model {"page" "Cart" "event" "button_click" "trigger" "Continue clicked" "insertion" "activates button_click from the Events catalog by pointer"})))
  (is (= :pointer-drop (flow-graph/flow005-example-key :runtime {"page" "Shipping" "event" "add_shipping_info" "trigger" "Form submitted" "insertion" "drag add_shipping_info onto the visible SVG Shipping frame"})))
  (is (= :keyboard-activation (flow-graph/flow005-example-key :runtime {"page" "Payment" "event" "add_payment_info" "trigger" "Payment submitted" "insertion" "activate add_payment_info from the Events catalog by keyboard"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/flow005-example-key :model {"page" "Shipping" "event" "add_shipping_info" "trigger" "Wrong trigger" "insertion" "drags add_shipping_info onto the visible canvas Shipping frame"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/flow005-example-key :model {"page" "Cart" "event" "page_view" "trigger" "Initial load" "insertion" "activate page_view from the Events catalog by pointer"}))))

(deftest runtime009-examples-have-distinct-evidence-keys
  (is (= :pageContextExpectedNext (flow-graph/runtime009-example-key {"source" "Customer details" "source_port" "right" "target" "Payment" "target_port" "left" "kind" "expected_next"})))
  (is (= :pageToEventAlternative (flow-graph/runtime009-example-key {"source" "Customer details" "source_port" "top" "target" "ID verification" "target_port" "bottom" "kind" "alternative"})))
  (is (= :eventToPageMerge (flow-graph/runtime009-example-key {"source" "ID verification" "source_port" "bottom" "target" "Payment" "target_port" "top" "kind" "merge"})))
  (is (= :eventInteractionExpectedNext (flow-graph/runtime009-example-key {"source" "Payment" "source_port" "right" "target" "Confirmation" "target_port" "left" "kind" "expected_next"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime009-example-key {"source" "Customer details" "source_port" "right" "target" "Payment" "target_port" "top" "kind" "merge"}))))

(deftest runtime023-examples-have-distinct-evidence-keys
  (is (= :labelled (flow-graph/runtime023-example-key {"kind" "expected_next" "source" "Customer details" "target" "Payment" "label_state" "label Checkout route" "accessible_name" "Delete relationship Checkout route, Customer details to Payment"})))
  (is (= :unlabelled (flow-graph/runtime023-example-key {"kind" "alternative" "source" "Customer details" "target" "ID verification" "label_state" "no label" "accessible_name" "Delete relationship Customer details to ID verification"})))
  (is (= {"kind" "expected_next" "source" "Customer details" "target" "Payment" "label_state" "label Checkout route" "accessible_name" "Delete relationship Checkout route, Customer details to Payment"}
         (flow-graph/validate-example! :runtime {"kind" "expected_next" "source" "Customer details" "target" "Payment" "label_state" "label Checkout route" "accessible_name" "Delete relationship Checkout route, Customer details to Payment"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime023-example-key {"kind" "alternative" "source" "Customer details" "target" "ID verification" "label_state" "no label" "accessible_name" "Delete relationship wrong endpoint"}))))

(deftest runtime024-example-requires-exact-instance-values
  (is (= :repeated-page-instances (flow-graph/runtime024-example-key {"parent_value" "pending" "approved_value" "approved" "review_value" "manual_review" "declined_value" "declined"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime024-example-key {"parent_value" "pending" "approved_value" "approved" "review_value" "manual-review" "declined_value" "declined"}))))

(deftest flow026-example-requires-exact-instance-naming-values
  (let [example {"source_page" "Generic checkout page"
                 "instance_count" "4"
                 "first_name" "Customer details"
                 "second_name" "Payment"
                 "third_name" "Summary"
                 "renamed_page" "Reusable commerce page"}]
    (is (= :named-page-instances (flow-graph/flow026-example-key example)))
    (is (= example (flow-graph/validate-example! :model example))))
  (is (thrown?
       clojure.lang.ExceptionInfo
       (flow-graph/flow026-example-key
        {"source_page" "Generic checkout page"
         "instance_count" "7"
         "first_name" "Customer details"
         "second_name" "Payment"
         "third_name" "Summary"
         "renamed_page" "Reusable commerce page"}))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-22T20:06:28.236725939+02:00", :module-hash "1674244795", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1569434453"} {:id "form/1/deftest", :kind "deftest", :line 6, :end-line 7, :hash "1273886876"} {:id "def/complete-evidence", :kind "def", :line 9, :end-line 11, :hash "-1896130973"} {:id "form/3/deftest", :kind "deftest", :line 13, :end-line 17, :hash "-974447205"} {:id "form/4/deftest", :kind "deftest", :line 19, :end-line 26, :hash "1233157525"} {:id "form/5/deftest", :kind "deftest", :line 28, :end-line 33, :hash "971142740"} {:id "form/6/deftest", :kind "deftest", :line 35, :end-line 40, :hash "-1512853509"} {:id "form/7/deftest", :kind "deftest", :line 42, :end-line 45, :hash "-2066331369"} {:id "form/8/deftest", :kind "deftest", :line 47, :end-line 49, :hash "-1819749563"}]}
;; clj-mutate-manifest-end
