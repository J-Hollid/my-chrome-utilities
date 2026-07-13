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

(defn- assert-example! [example observed]
  (when-let [choice (support/example-value example "target_choice")]
    (let [target (some #(when (= choice (:label %)) %) (:targetChoices observed))]
      (support/assert! (= {:path (support/require-example example "rule_target")
                           :matchedValueCount (parse-long (support/require-example example "matched_value_count"))}
                          (select-keys target [:path :matchedValueCount]))
                       "Array target choice changed." {:example example :target target})))
  (when-let [entered (support/example-value example "entered_path")]
    (let [result (get-in observed [:pathValidation (keyword entered)])]
      (support/assert! (= {:result (support/require-example example "path_result")
                           :assistance (support/require-example example "assistance")}
                          (select-keys result [:result :assistance]))
                       "Advanced nested target validation changed." {:example example :result result})))
  (when-let [target-type (support/example-value example "target_type")]
    (let [target (support/require-example example "rule_target")]
      (support/assert! (and (= target-type
                            (get-in observed [:pathValidation (keyword target) :targetType]))
                          (some #{(support/require-example example "compatible_rule")}
                                (get-in observed [:compatibility (keyword target)])))
                       "Nested rule compatibility changed." {:example example})))
  (when-let [intent (support/example-value example "target_intent")]
    (support/assert! (= (support/require-example example "canonical_path")
                        (get-in observed [:normalization (keyword intent)]))
                     "Nested target intent normalization changed." {:example example}))
  (when-let [fruits-value (support/example-value example "fruits_value")]
    (let [index ({"apple, banana, pear" 0 "apple, orange, pear" 1 "apple" 2} fruits-value)
          result (get-in observed [:validation :fruits index])
          expected-path (support/require-example example "issue_path")]
      (support/assert! (= (support/require-example example "validation_result")
                          (if (= "Valid" (:state result)) "valid" "issue"))
                       "Exact-index validation result changed." {:example example :result result})
      (support/assert! (= expected-path (or (first (:paths result)) "none"))
                       "Exact-index issue path changed." {:example example :result result})))
  (when-let [order-id (support/example-value example "order_id")]
    (let [result (some #(when (= order-id (:id %)) %) (get-in observed [:validation :orders]))]
      (support/assert! (= {:validation_result (support/require-example example "validation_result")
                           :failed_constraint (support/require-example example "failed_constraint")}
                          {:validation_result (if (= "Valid" (:state result)) "valid" "issue")
                           :failed_constraint (:failed result)})
                       "Nested text validation changed." {:example example :result result}))))

(defn- assert-observation! [example observed]
  (support/assert! (and (every? (set (get-in observed [:advanced :paths]))
                                ["products" "products.*" "products.*.id" "products.*.name"])
                        (= ["Add rule" "Add specific index rule"] (get-in observed [:advanced :arrayActions]))
                        (= "Every item · type object" (get-in observed [:advanced :everyItem])))
                   "Advanced array and item-property targets are incomplete." observed)
  (support/assert! (= {:min "0" :blocked true :assistance "Enter a non-negative array index"} (:invalidIndex observed))
                   "Specific-index validation changed." observed)
  (support/assert! (= {:assistance "Item 2 at zero-based index 1" :canContinue true} (:validIndex observed))
                   "Valid specific-index assistance changed." observed)
  (support/assert! (and (= "Add rule for fruits.1 · type string" (get-in observed [:exactIndex :heading]))
                        (every? (set (get-in observed [:exactIndex :choices])) ["Exact value" "Text length" "Digits only"])
                        (= "Add rule for products.*.id · type number" (get-in observed [:wildcardPicker :heading]))
                        (some #{"Numeric range"} (get-in observed [:wildcardPicker :choices]))
                        (not-any? #{"Regular expression" "Text length"} (get-in observed [:wildcardPicker :choices])))
                   "Nested property rule picker compatibility changed." observed)
  (support/assert! (= {:pendingChanges ["Attach Product ids to products.*.id"]
                        :attachmentPaths ["/products/*/id"]
                        :currentRules 0
                        :currentVersion 3}
                       (:persisted observed))
                   "Nested template rule did not remain isolated in one working-draft change." observed)
  (support/assert! (= [{:label "Nested property" :path "/order/id" :matchedValueCount 1}]
                       (:nestedChoice observed))
                   "Nested object selection incorrectly requested an array target choice." observed)
  (support/assert! (= [{:label "This item only" :path "/products/1/id" :matchedValueCount 1 :itemNumber 2 :zeroBasedIndex 1}
                        {:label "This property in every item" :path "/products/*/id" :matchedValueCount 2}]
                       (:targetChoices observed))
                   "Concrete and every-item target choices changed." observed)
  (support/assert! (= ["/products" "/products/*" "/products/*/id"] (get-in observed [:ensured :createdNodes]))
                   "Missing nested schema model nodes were not identified." observed)
  (support/assert! (= [{:instancePath "/products/1/id" :templatePath "/products/*/id"}
                        {:instancePath "/products/1/name" :templatePath "/products/*/name"}]
                       (get-in observed [:validation :products]))
                   "Wildcard item-property issues lost concrete or template paths." observed)
  (support/assert! (= {:issues 0 :itemCountAvailable true} (get-in observed [:validation :emptyProducts]))
                   "Empty arrays produced item-property issues or lost item-count authoring." observed)
  (support/assert! (= {:wildcardMatches 3 :exactMatches 1 :issues 0} (get-in observed [:validation :combined]))
                   "Exact-index and every-item constraints did not compose." observed)
  (support/assert! (= [{:instancePath "/orders/0/items/1/sku"
                        :templatePath "/orders/*/items/*/sku"
                        :expected "non-empty string"
                        :actual ""}]
                       (get-in observed [:validation :repeated]))
                   "Repeated wildcard validation lost the concrete nested issue path." observed)
  (assert-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :schema-nested-path (observation!)) world)
        observed (:schema-nested-path world)]
    (support/assert! observed "Schema nested path browser adapter was not executed." {:step text})
    (assert-observation! example observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (entry-steps (:text spec)) (:schema-nested-path world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
