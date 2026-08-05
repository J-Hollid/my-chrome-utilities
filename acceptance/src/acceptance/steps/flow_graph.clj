(ns acceptance.steps.flow-graph
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-directional-flow-specification-graph.feature"
   "features/data-layer-directional-flow-specification-graph-runtime.feature"])
(def entry-modes
  {"Shop project has Specification Flow Checkout journey open on its current Saved Draft" :model
   "the built extension is running with the production project repository and Specification Flow editor" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked-command! [message & command]
  (let [result (apply support/verified-command-result command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))
(defn- verify-model! []
  (when-not @model-verified?
    (checked-command! "Flow relationship deletion verification failed." "node" "test/data-layer-flow-relationship-deletion-test.mjs")
    (checked-command! "Flow Page-instance verification failed." "node" "test/data-layer-flow-page-instance-test.mjs")
    (checked-command! "Flow graph projection verification failed." "node" "test/data-layer-flow-graph-test.mjs")
    (checked-command! "Flow Page-context model verification failed." "node" "test/data-layer-flow-page-context-model-test.mjs")
    (checked-command! "Flow Event insertion semantics verification failed." "node" "test/data-layer-flow-event-insertion-semantics-test.mjs")
    (checked-command! "Flow Page context-event model verification failed." "node" "test/data-layer-flow-page-event-model-test.mjs")
    (checked-command! "Flow graph persistence verification failed." "node" "test/data-layer-flow-graph-persistence-test.mjs")
    (checked-command! "Canvas-first Flow workspace verification failed." "node" "test/data-layer-flow-workspace-test.mjs")
    (reset! model-verified? true)))
(defn- observe-browser! []
  (or @browser-observation
      (let [results (mapv #(checked-command! "Flow graph browser shard failed." "node" %)
                          ["test/browser-packs/flow-graph.mjs"
                           "test/browser-packs/flow-graph-legacy.mjs"
                           "test/browser-packs/flow-graph-examples.mjs"])
            observed (apply merge
                            (map (fn [result]
                                   (let [line (last (filter #(str/starts-with? % "{")
                                                            (str/split-lines (:out result))))]
                                     (:flowGraph (json/parse-string line true))))
                                 results))]
        (support/assert! observed "Flow graph browser evidence is missing."
                         {:out (mapv :out results)})
        (reset! browser-observation observed))))
(def runtime-evidence-keys
  (set (map #(keyword (format "runtime%03d" %)) (range 1 27))))
(def required-evidence-keys (conj runtime-evidence-keys :installedBoundary))
(def flow005-examples
  {[:model ["Cart" "button_click" "Continue clicked" "chooses button_click from Add by pointer"]] :pointer-activation
   [:model ["Shipping" "add_shipping_info" "Form submitted" "drags add_shipping_info from Add onto Shipping"]] :pointer-drop
   [:model ["Payment" "add_payment_info" "Payment submitted" "chooses add_payment_info from Add by keyboard"]] :keyboard-activation
   [:runtime ["Cart" "button_click" "Continue clicked" "choose button_click from Add by pointer"]] :pointer-activation
   [:runtime ["Shipping" "add_shipping_info" "Form submitted" "drag add_shipping_info from Add onto Shipping"]] :pointer-drop
   [:runtime ["Payment" "add_payment_info" "Payment submitted" "choose add_payment_info from Add by keyboard"]] :keyboard-activation
   ;; Retain exact compatibility for historical acceptance-unit fixtures while the
   ;; active feature vocabulary uses the bounded Add surface above.
   [:model ["Cart" "button_click" "Continue clicked" "activates button_click from the Events catalog by pointer"]] :pointer-activation
   [:model ["Shipping" "add_shipping_info" "Form submitted" "drags add_shipping_info onto the visible canvas Shipping frame"]] :pointer-drop
   [:model ["Payment" "add_payment_info" "Payment submitted" "activates add_payment_info from the Events catalog by keyboard"]] :keyboard-activation
   [:runtime ["Cart" "button_click" "Continue clicked" "activate button_click from the Events catalog by pointer"]] :pointer-activation
   [:runtime ["Shipping" "add_shipping_info" "Form submitted" "drag add_shipping_info onto the visible SVG Shipping frame"]] :pointer-drop
   [:runtime ["Payment" "add_payment_info" "Payment submitted" "activate add_payment_info from the Events catalog by keyboard"]] :keyboard-activation})
(def runtime009-examples
  {["Customer details" "right" "Payment" "left" "expected_next"] :pageContextExpectedNext
   ["Customer details" "top" "ID verification" "bottom" "alternative"] :pageToEventAlternative
   ["ID verification" "bottom" "Payment" "top" "merge"] :eventToPageMerge
   ["Payment" "right" "Confirmation" "left" "expected_next"] :eventInteractionExpectedNext})
(def runtime010-examples
  {["right" "left" "expected_next"] :expected-next
   ["top" "bottom" "alternative"] :alternative
   ["bottom" "top" "merge"] :merge})
(def runtime023-examples
  {["expected_next" "Customer details" "Payment" "label Checkout route" "Delete relationship Checkout route, Customer details to Payment"] :labelled
   ["alternative" "Customer details" "ID verification" "no label" "Delete relationship Customer details to ID verification"] :unlabelled})
(def runtime024-examples
  {["pending" "approved" "manual_review" "declined"] :repeated-page-instances})
(def flow026-examples
  {["Generic checkout page" "4" "Customer details" "Payment" "Summary" "Reusable commerce page"]
   :named-page-instances})
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
  (when (and (support/example-value example "source")
             (support/example-value example "source_port")
             (support/example-value example "target_port"))
    (exact-example-key example ["source" "source_port" "target" "target_port" "kind"] ["source"] runtime009-examples "Unknown runtime009 endpoint example.")))
(defn runtime010-example-key [example]
  (when (and (support/example-value example "source_port")
             (not (support/example-value example "source")))
    (exact-example-key example ["source_port" "target_port" "kind"] ["source_port"] runtime010-examples "Unknown runtime010 empty-drop example.")))
(defn runtime023-example-key [example]
  (exact-example-key example ["kind" "source" "target" "label_state" "accessible_name"] ["label_state" "accessible_name"] runtime023-examples "Unknown runtime023 relationship-deletion example."))
(defn runtime024-example-key [example]
  (exact-example-key example ["parent_value" "approved_value" "review_value" "declined_value"] ["parent_value"] runtime024-examples "Unknown runtime024 Page-instance example."))
(defn flow026-example-key [example]
  (exact-example-key
   example
   ["source_page" "instance_count" "first_name" "second_name" "third_name" "renamed_page"]
   ["instance_count"]
   flow026-examples
   "Unknown Flow 026 Page-instance naming example."))
(defn validate-example! [mode example]
  (flow005-example-key mode example)
  (runtime009-example-key example)
  (runtime010-example-key example)
  (runtime023-example-key example)
  (runtime024-example-key example)
  (flow026-example-key example)
  example)
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
;; {:version 1, :tested-at "2026-08-05T16:19:57.553207484+02:00", :module-hash "488102899", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "12328700"} {:id "def/feature-files", :kind "def", :line 7, :end-line 9, :hash "-435723109"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "-1332460073"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/checked-command!", :kind "defn-", :line 16, :end-line 19, :hash "1232323377"} {:id "defn-/verify-model!", :kind "defn-", :line 20, :end-line 30, :hash "-17233573"} {:id "defn-/observe-browser!", :kind "defn-", :line 31, :end-line 45, :hash "-1924280539"} {:id "def/runtime-evidence-keys", :kind "def", :line 46, :end-line 47, :hash "364729749"} {:id "def/required-evidence-keys", :kind "def", :line 48, :end-line 48, :hash "-1295581414"} {:id "def/flow005-examples", :kind "def", :line 49, :end-line 63, :hash "-1087909857"} {:id "def/runtime009-examples", :kind "def", :line 64, :end-line 68, :hash "-167167521"} {:id "def/runtime010-examples", :kind "def", :line 69, :end-line 72, :hash "49886018"} {:id "def/runtime023-examples", :kind "def", :line 73, :end-line 75, :hash "-1984771249"} {:id "def/runtime024-examples", :kind "def", :line 76, :end-line 77, :hash "1058329484"} {:id "def/flow026-examples", :kind "def", :line 78, :end-line 80, :hash "-1147461739"} {:id "defn-/exact-example-key", :kind "defn-", :line 81, :end-line 85, :hash "-1670933730"} {:id "defn/flow005-example-key", :kind "defn", :line 86, :end-line 91, :hash "1749731827"} {:id "defn/runtime009-example-key", :kind "defn", :line 92, :end-line 96, :hash "1897394456"} {:id "defn/runtime010-example-key", :kind "defn", :line 97, :end-line 100, :hash "608325806"} {:id "defn/runtime023-example-key", :kind "defn", :line 101, :end-line 102, :hash "-1160499936"} {:id "defn/runtime024-example-key", :kind "defn", :line 103, :end-line 104, :hash "1247866732"} {:id "defn/flow026-example-key", :kind "defn", :line 105, :end-line 111, :hash "1303746130"} {:id "defn/validate-example!", :kind "defn", :line 112, :end-line 119, :hash "1637599946"} {:id "defn/all-true?", :kind "defn", :line 120, :end-line 121, :hash "731206003"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 122, :end-line 127, :hash "-765019633"} {:id "defn-/assert-runtime!", :kind "defn-", :line 128, :end-line 133, :hash "1781741610"} {:id "def/handlers", :kind "def", :line 135, :end-line 139, :hash "89345785"}]}
;; clj-mutate-manifest-end
