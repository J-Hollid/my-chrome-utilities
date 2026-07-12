(ns acceptance.steps.guided-validation-assertions
  (:require [acceptance.steps.guided-validation-path-assertions :as path]
            [acceptance.steps.guided-validation-destination-assertions :as destination]
            [acceptance.steps.guided-validation-step-assertions :as steps]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- example-value [example key]
  (support/require-example example key))

(defn- creation-opened [_example observation]
  (support/assert! (= [true "Choose properties"] [(get-in observation [:initial :visible]) (get-in observation [:initial :heading])])
                   "Guided validation did not open at property selection." {:observation observation}))

(defn- creation-retained-event [_example observation]
  (support/assert! (str/includes? (get-in observation [:scope :prefill])
                                  "event pageview; source event-history")
                   "Guided validation did not retain captured event context." {:observation observation}))

(defn- creation-unpersisted [_example observation]
  (support/assert! (true? (get-in observation [:initial :persistedUnchanged]))
                   "Opening the guided draft persisted library state." {:observation observation}))

(defn- creation-allowed-values [_example observation]
  (support/assert! (= ["Allowed value 1" "Allowed value 2"] (get-in observation [:values :labels]))
                   "Guided allowed values were not retained." {:observation observation}))

(defn- creation-scope [_example observation]
  (support/assert! (= "This domain on all paths" (get-in observation [:scope :selected]))
                   "Guided scope default was not retained." {:observation observation}))

(defn- creation-review [_example observation]
  (support/assert! (str/includes? (:reviewBeforeBack observation) "page_type to be product_list or homepage")
                   "Guided review omitted the readable requirement." {:observation observation}))

(defn- creation-back-navigation [_example observation]
  (support/assert! (= "domain-all-paths" (:retainedScope observation))
                   "Guided Back navigation lost the reviewed scope." {:observation observation}))

(defn- creation-saved [_example observation]
  (support/assert! (= [1 1 true]
                      [(get-in observation [:saved :schemas])
                       (get-in observation [:saved :localRules])
                       (get-in observation [:saved :assignment :enabled])])
                   "Guided validation was not persisted as one enabled schema requirement." {:observation observation}))

(defn- creation-routing [_example observation]
  (support/assert! (= ["event-history" "pageview" "payload" "127.0.0.1"]
                      (mapv #(get-in observation [:saved :assignment %])
                            [:sourceId :eventName :target :domainCondition]))
                   "Guided assignment did not preserve reviewed routing." {:observation observation}))

(defn- creation-readable [_example observation]
  (support/assert! (str/includes? (:reviewBeforeBack observation)
                                  "page_type to be product_list or homepage")
                   "Saved validation was not displayed readably." {:observation observation}))

(defn- creation-published [_example observation]
  (support/assert! (= ["Publish this rule for Rule Library reuse" 1 true]
                      [(get-in observation [:published :label])
                       (get-in observation [:published :reusableRules])
                       (= (get-in observation [:published :reusableRuleId])
                          (get-in observation [:published :attachedRuleId]))])
                   "Reusable guided rule was not attached and persisted." {:observation observation}))

(defn- creation-advanced [_example observation]
  (support/assert! (= [true "pageview requirement" "Severity Error; version policy Pinned."] [(get-in observation [:initial :advancedPrimary]) (get-in observation [:advanced :rule]) (get-in observation [:advanced :defaults])])
                   "Advanced guided defaults were not inferred behind disclosure." {:observation observation}))

(defn- creation-default [text observation]
  (support/assert! (true? (get-in observation [:initial :visible]))
                   "Guided creation browser boundary was not exercised." {:step text}))

(def creation-assertions
  (merge
   (zipmap #{"the operator activates Create validation from this event"
             "a guided validation draft opens at property selection"}
           (repeat creation-opened))
   {"the draft retains event pageview, its captured source, payload, domain 127.0.0.1, and pathname /" creation-retained-event
    "no schema, rule, or assignment is persisted" creation-unpersisted}
   (zipmap #{"the operator selects property page_type"
             "configures Must be one of these values with product_list and homepage"}
           (repeat creation-allowed-values))
   {"chooses This domain on all paths" creation-scope
    "chooses a schema destination" creation-review}
   (zipmap #{"the review is displayed"
             "it states that pageview on 127.0.0.1 requires page_type to be product_list or homepage"
             "it identifies the current event as passing or explains why it fails"}
           (repeat creation-review))
   {"the operator can return to and correct each completed stage without losing the draft" creation-back-navigation}
   (zipmap #{"a complete guided validation draft has a schema destination and local rule"
             "the operator saves the validation"
             "its selected schema destination, local rule, and enabled assignment are persisted together"}
           (repeat creation-saved))
   {"validation uses the captured source, event pageview, payload target, and reviewed scope" creation-routing
    "the completed validation is displayed as one readable requirement" creation-readable}
   (zipmap #{"the validation is ready to publish its rule for reuse"
             "publication details appear"
             "Rule Library reuse is stated"
             "saving persists one reusable rule attached to the new schema"}
           (repeat creation-published))
   (zipmap #{"the guided validation draft is displayed"
             "rule name, severity, custom message, source, target, priority, and version policy are absent from the primary flow"
             "Edit advanced settings exposes those fields without clearing inferred values"
             "rule name, message, source, and target are generated from the selected event"
             "severity is Error and version policy is Pinned by default"}
           (repeat creation-advanced))))

