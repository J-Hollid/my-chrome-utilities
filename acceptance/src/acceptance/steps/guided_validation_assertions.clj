(ns acceptance.steps.guided-validation-assertions
  (:require [acceptance.steps.support :as support]
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
  (support/assert! (str/includes? (get-in observation [:saved :status])
                                  "page_type must be product_list or homepage")
                   "Saved validation was not displayed readably." {:observation observation}))

(defn- creation-published [_example observation]
  (support/assert! (= ["Publish this rule for Rule Library reuse" 1 true]
                      [(get-in observation [:published :label])
                       (get-in observation [:published :reusableRules])
                       (= (get-in observation [:published :reusableRuleId])
                          (get-in observation [:published :attachedRuleId]))])
                   "Reusable guided rule was not attached and persisted." {:observation observation}))

(defn- creation-advanced [_example observation]
  (support/assert! (= [true "pageview validation" "Severity Error; version policy Pinned."] [(get-in observation [:initial :advancedPrimary]) (get-in observation [:advanced :schema]) (get-in observation [:advanced :defaults])])
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
   {"chooses This domain on all paths" creation-scope}
   (zipmap #{"the review is displayed"
             "it states that pageview on 127.0.0.1 requires page_type to be product_list or homepage"
             "it identifies the current event as passing or explains why it fails"}
           (repeat creation-review))
   {"the operator can return to and correct each completed stage without losing the draft" creation-back-navigation}
   (zipmap #{"a complete guided validation draft uses a local rule"
             "the operator saves the validation"
             "its schema, local rule, and enabled assignment are persisted together"}
           (repeat creation-saved))
   {"validation uses the captured source, event pageview, payload target, and reviewed scope" creation-routing
    "the completed validation is displayed as one readable requirement" creation-readable}
   (zipmap #{"the validation is ready to publish its rule for reuse"
             "publication details appear"
             "Rule Library reuse is stated"
             "saving persists one reusable rule attached to the new schema"}
           (repeat creation-published))
   (zipmap #{"the guided validation draft is displayed"
             "schema name, rule name, severity, custom message, source, target, priority, and version policy are absent from the primary flow"
             "Edit advanced settings exposes those fields without clearing inferred values"
             "schema name, rule name, message, source, and target are generated from the selected event"
             "severity is Error and version policy is Pinned by default"}
           (repeat creation-advanced))))

(defn- constraint-detected [_example observation]
  (support/assert! (= ["String — detected from this event" false] [(get-in observation [:requirement :detected]) (get-in observation [:requirement :oldControls])])
                   "Guided constraint authoring exposed implementation-oriented controls." {:observation observation}))

(defn- constraint-compatible [example observation]
  (let [type (keyword (example-value example "expected_type"))
        available (set (get-in observation [:production :requirements type]))]
    (support/assert! (= [true false]
                        [(contains? available (example-value example "compatible_requirement"))
                         (contains? available (example-value example "incompatible_requirement"))])
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
        result (get-in observation [:production :allowedValues index])]
    (support/assert! (= [(= "allowed" (example-value example "continuation_result"))
                         (example-value example "input_assistance")]
                        [(:valid result) (:assistance result)])
                     "Allowed-value continuation assistance did not match the configured values."
                     {:example example :result result})))

(defn- constraint-default [text observation]
  (support/assert! (:requirement observation)
                   "Guided constraint browser boundary was not exercised." {:step text}))

(def constraint-assertions
  (merge
   (zipmap #{"property page_type has observed value product_list with detected type string"
             "page_type is selected for validation"
             "inferred property details appear"
             "Expected data type is String marked as detected from this event"
             "one human-readable constraint selector is displayed"
             "separate Rule kind, Value type, and Operator controls are not displayed"}
           (repeat constraint-detected))
   (zipmap #{"property configuration expects <expected_type>"
             "compatible requirements are displayed"
             "requirement <compatible_requirement> is available"
             "requirement <incompatible_requirement> is absent or disabled with an explanation"}
           (repeat constraint-compatible))
   (zipmap #{"the operator overrides detected String with Number"
             "Number is retained as an explicit override"
             "the original event remains as a failing validation example"
             "the preview explains that page_type was observed as String but Number is expected"
             "incompatible configured requirements require correction rather than being silently removed"}
           (repeat constraint-override))
   (zipmap #{"the operator selects Must be one of these values"
             "product_list is added as the first allowed value from the current event"
             "each allowed value is a separately labelled input with a Remove value action"
             "Add another value adds a separately labelled input"
             "serialized parameter syntax is not requested from the operator"}
           (repeat constraint-allowed-editor))
   (zipmap #{"the allowed value editor contains <configured_values>"
             "the operator attempts to continue"
             "continuation result is <continuation_result>"
             "input assistance states <input_assistance>"}
           (repeat constraint-assistance))))

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
  (support/assert! (= ["current" "complete" "domain-all-paths" true]
                      [(get-in observation [:reviewStages 3 1])
                       (get-in observation [:reviewStages 0 1])
                       (:retainedScope observation)
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
   (zipmap #{"the operator moves through property, requirement, scope, and review stages"
             "the current stage and completed stages are exposed visually and programmatically"
             "stage headings describe the current task"
             "Back returns to the previous stage with its state preserved"
             "Continue moves focus to the next stage heading"}
           (repeat form-navigation))
   (zipmap #{"inferred values or validation previews change without navigation"
             "a concise status message announces the change without moving keyboard focus"
             "the same status remains available as visible text"}
           (repeat form-status))))

