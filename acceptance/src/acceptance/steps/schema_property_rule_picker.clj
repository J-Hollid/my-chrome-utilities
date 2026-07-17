(ns acceptance.steps.schema-property-rule-picker
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-property-rule-picker.feature")
(defonce ^:private observation (atom nil))
(def ^:private entry-step "schema Page view working draft is open at 320 CSS px wide")

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER"
            :observation-key :schemaPropertyRulePicker
            :runtime-error "Schema property rule picker browser runtime failed."
            :missing-error "Schema property rule picker browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(def availability-examples
  #{["page_type" "string" "Required" "available"]
    ["page_type" "string" "Exact value" "available"]
    ["page_type" "string" "Regular expression" "available"]
    ["page_type" "string" "Text length" "available"]
    ["page_type" "string" "Digits only" "available"]
    ["revenue" "number" "Numeric range" "available"]
    ["items" "array" "Item count" "available"]
    ["revenue" "number" "Regular expression" "unavailable"]
    ["product" "object" "Allowed values" "unavailable"]})

(def search-examples
  {"Approved pages" "rule name"
   "allowed values" "operator"
   "checkout" "parameters"
   "public pages" "description"
   "string" "applicable type"
   "version 2" "version"})

(def configuration-control-examples
  #{["page_type" "string" "Required" "no parameter controls"]
    ["page_type" "string" "Exact value" "one type-aware Exact value field"]
    ["page_type" "string" "Allowed values" "repeatable type-aware value fields"]
    ["page_type" "string" "Regular expression" "Pattern"]
    ["page_type" "string" "Text length" "Comparison and non-negative Limit"]
    ["page_type" "string" "Digits only" "no parameter controls"]
    ["revenue" "number" "Numeric range" "optional Minimum and Maximum"]
    ["items" "array" "Item count" "Comparison and non-negative Limit"]})

(def keyboard-examples
  {["Arrow key navigation followed by Enter" "the selected rule action runs"]
   {:selected "Required" :configured true}
   ["Escape" "no rule is created or attached"]
   {:escapeClosed true}})

(defn- property-rule-example [example]
  [(support/require-example example "property_name")
   (support/require-example example "property_type")
   (support/require-example example "rule_type")])

(defn- assert-property-rule-example! [example observed value-key examples observation-key unknown-message changed-message]
  (when-let [expected (support/example-value example value-key)]
    (let [[property-name property-type rule-type] (property-rule-example example)]
      (support/assert! (contains? examples [property-name property-type rule-type expected])
                       unknown-message {:example example})
      (support/assert! (= expected (get-in observed [observation-key (keyword (str property-type ":" rule-type))]))
                       changed-message {:example example}))))

(defn- assert-availability-example! [example observed]
  (assert-property-rule-example! example observed "availability" availability-examples :availability
                                 "Unknown property-rule availability example."
                                 "Property type compatibility changed."))

(defn- assert-search-example! [example observed]
  (when-let [metadata (support/example-value example "matched_metadata")]
    (let [query (support/require-example example "query")]
      (support/assert! (= metadata (get search-examples query))
                       "Unknown reusable-rule search example." {:example example}))
    (support/assert! (= ["Approved pages version 2"] (get-in observed [:searches (keyword metadata)]))
                     "Reusable rule metadata search changed." {:example example})))

(defn- assert-configuration-control-example! [example observed]
  (assert-property-rule-example! example observed "parameter_controls" configuration-control-examples :configurationControls
                                 "Unknown built-in configuration-control example."
                                 "Built-in rule configuration controls changed."))

(defn- assert-validation-example! [example observed]
  (when-let [configuration (support/example-value example "configuration")]
    (let [rule-type (support/require-example example "rule_type")
          expected-result (support/require-example example "creation_result")
          expected-assistance (support/require-example example "assistance")
          actual (get-in observed [:validations (keyword (str rule-type ":" configuration))])]
      (support/assert! (= {:creationResult expected-result :assistance expected-assistance} actual)
                       "Local built-in rule validation changed." {:example example}))))

