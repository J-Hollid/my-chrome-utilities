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
        checked-var (private-var 'checked-command!)
        partitions-var (private-var 'target-partitions)]
    (reset! flow-graph/browser-observation nil)
    (try
      (with-redefs-fn
        {checked-var (fn [& command]
                       (swap! commands conj command)
                       {:exit 0
                        :out (str "noise\n{\"flowGraph\":{\"runtime001\":{\"exact\":true}}}\n"
                                  "{\"swarmforgeBrowserTargetResult\":{\"id\":\"TEST\",\"status\":\"passed\"}}\n")})
         partitions-var (fn [] {"TEST" #{"flowGraph.runtime001.exact"}})}
        #(do
           (is (= {:runtime001 {:exact true}} (observe!)))
           (is (= {:runtime001 {:exact true}} (observe!)))))
      (is (= 1 (count @commands)) "the shared browser batch is consumed once")
      (finally
        (reset! flow-graph/browser-observation nil)))))

(deftest browser-observation-keeps-causal-measurements-outside-the-leaf-contract
  (let [observe! (var-get (private-var 'observe-browser!))
        checked-var (private-var 'checked-command!)
        partitions-var (private-var 'target-partitions)]
    (reset! flow-graph/browser-observation nil)
    (try
      (with-redefs-fn
        {checked-var (fn [& _]
                       {:exit 0
                        :out (str "{\"flowGraph\":{\"styles\":{\"equivalence\":true,"
                                  "\"measurements\":{\"baseCommit\":\"base\",\"equivalent\":false}}}}\n"
                                  "{\"swarmforgeBrowserTargetResult\":{\"id\":\"STYLE\",\"status\":\"passed\"}}\n")})
         partitions-var (fn [] {"STYLE" #{"flowGraph.styles.equivalence"}})}
        #(is (= {:styles {:equivalence true
                          :measurements {:baseCommit "base" :equivalent false}}}
                (observe!))))
      (finally
        (reset! flow-graph/browser-observation nil)))))

(def complete-evidence
  (assoc (into {} (map (fn [number] [(keyword (format "runtime%03d" number)) {:exact true}]) (range 1 28)))
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
  (is (false? (boolean (flow-graph/complete-browser-evidence? (dissoc complete-evidence :runtime027)))))
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

(deftest flow001-examples-require-exact-mode-specific-values
  (is (= :narrow-navigation-hidden (flow-graph/flow001-example-key :model {"width" "360" "height" "800" "navigation" "hidden"})))
  (is (= :wide-navigation-visible (flow-graph/flow001-example-key :runtime {"width" "1440" "height" "900" "navigation" "visible"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/flow001-example-key :runtime {"width" "360" "height" "900" "navigation" "hidden"}))))

(deftest flow002-examples-require-exact-entity-counts
  (is (= :small-entity-set (flow-graph/flow002-example-key {"entity_count" "3"})))
  (is (= :large-entity-set (flow-graph/flow002-example-key {"entity_count" "300"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/flow002-example-key {"entity_count" "30"}))))

(deftest flow019-examples-require-exact-mode-specific-values
  (is (= :model-selection-horizontal
         (flow-graph/flow019-example-key :model {"scope" "the selection" "arrangement" "horizontally"})))
  (is (= :runtime-section-vertical
         (flow-graph/flow019-example-key :runtime {"scope" "Checkout Section" "arrangement" "vertically"})))
  (is (thrown? clojure.lang.ExceptionInfo
               (flow-graph/flow019-example-key :runtime {"scope" "the selection" "arrangement" "horizontally"})))
  (is (thrown? clojure.lang.ExceptionInfo
               (flow-graph/flow019-example-key :model {"scope" "Checkout Section" "arrangement" "diagonally"}))))

(deftest flow020-examples-require-exact-viewport-values
  (is (= :narrow-viewport (flow-graph/flow020-example-key {"width" "360" "height" "800"})))
  (is (= :wide-viewport (flow-graph/flow020-example-key {"width" "1440" "height" "900"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/flow020-example-key {"width" "360" "height" "900"}))))

(deftest runtime027-examples-have-distinct-evidence-keys
  (is (= :main-primary-blank (flow-graph/runtime027-example-key :model {"workspace_mode" "the main workspace" "pan_gesture" "primary-drags from unoccupied canvas" "horizontal_distance" "120" "vertical_distance" "80"})))
  (is (= :focus-keyboard (flow-graph/runtime027-example-key :runtime {"workspace_mode" "Focus Canvas" "pan_gesture" "activates the labelled keyboard pan command" "horizontal_distance" "-80" "vertical_distance" "-60"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime027-example-key :model {"workspace_mode" "the main workspace" "pan_gesture" "sends primary-pointer drag from empty canvas" "horizontal_distance" "120" "vertical_distance" "80"})))
  (is (thrown? clojure.lang.ExceptionInfo (flow-graph/runtime027-example-key :runtime {"workspace_mode" "Focus Canvas" "pan_gesture" "activates the labelled keyboard pan command" "horizontal_distance" "-80" "vertical_distance" "60"}))))

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
;; {:version 1, :tested-at "2026-08-11T06:57:27.750515093+02:00", :module-hash "1889028755", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1569434453"} {:id "form/1/deftest", :kind "deftest", :line 6, :end-line 7, :hash "1273886876"} {:id "defn-/private-var", :kind "defn-", :line 9, :end-line 10, :hash "1644259952"} {:id "form/3/deftest", :kind "deftest", :line 12, :end-line 27, :hash "-1775439981"} {:id "form/4/deftest", :kind "deftest", :line 29, :end-line 48, :hash "-2003270486"} {:id "def/complete-evidence", :kind "def", :line 50, :end-line 52, :hash "1423935133"} {:id "form/6/deftest", :kind "deftest", :line 54, :end-line 58, :hash "-974447205"} {:id "form/7/deftest", :kind "deftest", :line 60, :end-line 68, :hash "241758405"} {:id "form/8/deftest", :kind "deftest", :line 70, :end-line 75, :hash "-1791144720"} {:id "form/9/deftest", :kind "deftest", :line 77, :end-line 80, :hash "1603110676"} {:id "form/10/deftest", :kind "deftest", :line 82, :end-line 85, :hash "-628222917"} {:id "form/11/deftest", :kind "deftest", :line 87, :end-line 95, :hash "906304450"} {:id "form/12/deftest", :kind "deftest", :line 97, :end-line 100, :hash "-950724861"} {:id "form/13/deftest", :kind "deftest", :line 102, :end-line 106, :hash "1534110227"} {:id "form/14/deftest", :kind "deftest", :line 108, :end-line 113, :hash "837333516"} {:id "form/15/deftest", :kind "deftest", :line 115, :end-line 120, :hash "-488421438"} {:id "form/16/deftest", :kind "deftest", :line 122, :end-line 124, :hash "-1819749563"} {:id "form/17/deftest", :kind "deftest", :line 126, :end-line 143, :hash "-13495486"}]}
;; clj-mutate-manifest-end