(defn- constraint-detected [_example observation]
  (support/assert! (= ["String — detected from this event" false] [(get-in observation [:requirement :detected]) (get-in observation [:requirement :oldControls])])
                   "Guided constraint authoring exposed implementation-oriented controls." {:observation observation}))

(defn- constraint-compatible [example observation]
  (let [type (keyword (example-value example "expected_type"))
        compatible (example-value example "compatible_requirement")
        incompatible (example-value example "incompatible_requirement")
        available (set (get-in observation [:production :requirements type]))
        known-requirements (set (mapcat val (get-in observation [:production :requirements])))]
    (support/assert! (= [true true false]
                        [(contains? known-requirements incompatible)
                         (contains? available compatible)
                         (contains? available incompatible)])
                     "Requirement compatibility did not match the expected type."
                     {:type type :available available :example example})))

(defn- constraint-override [_example observation]
  (support/assert! (= {:typeSource "explicit override"
                       :currentEventPasses false
                       :message "page_type was observed as String but Number is expected."
                       :correctionRequired true}
                      (get-in observation [:production :override]))
                   "Expected-type override did not retain failure and correction evidence."
                   {:production (:production observation)}))

(defn- constraint-allowed-editor [_example observation]
  (support/assert! (= [["Allowed value 1" "Allowed value 2"] 2 false]
                      [(get-in observation [:values :labels])
                       (get-in observation [:values :removeActions])
                       (get-in observation [:requirement :oldControls])])
                   "Allowed-value editor did not use labelled assisted inputs." {:observation observation}))

(def configured-value-index
  {"no values" 0
   "homepage and homepage" 1
   "product_list and a blank value" 2
   "product_list and homepage" 3})