(defn- assert-keyboard-example! [example observed]
  (when-let [picker-input (support/example-value example "picker_input")]
    (let [selection-outcome (support/require-example example "selection_outcome")
          expected (get keyboard-examples [picker-input selection-outcome])]
      (support/assert! (= expected (select-keys (:keyboard observed) (keys expected)))
                       "Rule-picker keyboard example changed." {:example example}))))

(defn- assert-navigation-example! [example observed]
  (when-let [navigation-action (support/example-value example "navigation_action")]
    (let [selection-outcome (support/require-example example "selection_outcome")]
      (support/assert! (case [navigation-action selection-outcome]
                         ["Back to rule choices" "compatible rule choices return for product.sku"]
                         (= "Add rule for product.sku · type string" (get-in observed [:navigation :back :heading]))
                         ["Cancel" "the dialog closes and focus returns to Add rule for product.sku"]
                         (= {:closed true :focusReturned true} (get-in observed [:navigation :cancel]))
                         false)
                       "Rule-configuration navigation example changed." {:example example}))))

(defn- assert-example! [example observed]
  (assert-availability-example! example observed)
  (assert-search-example! example observed)
  (assert-configuration-control-example! example observed)
  (assert-validation-example! example observed)
  (assert-keyboard-example! example observed)
  (assert-navigation-example! example observed))

