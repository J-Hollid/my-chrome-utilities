(ns acceptance.steps.flow-graph
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-directional-flow-specification-graph.feature"
   "features/data-layer-directional-flow-specification-graph-runtime.feature"])
(def entry-modes
  {"Shop project contains Page Groups Checkout, Delivery, and Confirmation" :model
   "the built extension is running with the production project repository and Specification Flow editor" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked-command! [message & command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))
(defn- verify-model! []
  (when-not @model-verified?
    (checked-command! "Flow relationship deletion verification failed." "node" "test/data-layer-flow-relationship-deletion-test.mjs")
    (checked-command! "Flow Page-instance verification failed." "node" "test/data-layer-flow-page-instance-test.mjs")
    (checked-command! "Flow graph projection verification failed." "node" "test/data-layer-flow-graph-test.mjs")
    (checked-command! "Flow graph port inference property verification failed." "node" "test/data-layer-flow-graph-property-test.mjs")
    (checked-command! "Flow graph persistence verification failed." "node" "test/data-layer-flow-graph-persistence-test.mjs")
    (checked-command! "Flow Page-context model verification failed." "node" "test/data-layer-flow-page-context-model-test.mjs")
    (checked-command! "Flow Event insertion semantics verification failed." "node" "test/data-layer-flow-event-insertion-semantics-test.mjs")
    (reset! model-verified? true)))
(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked-command! "Flow graph browser adapter failed." "node" "test/browser-packs/flow-graph.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:flowGraph (json/parse-string line true))]
        (support/assert! observed "Flow graph browser evidence is missing." {:out (:out result)})
        (reset! browser-observation observed))))