(def path-case-indices
  {["Exact path" "/products" "/products"] 0
   ["Exact path" "/products" "/products/field-notebook"] 1
   ["Path pattern" "/products/*" "/products/field-notebook"] 2
   ["Regular expression" "^/products/[a-z-]+$" "/products/field-notebook"] 3
   ["Regular expression" "^/products/[a-z-]+$" "/shop/products/field-notebook"] 4})

(defn- path-case-index [example]
  (get path-case-indices
       [(example-value example "match_type")
        (example-value example "expression")
        (example-value example "pathname")]))

(defn- path-scope [_example observation]
  (support/assert! (= [["This domain on all paths" "Only the current path" "Selected paths or patterns" "Every domain and path"]
                       "This domain on all paths"]
                      [(get-in observation [:scope :choices])
                       (get-in observation [:scope :selected])])
                   "Guided path scope choices or inferred default are incomplete." {:observation observation}))

(defn- path-builder [_example observation]
  (support/assert! (= {:explanation "This assignment matches when any condition matches."
                       :conditionLabel "Path condition 1"
                       :matchType "Exact path"
                       :expression "/"
                       :result "/ is a match"
                       :remove "Remove condition"
                       :testButton "Test another path"}
                      (:pathBuilder observation))
                   "Rendered path builder did not expose its condition controls and match result." {:observation observation}))

(defn- path-condition [example observation]
  (let [result (get-in observation [:production :paths (path-case-index example)])]
    (support/assert! (= (= "match" (example-value example "condition_result")) (:matches result))
                     "Production path condition result did not match the outline example."
                     {:example example :result result})))

(defn- path-combined [_example observation]
  (support/assert! (= {:matchType "Path pattern" :expression "/products/*"}
                      (get-in observation [:production :combined :matchingCondition]))
                   "Combined production condition did not identify the matching path pattern."
                   {:production (:production observation)}))

(defn- path-malformed [_example observation]
  (support/assert! (= [false true "/products/field-notebook is a match"]
                      [(get-in observation [:production :malformed :valid])
                       (boolean (seq (get-in observation [:production :malformed :error])))
                       (:anotherPath observation)])
                   "Malformed production regular expression was not blocked with an error."
                   {:production (:production observation)}))

(defn- path-captured-url [example observation]
  (let [field-notebook? (str/includes? (example-value example "captured_url") "field-notebook")
        index (get {false 5 true 6} field-notebook?)
        result (get-in observation [:production :paths index])]
    (support/assert! (= (= "match" (example-value example "condition_result")) (:matches result))
                     "Captured URL was not reduced to its pathname before production matching."
                     {:example example :result result})))

(defn- path-default [text observation]
  (support/assert! (:scope observation)
                   "Guided path browser boundary was not exercised." {:step text}))

(def path-assertions
  (merge
   (zipmap #{"event scope is displayed"
             "the operator can choose This domain on all paths, Only the current path, Selected paths or patterns, or Every domain and path"
             "This domain on all paths is selected by default"
             "domain 127.0.0.1, event pageview, captured source, and payload target are prefilled"
             "the operator is not asked to type any"}
           (repeat path-scope))
   (zipmap #{"Selected paths or patterns is chosen"
             "the path condition builder opens"
             "the current pathname / is offered as an Exact path condition"
             "each condition has a match type, expression, match result, and Remove condition action"
             "Add another path condition adds one separately labelled condition"
             "the scope states that the assignment matches when any condition matches"}
           (repeat path-builder))
   (zipmap #{"one <match_type> condition has expression <expression>"
             "pathname <pathname> is tested"
             "pathname <pathname> is a <condition_result> for that condition"}
           (repeat path-condition))
   (zipmap #{"path conditions are Exact path / and Path pattern /products/*"
             "pathname /products/field-notebook is tested"
             "the combined condition result is match"
             "the matching Path pattern condition is identified"
             "the Exact path condition is not required to match"}
           (repeat path-combined))
   (zipmap #{"a Regular expression condition is being edited"
             "its expression is malformed"
             "the condition identifies the syntax error and cannot be saved"
             "a valid expression is tested against the current pathname without leaving the form"
             "Test another path accepts a pathname and reports whether the entire pathname matches"}
           (repeat path-malformed))
   (zipmap #{"Exact path condition /products is saved"
             "captured URL <captured_url> is evaluated"
             "pathname used for matching is <matched_pathname>"
             "the saved condition returns <condition_result>"}
           (repeat path-captured-url))))

(def mode-assertions
  {:creation creation-assertions
   :constraint constraint-assertions
   :form form-assertions
   :path path-assertions})

(def mode-defaults
  {:creation creation-default
   :constraint constraint-default
   :form form-default
   :path path-default})

(defn assert-mode! [mode text example observation]
  (if-some [assertion (get (get mode-assertions mode) text)]
    (assertion example observation)
    ((get mode-defaults mode) text observation)))