(defn- constraint-assistance [example observation]
  (let [index (get configured-value-index (example-value example "configured_values"))
        continuation (example-value example "continuation_result")
        result (get-in observation [:production :allowedValues index])]
    (support/assert! (contains? #{"allowed" "blocked"} continuation)
                     "Continuation result must use the supported result vocabulary."
                     {:example example})
    (support/assert! (= [(= "allowed" (example-value example "continuation_result"))
                         (example-value example "input_assistance")]
                        [(:valid result) (:assistance result)])
                     "Allowed-value continuation assistance did not match the configured values."
                     {:example example :result result})))

(defn- constraint-default [text observation]
  (support/assert! (:requirement observation)
                   "Guided constraint browser boundary was not exercised." {:step text}))

(def constraint-assertions
  (steps/step-assertions
   #{"property page_type has observed value product_list with detected type string"
     "page_type is selected for validation"
     "inferred property details appear"
     "Expected data type is String marked as detected from this event"
     "one human-readable constraint selector is displayed"
     "separate Rule kind, Value type, and Operator controls are not displayed"}
   constraint-detected
   #{"property configuration expects <expected_type>"
     "compatible requirements are displayed"
     "requirement <compatible_requirement> is available"
     "requirement <incompatible_requirement> is absent or disabled with an explanation"}
   constraint-compatible
   #{"the operator overrides detected String with Number"
     "Number is retained as an explicit override"
     "the original event remains as a failing validation example"
     "the preview explains that page_type was observed as String but Number is expected"
     "incompatible configured requirements require correction rather than being silently removed"}
   constraint-override
   #{"the operator selects Must be one of these values"
     "product_list is added as the first allowed value from the current event"
     "each allowed value is a separately labelled input with a Remove value action"
     "Add another value adds a separately labelled input"
     "serialized parameter syntax is not requested from the operator"}
   constraint-allowed-editor
   #{"the allowed value editor contains <configured_values>"
     "the operator attempts to continue"
     "continuation result is <continuation_result>"
     "input assistance states <input_assistance>"}
   constraint-assistance))

(defn- form-hint [_example observation]
  (support/assert! (= "String — detected from this event" (get-in observation [:requirement :detected]))
                   "Guided field assistance is not persistently visible." {:observation observation}))

(defn- form-errors [_example observation]
  (support/assert! (= [true 2 2 true true]
                      [(get-in observation [:multipleInvalid :focused])
                       (count (get-in observation [:multipleInvalid :links]))
                       (count (get-in observation [:multipleInvalid :inline]))
                       (every? #(str/includes? % "-error") (get-in observation [:multipleInvalid :described]))
                       (every? #(str/starts-with? (second %) "#guided-path-expression-")
                               (get-in observation [:multipleInvalid :links]))])
                   "Guided validation errors were not summarized, linked, and focused." {:observation observation}))

(defn- form-navigation [_example observation]
  (support/assert! (= ["current" "complete" "domain-all-paths" "new" true]
                      [(get-in observation [:reviewStages 4 1])
                       (get-in observation [:reviewStages 0 1])
                       (:retainedScope observation)
                       (get-in observation [:retainedDestination :kind])
                       (get-in observation [:requirement :focused])])
                   "Guided stage navigation did not expose progress, focus, and retained state." {:observation observation}))

(defn- form-status [_example observation]
  (support/assert! (= ["2 allowed values" true "status"] [(get-in observation [:values :assistance]) (get-in observation [:values :focusRetained]) (get-in observation [:values :statusRole])])
                   "Guided dynamic status was not retained visibly." {:observation observation}))

(defn- form-default [text observation]
  (support/assert! (true? (get-in observation [:initial :visible]))
                   "Guided form browser boundary was not exercised." {:step text}))

(def form-assertions
  (merge
   (zipmap #{"a field requires an unfamiliar value or format"
             "a persistent visible hint explains what is expected"
             "the field is programmatically described by that hint"
             "placeholder text and tooltips are not the only source of essential instructions"}
           (repeat form-hint))
   (zipmap #{"the operator continues with invalid input in more than one field"
             "an error summary identifies each invalid field and links to its control"
             "each invalid field has a specific inline error explaining how to correct it"
             "keyboard focus moves to the error summary"
             "entered values and completed stages are retained"}
           (repeat form-errors))
   (zipmap #{"the operator moves through property, requirement, scope, schema destination, and review stages"
             "the operator moves through property, schema destination, requirement, scope, and review stages"
             "the current stage and completed stages are exposed visually and programmatically"
             "stage headings describe the current task"
             "Back returns to the previous stage with its state preserved"
             "Continue moves focus to the next stage heading"}
           (repeat form-navigation))
   (zipmap #{"inferred values or validation previews change without navigation"
             "a concise status message announces the change without moving keyboard focus"
             "the same status remains available as visible text"}
           (repeat form-status))))

(def mode-assertions
  {:creation creation-assertions
   :constraint constraint-assertions
   :form form-assertions
   :path path/assertions
   :destination destination/assertions})