(defn- assert-picker! [example observed]
  (support/assert! (= {:label "Add rule" :pickerAbsent true :inlineResults true :expandedMenu true} (:closed observed))
                   "Closed property rows exposed inline rule results." observed)
  (support/assert! (= {:heading "Add rule for page_type · type string" :searchFocused true :bounded true :scrolls true :modal true :backgroundExcluded true} (:opened observed))
                   "The property rule picker did not open as a focused bounded modal." observed)
  (support/assert! (= ["Create a rule" "Attach from Rule Library"] (:groups observed))
                   "Built-in and reusable rule groups were not kept distinct." observed)
  (support/assert! (and (some #(str/includes? % "regular expression · no parameters · type string") (:metadata observed))
                        (some #(str/includes? % "homepage, checkout · type string · version 2") (:metadata observed)))
                   "Rule results omitted readable compatibility metadata." observed)
  (support/assert! (str/includes? (:builtInConfiguration observed) "Configure Regular expression for /page_type")
                   "Built-in rule selection did not open local configuration." observed)
  (support/assert! (= {:pickerClosed true :focusReturned true :activeCount " (1 active rules)" :draftRules 1 :currentRules 0 :currentVersion 3} (:attached observed))
                   "Reusable rule attachment did not remain isolated in the working draft." observed)
  (support/assert! (= {:disabled true :label "Approved pages version 2 · already attached"} (:already observed))
                   "Duplicate reusable rule attachment remained available." observed)
  (support/assert! (= {:message "No compatible rules match this search" :clearAvailable true :restored true :unchanged true} (:empty observed))
                   "Empty search recovery changed the working draft or failed to restore results." observed)
  (support/assert! (= {:selected "Required" :configured true :escapeClosed true :layoutUnchanged true} (:keyboard observed))
                   "Keyboard selection or dismissal changed the schema editor layout." observed)
  (support/assert! (= {:severity true :message "Issue message (optional)" :reusable "Save as reusable rule in Rule Library" :reusableDefault false :actions true :readable true} (:configurationCommon observed))
                   "Common local-rule controls or the 320px layout changed." observed)
  (support/assert! (= {:initial {:blocked true :assistance "Add at least one allowed value"}
                       :entered {:values ["ABC-1" "XYZ-2"] :editable true :removable true :createAvailable true}}
                      (:allowedValues observed))
                   "Repeatable allowed-value editing or readiness changed." observed)
  (support/assert! (= {:checked {:nameRequired true :description true :explanation "This reusable rule will be available to other schemas." :blankBlocked true}
                       :unchecked {:fieldsHidden true :values ["ABC-1" "XYZ-2"] :severity "warning" :message "Use an approved SKU"}}
                      (:reusableToggle observed))
                   "Reusable-rule fields did not preserve local configuration." observed)
  (support/assert! (= {:count 1 :operator "allowed-values" :allowedValues ["ABC-1" "XYZ-2"] :severity "warning" :message "Use an approved SKU"
                       :activeCount " (1 active rules)" :libraryUnchanged true :currentRules 0 :currentVersion 3 :closed true :focusReturned true}
                      (:localCreation observed))
                   "Local rule creation did not stay in the working draft." observed)
  (support/assert! (= {:libraryCount 1 :version 1 :type "string" :attachmentCount 1 :sameIdentity true :localCount 1
                       :details {:allowedValues ["ABC-1" "XYZ-2"] :severity "warning" :message "Use an approved SKU" :description "SKUs accepted by fulfilment"}
                       :closed true :focusReturned true}
                      (:reusableCreation observed))
                   "Reusable rule creation lost identity or configuration." observed)
  (support/assert! (= {:back {:choices ["Required" "Exact value" "Allowed values" "Regular expression" "Text length" "Digits only"]
                              :heading "Add rule for product.sku · type string"}
                       :cancel {:closed true :focusReturned true}
                       :unchanged true}
                      (:navigation observed))
                   "Back or Cancel created a rule or lost picker focus." observed)
  (assert-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (= text entry-step) (assoc world :schema-property-rule-picker (observation!)) world)
        observed (:schema-property-rule-picker world)]
    (support/assert! observed "Schema property rule picker browser adapter was not executed." {:step text})
    (assert-picker! example observed)
    world))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs [feature-file] #{})
   #{entry-step}
   :schema-property-rule-picker
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T19:13:27.882220194+02:00", :module-hash "-1260917873", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "110500236"} {:id "def/feature-file", :kind "def", :line 5, :end-line 5, :hash "-1761985661"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1819867165"} {:id "def/entry-step", :kind "def", :line 7, :end-line 7, :hash "-684177608"} {:id "defn-/load-observation!", :kind "defn-", :line 9, :end-line 15, :hash "1271028503"} {:id "defn-/observation!", :kind "defn-", :line 17, :end-line 17, :hash "-775394783"} {:id "def/availability-examples", :kind "def", :line 19, :end-line 28, :hash "1125325596"} {:id "def/search-examples", :kind "def", :line 30, :end-line 36, :hash "-481968028"} {:id "def/configuration-control-examples", :kind "def", :line 38, :end-line 46, :hash "-1398554654"} {:id "def/keyboard-examples", :kind "def", :line 48, :end-line 52, :hash "-1451509122"} {:id "defn-/property-rule-example", :kind "defn-", :line 54, :end-line 57, :hash "1631401399"} {:id "defn-/assert-property-rule-example!", :kind "defn-", :line 59, :end-line 65, :hash "587076922"} {:id "defn-/assert-availability-example!", :kind "defn-", :line 67, :end-line 70, :hash "-1133205309"} {:id "defn-/assert-search-example!", :kind "defn-", :line 72, :end-line 78, :hash "-1774368180"} {:id "defn-/assert-configuration-control-example!", :kind "defn-", :line 80, :end-line 83, :hash "-294410283"} {:id "defn-/assert-validation-example!", :kind "defn-", :line 85, :end-line 92, :hash "-549968143"} {:id "defn-/assert-keyboard-example!", :kind "defn-", :line 94, :end-line 99, :hash "2098227017"} {:id "defn-/assert-navigation-example!", :kind "defn-", :line 101, :end-line 110, :hash "1051386276"} {:id "defn-/assert-example!", :kind "defn-", :line 112, :end-line 118, :hash "-217916821"} {:id "defn-/assert-picker!", :kind "defn-", :line 120, :end-line 165, :hash "1604428541"} {:id "defn-/transition", :kind "defn-", :line 167, :end-line 172, :hash "1019694489"} {:id "def/handlers", :kind "def", :line 174, :end-line 179, :hash "-1688861492"}]}
;; clj-mutate-manifest-end