(def runtime-evidence-keys
  (set (map #(keyword (format "runtime%03d" %)) (range 1 25))))
(def required-evidence-keys (conj runtime-evidence-keys :installedBoundary))
(def flow005-examples
  {[:model ["Cart" "page_view" "Initial load" "activates page_view from the Events catalog by pointer"]] :pointer-activation
   [:model ["Shipping" "add_shipping_info" "Form submitted" "drags add_shipping_info onto the visible canvas Shipping frame"]] :pointer-drop
   [:model ["Payment" "add_payment_info" "Payment submitted" "activates add_payment_info from the Events catalog by keyboard"]] :keyboard-activation
   [:runtime ["Cart" "page_view" "Initial load" "activate page_view from the Events catalog by pointer"]] :pointer-activation
   [:runtime ["Shipping" "add_shipping_info" "Form submitted" "drag add_shipping_info onto the visible SVG Shipping frame"]] :pointer-drop
   [:runtime ["Payment" "add_payment_info" "Payment submitted" "activate add_payment_info from the Events catalog by keyboard"]] :keyboard-activation})
(def runtime009-examples
  {["Customer details Page" "right" "Payment Page" "left" "expected_next"] :pageContextExpectedNext
   ["Customer details Page" "top" "Customer details add_payment_info" "bottom" "alternative"] :pageToEventAlternative
   ["Customer details add_payment_info" "bottom" "Payment Page" "top" "merge"] :eventToPageMerge
   ["Customer details page_view" "right" "Customer details add_payment_info" "left" "expected_next"] :eventInteractionExpectedNext})
(def runtime023-examples
  {["expected_next" "Customer details" "Payment" "label Checkout route" "Delete relationship Checkout route, Customer details to Payment"] :labelled
   ["alternative" "Customer details" "ID verification" "no label" "Delete relationship Customer details to ID verification"] :unlabelled})
(def runtime024-examples
  {["pending" "approved" "manual_review" "declined"] :repeated-page-instances})
(defn- exact-example-key [example columns discriminators examples message]
  (let [row (mapv #(support/example-value example %) columns)]
    (when (some #(support/example-value example %) discriminators)
      (support/assert! (contains? examples row) message {:row row})
      (get examples row))))
(defn flow005-example-key [mode example]
  (let [row (mapv #(support/example-value example %) ["page" "event" "trigger" "insertion"])
        key [mode row]]
    (when (support/example-value example "insertion")
      (support/assert! (contains? flow005-examples key) "Unknown Flow 005 Event insertion example." {:mode mode :row row})
      (get flow005-examples key))))
(defn runtime009-example-key [example]
  (exact-example-key example ["source" "source_port" "target" "target_port" "kind"] ["source_port" "target_port"] runtime009-examples "Unknown runtime009 endpoint example."))
(defn runtime023-example-key [example]
  (exact-example-key example ["kind" "source" "target" "label_state" "accessible_name"] ["label_state" "accessible_name"] runtime023-examples "Unknown runtime023 relationship-deletion example."))
(defn runtime024-example-key [example]
  (exact-example-key example ["parent_value" "approved_value" "review_value" "declined_value"] ["parent_value"] runtime024-examples "Unknown runtime024 Page-instance example."))
(defn validate-example! [mode example]
  (flow005-example-key mode example)
  (runtime009-example-key example)
  (runtime023-example-key example)
  (runtime024-example-key example)
  true)
(defn all-true? [values]
  (boolean (and (map? values) (seq values) (every? true? (vals values)))))
(defn complete-browser-evidence? [evidence]
  (boolean
   (and (map? evidence)
        (= required-evidence-keys (set (keys evidence)))
        (true? (:installedBoundary evidence))
        (every? #(all-true? (get evidence %)) runtime-evidence-keys))))
(defn- assert-runtime! [evidence]
  (support/assert! (complete-browser-evidence? evidence) "Installed graph evidence is incomplete or contains a false value." evidence)
  (doseq [runtime-key (sort runtime-evidence-keys)]
    (support/assert! (all-true? (get evidence runtime-key))
                     (str "Installed graph evidence failed for " (name runtime-key) ".")
                     (get evidence runtime-key))))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :flow-graph-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-22T20:06:16.772589872+02:00", :module-hash "-80478857", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "12328700"} {:id "def/feature-files", :kind "def", :line 7, :end-line 9, :hash "-435723109"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "1245758286"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/checked-command!", :kind "defn-", :line 16, :end-line 19, :hash "-109796194"} {:id "defn-/verify-model!", :kind "defn-", :line 20, :end-line 29, :hash "934910746"} {:id "defn-/observe-browser!", :kind "defn-", :line 30, :end-line 36, :hash "-1469376060"} {:id "def/runtime-evidence-keys", :kind "def", :line 37, :end-line 38, :hash "-344248280"} {:id "def/required-evidence-keys", :kind "def", :line 39, :end-line 39, :hash "-1295581414"} {:id "def/flow005-examples", :kind "def", :line 40, :end-line 46, :hash "-771053583"} {:id "def/runtime009-examples", :kind "def", :line 47, :end-line 51, :hash "1540013385"} {:id "def/runtime023-examples", :kind "def", :line 52, :end-line 54, :hash "-1984771249"} {:id "def/runtime024-examples", :kind "def", :line 55, :end-line 56, :hash "1058329484"} {:id "defn-/exact-example-key", :kind "defn-", :line 57, :end-line 61, :hash "-901117598"} {:id "defn/flow005-example-key", :kind "defn", :line 62, :end-line 67, :hash "-48125906"} {:id "defn/runtime009-example-key", :kind "defn", :line 68, :end-line 69, :hash "-1376855772"} {:id "defn/runtime023-example-key", :kind "defn", :line 70, :end-line 71, :hash "-1160499936"} {:id "defn/runtime024-example-key", :kind "defn", :line 72, :end-line 73, :hash "1247866732"} {:id "defn/validate-example!", :kind "defn", :line 74, :end-line 79, :hash "-409560174"} {:id "defn/all-true?", :kind "defn", :line 80, :end-line 81, :hash "731206003"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 82, :end-line 87, :hash "762470613"} {:id "defn-/assert-runtime!", :kind "defn-", :line 88, :end-line 93, :hash "1781741610"} {:id "def/handlers", :kind "def", :line 95, :end-line 99, :hash "89345785"}]}
;; clj-mutate-manifest-end
