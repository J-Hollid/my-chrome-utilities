(ns acceptance.steps.flow-graph
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.set :as set]
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
(defn- true-leaf-paths
  ([value] (true-leaf-paths ["flowGraph"] value))
  ([prefix value]
   (if (map? value)
     (mapcat (fn [[key nested]] (true-leaf-paths (conj prefix (name key)) nested)) value)
     (do
       (support/assert! (true? value) "Flow target evidence contains a false leaf."
                        {:leaf (str/join "." prefix) :value value})
       [(str/join "." prefix)]))))
(defn- target-partitions []
  (let [registry (json/parse-string (slurp "verification/packs.json") true)
        pack (first (filter #(= "flow_graph" (:id %)) registry))
        partition (first (:browserEvidencePartitions pack))]
    (into {} (map (juxt :id #(set (:leaves %))) (:targets partition)))))
(defn- parse-target-line [line]
  (try (json/parse-string line true) (catch Throwable _ nil)))
(defn- observe-target-line [{:keys [pending] :as state} line]
  (let [candidate (parse-target-line line)
        document (:flowGraph candidate)
        result (:swarmforgeBrowserTargetResult candidate)]
    (cond
      document (assoc state :pending document)
      (and result (= "passed" (:status result)) pending)
      (-> state (update :observed conj [(:id result) pending]) (assoc :pending nil))
      result (assoc state :pending nil)
      :else state)))
(defn- observed-targets [output]
  (:observed
   (reduce observe-target-line {:pending nil :observed []} (str/split-lines output))))
(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked-command! "Flow graph browser targets failed."
                                     "node" "test/browser-packs/flow-graph.mjs")
            targets (observed-targets (:out result))
            partitions (target-partitions)
            observed (apply merge (map second targets))]
        (doseq [[target-id document] targets]
          (let [expected (get partitions target-id)
                actual (set (true-leaf-paths document))]
            (support/assert! expected "Flow target has no declared evidence partition."
                             {:target target-id})
            (support/assert! (= expected actual)
                             "Flow target evidence does not exactly match its assigned leaves."
                             {:target target-id
                              :missing (sort (set/difference expected actual))
                              :unexpected (sort (set/difference actual expected))})))
        (support/assert! observed "Flow graph browser evidence is missing."
                         {:out (:out result)})
        (reset! browser-observation observed))))
(def runtime-evidence-keys
  (set (map #(keyword (format "runtime%03d" %)) (range 1 28))))
(def required-evidence-keys (conj runtime-evidence-keys :installedBoundary))
(def flow001-examples
  {["360" "800" "hidden"] :narrow-navigation-hidden
   ["360" "800" "visible"] :narrow-navigation-visible
   ["1440" "900" "hidden"] :wide-navigation-hidden
   ["1440" "900" "visible"] :wide-navigation-visible})
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
(def flow027-examples
  {["the main workspace" "primary-drags from unoccupied canvas" "120" "80"] :main-primary-blank
   ["Focus Canvas" "primary-drags from unoccupied canvas" "-90" "-60"] :focus-primary-blank
   ["the main workspace" "holds Space and primary-drags from a graph item" "110" "-70"] :main-space-item
   ["Focus Canvas" "holds Space and primary-drags from a graph item" "-100" "75"] :focus-space-item
   ["the main workspace" "middle-button-drags from unoccupied canvas" "95" "65"] :main-middle-blank
   ["Focus Canvas" "middle-button-drags from unoccupied canvas" "-85" "-55"] :focus-middle-blank
   ["the main workspace" "uses one-finger touch pan" "105" "-65"] :main-touch
   ["Focus Canvas" "uses one-finger touch pan" "-95" "70"] :focus-touch
   ["the main workspace" "uses the labelled keyboard pan command" "80" "60"] :main-keyboard
   ["Focus Canvas" "uses the labelled keyboard pan command" "-80" "-60"] :focus-keyboard})
(def runtime027-examples
  {["the main workspace" "sends primary-pointer drag from empty canvas" "120" "80"] :main-primary-blank
   ["Focus Canvas" "sends primary-pointer drag from empty canvas" "-90" "-60"] :focus-primary-blank
   ["the main workspace" "sends Space plus primary-pointer drag from a Page card" "110" "-70"] :main-space-item
   ["Focus Canvas" "sends Space plus primary-pointer drag from a Page card" "-100" "75"] :focus-space-item
   ["the main workspace" "sends auxiliary-pointer drag from empty canvas" "95" "65"] :main-middle-blank
   ["Focus Canvas" "sends auxiliary-pointer drag from empty canvas" "-85" "-55"] :focus-middle-blank
   ["the main workspace" "sends one-contact touch pan" "105" "-65"] :main-touch
   ["Focus Canvas" "sends one-contact touch pan" "-95" "70"] :focus-touch
   ["the main workspace" "activates the labelled keyboard pan command" "80" "60"] :main-keyboard
   ["Focus Canvas" "activates the labelled keyboard pan command" "-80" "-60"] :focus-keyboard})
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
(defn flow001-example-key [mode example]
  (when (support/example-value example "navigation")
    (support/assert! (contains? #{:model :runtime} mode) "Unknown Flow 001 evidence mode." {:mode mode})
    (exact-example-key example ["width" "height" "navigation"] ["navigation"] flow001-examples "Unknown Flow 001 viewport example.")))
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
(defn runtime027-example-key [mode example]
  (when (support/example-value example "pan_gesture")
    (support/assert! (contains? #{:model :runtime} mode) "Unknown runtime027 evidence mode." {:mode mode})
    (exact-example-key example ["workspace_mode" "pan_gesture" "horizontal_distance" "vertical_distance"] ["pan_gesture"] (if (= mode :model) flow027-examples runtime027-examples) "Unknown runtime027 pan example.")))
(defn validate-example! [mode example]
  (flow001-example-key mode example)
  (flow005-example-key mode example)
  (runtime009-example-key example)
  (runtime010-example-key example)
  (runtime023-example-key example)
  (runtime024-example-key example)
  (flow026-example-key example)
  (runtime027-example-key mode example)
  example)
(defn all-true? [values]
  (support/all-values-true? values))
(defn complete-browser-evidence? [evidence]
  (support/complete-browser-evidence? evidence required-evidence-keys runtime-evidence-keys))
(defn- assert-runtime! [evidence]
  (support/assert! (seq evidence) "Installed graph evidence is missing." evidence)
  (doseq [runtime-key (sort (filter evidence runtime-evidence-keys))]
    (support/assert! (support/all-values-true? (get evidence runtime-key))
                     (str "Installed graph evidence failed for " (name runtime-key) ".")
                     (get evidence runtime-key)))
  (when (contains? evidence :installedBoundary)
    (support/assert! (true? (:installedBoundary evidence))
                     "Installed graph boundary evidence failed." evidence)))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :flow-graph-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T14:53:05.380038363+02:00", :module-hash "1186629998", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 6, :hash "1962047470"} {:id "def/feature-files", :kind "def", :line 8, :end-line 10, :hash "-435723109"} {:id "def/entry-modes", :kind "def", :line 11, :end-line 13, :hash "-1332460073"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line 14, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "defn-/checked-command!", :kind "defn-", :line 17, :end-line 20, :hash "1232323377"} {:id "defn-/verify-model!", :kind "defn-", :line 21, :end-line 31, :hash "-17233573"} {:id "defn-/true-leaf-paths", :kind "defn-", :line 32, :end-line 40, :hash "-2146108350"} {:id "defn-/target-partitions", :kind "defn-", :line 41, :end-line 45, :hash "-1112341977"} {:id "defn-/parse-target-line", :kind "defn-", :line 46, :end-line 47, :hash "-345330627"} {:id "defn-/observe-target-line", :kind "defn-", :line 48, :end-line 57, :hash "-1549492299"} {:id "defn-/observed-targets", :kind "defn-", :line 58, :end-line 60, :hash "1686531439"} {:id "defn-/observe-browser!", :kind "defn-", :line 61, :end-line 80, :hash "1426689567"} {:id "def/runtime-evidence-keys", :kind "def", :line 81, :end-line 82, :hash "1598037166"} {:id "def/required-evidence-keys", :kind "def", :line 83, :end-line 83, :hash "-1295581414"} {:id "def/flow001-examples", :kind "def", :line 84, :end-line 88, :hash "-1929769532"} {:id "def/flow005-examples", :kind "def", :line 89, :end-line 103, :hash "-1087909857"} {:id "def/runtime009-examples", :kind "def", :line 104, :end-line 108, :hash "-167167521"} {:id "def/runtime010-examples", :kind "def", :line 109, :end-line 112, :hash "49886018"} {:id "def/runtime023-examples", :kind "def", :line 113, :end-line 115, :hash "-1984771249"} {:id "def/runtime024-examples", :kind "def", :line 116, :end-line 117, :hash "1058329484"} {:id "def/flow026-examples", :kind "def", :line 118, :end-line 120, :hash "-1147461739"} {:id "def/flow027-examples", :kind "def", :line 121, :end-line 131, :hash "-1245513417"} {:id "def/runtime027-examples", :kind "def", :line 132, :end-line 142, :hash "1138963094"} {:id "defn-/exact-example-key", :kind "defn-", :line 143, :end-line 147, :hash "-1670933730"} {:id "defn/flow005-example-key", :kind "defn", :line 148, :end-line 153, :hash "1749731827"} {:id "defn/flow001-example-key", :kind "defn", :line 154, :end-line 157, :hash "966521447"} {:id "defn/runtime009-example-key", :kind "defn", :line 158, :end-line 162, :hash "1897394456"} {:id "defn/runtime010-example-key", :kind "defn", :line 163, :end-line 166, :hash "608325806"} {:id "defn/runtime023-example-key", :kind "defn", :line 167, :end-line 168, :hash "-1160499936"} {:id "defn/runtime024-example-key", :kind "defn", :line 169, :end-line 170, :hash "1247866732"} {:id "defn/flow026-example-key", :kind "defn", :line 171, :end-line 177, :hash "1303746130"} {:id "defn/runtime027-example-key", :kind "defn", :line 178, :end-line 181, :hash "-2025668393"} {:id "defn/validate-example!", :kind "defn", :line 182, :end-line 191, :hash "-292079014"} {:id "defn/all-true?", :kind "defn", :line 192, :end-line 193, :hash "8452293"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 194, :end-line 195, :hash "-1379510548"} {:id "defn-/assert-runtime!", :kind "defn-", :line 196, :end-line 204, :hash "1065702786"} {:id "def/handlers", :kind "def", :line 206, :end-line 210, :hash "89345785"}]}
;; clj-mutate-manifest-end
