(ns acceptance.steps.schema-nested-path
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-nested-path-authoring.feature"
   "features/data-layer-schema-nested-path-validation.feature"])
(def entry-steps
  #{"captured event product_view contains fruits apple, banana, pear"
    "validation payload contains fruits apple, banana, pear"})
(defonce ^:private observation (atom nil))

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "SCHEMA_NESTED_PATH_BROWSER_ADAPTER"
            :observation-key :schemaNestedPath
            :runtime-error "Schema nested path browser runtime failed."
            :missing-error "Schema nested path browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-target-choice-example! [example observed]
  (when-let [choice (support/example-value example "target_choice")]
    (let [target (first (filter #(= choice (:label %)) (:targetChoices observed)))]
      (support/assert! (= {:path (support/require-example example "rule_target")
                           :matchedValueCount (parse-long (support/require-example example "matched_value_count"))}
                          (select-keys target [:path :matchedValueCount]))
                       "Array target choice changed." {:example example :target target}))))

(defn- assert-path-validation-example! [example observed]
  (when-let [entered (support/example-value example "entered_path")]
    (let [result (get-in observed [:pathValidation (keyword entered)])]
      (support/assert! (= {:result (support/require-example example "path_result")
                           :assistance (support/require-example example "assistance")}
                          (select-keys result [:result :assistance]))
                       "Advanced nested target validation changed." {:example example :result result}))))

(defn- assert-compatibility-example! [example observed]
  (when-let [target-type (support/example-value example "target_type")]
    (let [target (support/require-example example "rule_target")]
      (support/assert! (= [target-type true]
                          [(get-in observed [:pathValidation (keyword target) :targetType])
                           (boolean (some #{(support/require-example example "compatible_rule")}
                                          (get-in observed [:compatibility (keyword target)])))])
                       "Nested rule compatibility changed." {:example example}))))

(defn- assert-normalization-example! [example observed]
  (when-let [intent (support/example-value example "target_intent")]
    (support/assert! (= (support/require-example example "canonical_path")
                        (get-in observed [:normalization (keyword intent)]))
                     "Nested target intent normalization changed." {:example example})))

(defn- assert-fruits-validation-example! [example observed]
  (when-let [fruits-value (support/example-value example "fruits_value")]
    (let [index ({"apple, banana, pear" 0 "apple, orange, pear" 1 "apple" 2} fruits-value)
          result (get-in observed [:validation :fruits index])
          expected-path (support/require-example example "issue_path")]
      (support/assert! (= (support/require-example example "validation_result")
                          (get {"Valid" "valid"} (:state result) "issue"))
                       "Exact-index validation result changed." {:example example :result result})
      (support/assert! (= expected-path (get (:paths result) 0 "none"))
                       "Exact-index issue path changed." {:example example :result result}))))

(defn- assert-order-validation-example! [example observed]
  (when-let [order-id (support/example-value example "order_id")]
    (let [result (first (filter #(= order-id (:id %)) (get-in observed [:validation :orders])))]
      (support/assert! (= {:validation_result (support/require-example example "validation_result")
                           :failed_constraint (support/require-example example "failed_constraint")}
                          {:validation_result (get {"Valid" "valid"} (:state result) "issue")
                           :failed_constraint (:failed result)})
                       "Nested text validation changed." {:example example :result result}))))

(defn- assert-example! [example observed]
  (assert-target-choice-example! example observed)
  (assert-path-validation-example! example observed)
  (assert-compatibility-example! example observed)
  (assert-normalization-example! example observed)
  (assert-fruits-validation-example! example observed)
  (assert-order-validation-example! example observed))

(defn- assert-advanced-targets! [observed]
  (support/assert! (= [true
                       ["Add item property" "Add rule" "Add specific index rule" "Copy to another schema" "Remove property"]
                       "Every item · type object"]
                      [(every? (set (get-in observed [:advanced :paths]))
                               ["products" "products.*" "products.*.id" "products.*.name"])
                       (get-in observed [:advanced :arrayActions])
                       (get-in observed [:advanced :everyItem])])
                   "Advanced array and item-property targets are incomplete." observed)
  (support/assert! (= {:min "0" :blocked true :assistance "Enter a non-negative array index"} (:invalidIndex observed))
                   "Specific-index validation changed." observed)
  (support/assert! (= {:assistance "Item 2 at zero-based index 1" :canContinue true} (:validIndex observed))
                   "Valid specific-index assistance changed." observed))

(defn- assert-picker-compatibility! [observed]
  (support/assert! (= ["Add rule for fruits.1 · type string" true
                       "Add rule for products.*.id · type number" true true]
                      [(get-in observed [:exactIndex :heading])
                       (every? (set (get-in observed [:exactIndex :choices])) ["Exact value" "Text length" "Digits only"])
                       (get-in observed [:wildcardPicker :heading])
                       (boolean (some #{"Numeric range"} (get-in observed [:wildcardPicker :choices])))
                       (not-any? #{"Regular expression" "Text length"} (get-in observed [:wildcardPicker :choices]))])
                   "Nested property rule picker compatibility changed." observed))

(defn- assert-persistence! [observed]
  (support/assert! (= {:pendingChanges ["Attach Product ids to products.*.id"]
                       :attachmentPaths ["/products/*/id"]
                       :currentRules 0
                       :currentVersion 3}
                      (:persisted observed))
                   "Nested template rule did not remain isolated in one working-draft change." observed))

(defn- assert-target-choices! [observed]
  (support/assert! (= [{:label "Nested property" :path "/order/id" :matchedValueCount 1}]
                      (:nestedChoice observed))
                   "Nested object selection incorrectly requested an array target choice." observed)
  (support/assert! (= [{:label "This item only" :path "/products/1/id" :matchedValueCount 1 :itemNumber 2 :zeroBasedIndex 1}
                       {:label "This property in every item" :path "/products/*/id" :matchedValueCount 2}]
                      (:targetChoices observed))
                   "Concrete and every-item target choices changed." observed)
  (support/assert! (= ["/products" "/products/*" "/products/*/id"] (get-in observed [:ensured :createdNodes]))
                   "Missing nested schema model nodes were not identified." observed))

(defn- assert-validation-results! [observed]
  (support/assert! (= [{:instancePath "/products/1/name" :templatePath "/products/*/name"}]
                      (get-in observed [:validation :products]))
                   "Wildcard item-property issues lost concrete or template paths." observed)
  (support/assert! (= ["/products/1/id"] (get-in observed [:validation :productsNotApplicable]))
                   "Missing optional wildcard targets were not rendered as Not applicable." observed)
  (support/assert! (= {:issues 0 :itemCountAvailable true} (get-in observed [:validation :emptyProducts]))
                   "Empty arrays produced item-property issues or lost item-count authoring." observed)
  (support/assert! (= {:wildcardMatches 3 :exactMatches 1 :issues 0} (get-in observed [:validation :combined]))
                   "Exact-index and every-item constraints did not compose." observed)
  (support/assert! (= [{:instancePath "/orders/0/items/1/sku"
                        :templatePath "/orders/*/items/*/sku"
                        :expected "non-empty string"
                        :actual ""}]
                      (get-in observed [:validation :repeated]))
                   "Repeated wildcard validation lost the concrete nested issue path." observed))

(defn- assert-observation! [example observed]
  (assert-advanced-targets! observed)
  (assert-picker-compatibility! observed)
  (assert-persistence! observed)
  (assert-target-choices! observed)
  (assert-validation-results! observed)
  (assert-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (support/stateful-transition
   world example text entry-steps :schema-nested-path observation!
   "Schema nested path browser adapter was not executed."
   assert-observation!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :schema-nested-path
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T11:53:10.782995328+02:00", :module-hash "-217315617", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1650446292"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-644095680"} {:id "def/entry-steps", :kind "def", :line 7, :end-line 9, :hash "-1238999917"} {:id "form/3/defonce", :kind "defonce", :line 10, :end-line 10, :hash "-1819867165"} {:id "defn-/load-observation!", :kind "defn-", :line 12, :end-line 18, :hash "1034861264"} {:id "defn-/observation!", :kind "defn-", :line 20, :end-line 20, :hash "-775394783"} {:id "defn-/assert-target-choice-example!", :kind "defn-", :line 22, :end-line 28, :hash "-388089577"} {:id "defn-/assert-path-validation-example!", :kind "defn-", :line 30, :end-line 36, :hash "-1071236600"} {:id "defn-/assert-compatibility-example!", :kind "defn-", :line 38, :end-line 45, :hash "1985236915"} {:id "defn-/assert-normalization-example!", :kind "defn-", :line 47, :end-line 51, :hash "-2147066055"} {:id "defn-/assert-fruits-validation-example!", :kind "defn-", :line 53, :end-line 62, :hash "1295459662"} {:id "defn-/assert-order-validation-example!", :kind "defn-", :line 64, :end-line 71, :hash "-965811884"} {:id "defn-/assert-example!", :kind "defn-", :line 73, :end-line 79, :hash "-1858034554"} {:id "defn-/assert-advanced-targets!", :kind "defn-", :line 81, :end-line 93, :hash "1926866496"} {:id "defn-/assert-picker-compatibility!", :kind "defn-", :line 95, :end-line 103, :hash "-329396206"} {:id "defn-/assert-persistence!", :kind "defn-", :line 105, :end-line 111, :hash "-1758589139"} {:id "defn-/assert-target-choices!", :kind "defn-", :line 113, :end-line 122, :hash "1563708923"} {:id "defn-/assert-validation-results!", :kind "defn-", :line 124, :end-line 139, :hash "-1361485000"} {:id "defn-/assert-observation!", :kind "defn-", :line 141, :end-line 147, :hash "573855666"} {:id "defn-/transition", :kind "defn-", :line 149, :end-line 153, :hash "-1252184206"} {:id "def/handlers", :kind "def", :line 155, :end-line 160, :hash "481184675"}]}
;; clj-mutate-manifest-end