(def mode-defaults
  {:creation creation-default
   :constraint constraint-default
   :form form-default
   :path path/default-assertion
   :destination destination/default-assertion})

(defn assert-mode! [mode text example observation]
  (if-some [assertion (get (get mode-assertions mode) text)]
    (assertion example observation)
    ((get mode-defaults mode) text observation)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-12T23:43:27.644299685+02:00", :module-hash "-1211925115", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1859862141"} {:id "defn-/example-value", :kind "defn-", :line 8, :end-line nil, :hash "-1416813660"} {:id "defn-/creation-opened", :kind "defn-", :line 11, :end-line nil, :hash "-1842595073"} {:id "defn-/creation-retained-event", :kind "defn-", :line 15, :end-line nil, :hash "-2018182932"} {:id "defn-/creation-unpersisted", :kind "defn-", :line 20, :end-line nil, :hash "-146017932"} {:id "defn-/creation-allowed-values", :kind "defn-", :line 24, :end-line nil, :hash "1306662319"} {:id "defn-/creation-scope", :kind "defn-", :line 28, :end-line nil, :hash "934676009"} {:id "defn-/creation-review", :kind "defn-", :line 32, :end-line nil, :hash "-1931822491"} {:id "defn-/creation-back-navigation", :kind "defn-", :line 36, :end-line nil, :hash "-1249086609"} {:id "defn-/creation-saved", :kind "defn-", :line 40, :end-line nil, :hash "-2138797715"} {:id "defn-/creation-routing", :kind "defn-", :line 47, :end-line nil, :hash "-1708489616"} {:id "defn-/creation-readable", :kind "defn-", :line 53, :end-line nil, :hash "1854593959"} {:id "defn-/creation-published", :kind "defn-", :line 58, :end-line nil, :hash "-1888218259"} {:id "defn-/creation-advanced", :kind "defn-", :line 66, :end-line nil, :hash "-36800485"} {:id "defn-/creation-default", :kind "defn-", :line 70, :end-line nil, :hash "-93888679"} {:id "def/creation-assertions", :kind "def", :line 74, :end-line nil, :hash "32505440"} {:id "defn-/constraint-detected", :kind "defn-", :line 109, :end-line nil, :hash "1533793337"} {:id "defn-/constraint-compatible", :kind "defn-", :line 113, :end-line nil, :hash "-1565552319"} {:id "defn-/constraint-override", :kind "defn-", :line 126, :end-line nil, :hash "-855273779"} {:id "defn-/constraint-allowed-editor", :kind "defn-", :line 135, :end-line nil, :hash "1864469262"} {:id "def/configured-value-index", :kind "def", :line 142, :end-line nil, :hash "2033476858"} {:id "defn-/constraint-assistance", :kind "defn-", :line 148, :end-line nil, :hash "211937582"} {:id "defn-/constraint-default", :kind "defn-", :line 161, :end-line nil, :hash "508742187"} {:id "def/constraint-assertions", :kind "def", :line 165, :end-line nil, :hash "-1900187558"} {:id "defn-/form-hint", :kind "defn-", :line 197, :end-line nil, :hash "656017061"} {:id "defn-/form-errors", :kind "defn-", :line 201, :end-line nil, :hash "138431701"} {:id "defn-/form-navigation", :kind "defn-", :line 211, :end-line nil, :hash "55246853"} {:id "defn-/form-status", :kind "defn-", :line 220, :end-line nil, :hash "41752371"} {:id "defn-/form-default", :kind "defn-", :line 224, :end-line nil, :hash "-1191677373"} {:id "def/form-assertions", :kind "def", :line 228, :end-line nil, :hash "-1280302551"} {:id "def/mode-assertions", :kind "def", :line 253, :end-line nil, :hash "1886280329"} {:id "def/mode-defaults", :kind "def", :line 260, :end-line nil, :hash "2136824792"} {:id "defn/assert-mode!", :kind "defn", :line 267, :end-line nil, :hash "-1887265690"}]}
;; clj-mutate-manifest-end
