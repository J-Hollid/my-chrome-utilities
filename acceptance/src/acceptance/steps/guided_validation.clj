(ns acceptance.steps.guided-validation
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-guided-validation-constraint-authoring.feature"
   "features/data-layer-guided-validation-creation.feature"
   "features/data-layer-guided-validation-form-assistance.feature"
   "features/data-layer-guided-validation-path-scope.feature"])

(def ^:private entry-modes
  {"captured event pageview from http://127.0.0.1:4173/ is selected in Live" :creation
   "a guided validation draft is open for captured event pageview" :constraint
   "the guided validation flow is displayed" :form
   "a guided validation draft is open for pageview from http://127.0.0.1:4173/" :path})

(defonce ^:private browser-observation (atom nil))

(defn- browser-observation! []
  (or @browser-observation
      (let [result (process/shell (assoc support/build-shell-options
                                         :env {"GUIDED_VALIDATION_BROWSER_ADAPTER" "1"})
                                  "node" "test/side-panel-component-layout-runtime-test.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            payload (when line (json/parse-string line true))
            observation (:guidedValidation payload)]
        (support/assert! (zero? (:exit result))
                         "Guided validation browser runtime verification failed."
                         {:out (:out result) :err (:err result)})
        (support/assert! observation "Guided validation browser observation is missing." {:payload payload})
        (reset! browser-observation observation))))

(defn- example-value [example key]
  (support/require-example example key))

(defn- assert-creation! [text observation]
  (cond
    (contains? #{"the operator activates Create validation from this event"
                 "a guided validation draft opens at property selection"} text)
    (support/assert! (and (true? (get-in observation [:initial :visible]))
                          (= "Choose properties" (get-in observation [:initial :heading])))
                     "Guided validation did not open at property selection." {:observation observation})

    (= text "the draft retains event pageview, its captured source, payload, domain 127.0.0.1, and pathname /")
    (support/assert! (str/includes? (get-in observation [:scope :prefill]) "event pageview; source event-history")
                     "Guided validation did not retain captured event context." {:observation observation})

    (= text "no schema, rule, or assignment is persisted")
    (support/assert! (true? (get-in observation [:initial :persistedUnchanged]))
                     "Opening the guided draft persisted library state." {:observation observation})

    (contains? #{"the operator selects property page_type"
                 "configures Must be one of these values with product_list and homepage"} text)
    (support/assert! (= ["Allowed value 1" "Allowed value 2"] (get-in observation [:values :labels]))
                     "Guided allowed values were not retained." {:observation observation})

    (= text "chooses This domain on all paths")
    (support/assert! (= "This domain on all paths" (get-in observation [:scope :selected]))
                     "Guided scope default was not retained." {:observation observation})

    (contains? #{"the review is displayed"
                 "it states that pageview on 127.0.0.1 requires page_type to be product_list or homepage"
                 "it identifies the current event as passing or explains why it fails"} text)
    (support/assert! (str/includes? (:reviewBeforeBack observation) "page_type to be product_list or homepage")
                     "Guided review omitted the readable requirement." {:observation observation})

    (= text "the operator can return to and correct each completed stage without losing the draft")
    (support/assert! (= "domain-all-paths" (:retainedScope observation))
                     "Guided Back navigation lost the reviewed scope." {:observation observation})

    (contains? #{"a complete guided validation draft uses a local rule"
                 "the operator saves the validation"
                 "its schema, local rule, and enabled assignment are persisted together"} text)
    (support/assert! (= [1 1 true]
                        [(get-in observation [:saved :schemas])
                         (get-in observation [:saved :localRules])
                         (get-in observation [:saved :assignment :enabled])])
                     "Guided validation was not persisted as one enabled schema requirement." {:observation observation})

    (= text "validation uses the captured source, event pageview, payload target, and reviewed scope")
    (support/assert! (= ["event-history" "pageview" "payload" "127.0.0.1"]
                        (mapv #(get-in observation [:saved :assignment %])
                              [:sourceId :eventName :target :domainCondition]))
                     "Guided assignment did not preserve reviewed routing." {:observation observation})

    (= text "the completed validation is displayed as one readable requirement")
    (support/assert! (str/includes? (get-in observation [:saved :status]) "page_type must be product_list or homepage")
                     "Saved validation was not displayed readably." {:observation observation})

    (contains? #{"the validation is ready to publish its rule for reuse"
                 "publication details appear"
                 "Rule Library reuse is stated"
                 "saving persists one reusable rule attached to the new schema"} text)
    (support/assert! (and (= "Publish this rule for Rule Library reuse" (get-in observation [:published :label]))
                          (= 1 (get-in observation [:published :reusableRules]))
                          (= (get-in observation [:published :reusableRuleId])
                             (get-in observation [:published :attachedRuleId])))
                     "Reusable guided rule was not attached and persisted." {:observation observation})

    (contains? #{"the guided validation draft is displayed"
                 "schema name, rule name, severity, custom message, source, target, priority, and version policy are absent from the primary flow"
                 "Edit advanced settings exposes those fields without clearing inferred values"
                 "schema name, rule name, message, source, and target are generated from the selected event"
                 "severity is Error and version policy is Pinned by default"} text)
    (support/assert! (and (true? (get-in observation [:initial :advancedPrimary]))
                          (= "pageview validation" (get-in observation [:advanced :schema]))
                          (= "Severity Error; version policy Pinned." (get-in observation [:advanced :defaults])))
                     "Advanced guided defaults were not inferred behind disclosure." {:observation observation})

    :else (support/assert! (true? (get-in observation [:initial :visible]))
                           "Guided creation browser boundary was not exercised." {:step text})))

(defn- assert-constraint! [text example observation]
  (let [production (:production observation)]
    (cond
      (contains? #{"property page_type has observed value product_list with detected type string"
                   "page_type is selected for validation"
                   "inferred property details appear"
                   "Expected data type is String marked as detected from this event"
                   "one human-readable constraint selector is displayed"
                   "separate Rule kind, Value type, and Operator controls are not displayed"} text)
      (support/assert! (and (= "String — detected from this event" (get-in observation [:requirement :detected]))
                            (false? (get-in observation [:requirement :oldControls])))
                       "Guided constraint authoring exposed implementation-oriented controls." {:observation observation})

      (contains? #{"property configuration expects <expected_type>"
                   "compatible requirements are displayed"
                   "requirement <compatible_requirement> is available"
                   "requirement <incompatible_requirement> is absent or disabled with an explanation"} text)
      (let [type (keyword (example-value example "expected_type"))
            available (set (get-in production [:requirements type]))]
        (support/assert! (and (contains? available (example-value example "compatible_requirement"))
                              (not (contains? available (example-value example "incompatible_requirement"))))
                         "Requirement compatibility did not match the expected type."
                         {:type type :available available :example example}))

      (contains? #{"the operator overrides detected String with Number"
                   "Number is retained as an explicit override"
                   "the original event remains as a failing validation example"
                   "the preview explains that page_type was observed as String but Number is expected"
                   "incompatible configured requirements require correction rather than being silently removed"} text)
      (support/assert! (= {:typeSource "explicit override"
                           :currentEventPasses false
                           :message "page_type was observed as String but Number is expected."
                           :correctionRequired true}
                          (:override production))
                       "Expected-type override did not retain failure and correction evidence." {:production production})

      (contains? #{"the operator selects Must be one of these values"
                   "product_list is added as the first allowed value from the current event"
                   "each allowed value is a separately labelled input with a Remove value action"
                   "Add another value adds a separately labelled input"
                   "serialized parameter syntax is not requested from the operator"} text)
      (support/assert! (and (= ["Allowed value 1" "Allowed value 2"] (get-in observation [:values :labels]))
                            (= 2 (get-in observation [:values :removeActions]))
                            (false? (get-in observation [:requirement :oldControls])))
                       "Allowed-value editor did not use labelled assisted inputs." {:observation observation})

      (contains? #{"the allowed value editor contains <configured_values>"
                   "the operator attempts to continue"
                   "continuation result is <continuation_result>"
                   "input assistance states <input_assistance>"} text)
      (let [index ({"no values" 0
                    "homepage and homepage" 1
                    "product_list and a blank value" 2
                    "product_list and homepage" 3}
                   (example-value example "configured_values"))
            result (get-in production [:allowedValues index])]
        (support/assert! (= [(= "allowed" (example-value example "continuation_result"))
                             (example-value example "input_assistance")]
                            [(:valid result) (:assistance result)])
                         "Allowed-value continuation assistance did not match the configured values."
                         {:example example :result result}))

      :else (support/assert! (:requirement observation)
                             "Guided constraint browser boundary was not exercised." {:step text}))))

(defn- assert-form! [text observation]
  (cond
    (contains? #{"a field requires an unfamiliar value or format"
                 "a persistent visible hint explains what is expected"
                 "the field is programmatically described by that hint"
                 "placeholder text and tooltips are not the only source of essential instructions"} text)
    (support/assert! (= "String — detected from this event" (get-in observation [:requirement :detected]))
                     "Guided field assistance is not persistently visible." {:observation observation})

    (contains? #{"the operator continues with invalid input in more than one field"
                 "an error summary identifies each invalid field and links to its control"
                 "each invalid field has a specific inline error explaining how to correct it"
                 "keyboard focus moves to the error summary"
                 "entered values and completed stages are retained"} text)
    (support/assert! (and (true? (get-in observation [:multipleInvalid :focused]))
                          (= 2 (count (get-in observation [:multipleInvalid :links])))
                          (= 2 (count (get-in observation [:multipleInvalid :inline])))
                          (every? #(str/includes? % "-error") (get-in observation [:multipleInvalid :described]))
                          (every? #(str/starts-with? (second %) "#guided-path-expression-")
                                  (get-in observation [:multipleInvalid :links])))
                     "Guided validation errors were not summarized, linked, and focused." {:observation observation})

    (contains? #{"the operator moves through property, requirement, scope, and review stages"
                 "the current stage and completed stages are exposed visually and programmatically"
                 "stage headings describe the current task"
                 "Back returns to the previous stage with its state preserved"
                 "Continue moves focus to the next stage heading"} text)
    (support/assert! (and (= "current" (get-in observation [:reviewStages 3 1]))
                          (= "complete" (get-in observation [:reviewStages 0 1]))
                          (= "domain-all-paths" (:retainedScope observation))
                          (true? (get-in observation [:requirement :focused])))
                     "Guided stage navigation did not expose progress, focus, and retained state." {:observation observation})

    (contains? #{"inferred values or validation previews change without navigation"
                 "a concise status message announces the change without moving keyboard focus"
                 "the same status remains available as visible text"} text)
    (support/assert! (and (= "2 allowed values" (get-in observation [:values :assistance]))
                          (true? (get-in observation [:values :focusRetained]))
                          (= "status" (get-in observation [:values :statusRole])))
                     "Guided dynamic status was not retained visibly." {:observation observation})

    :else (support/assert! (true? (get-in observation [:initial :visible]))
                           "Guided form browser boundary was not exercised." {:step text})))

(defn- path-case-index [example]
  ({["Exact path" "/products" "/products"] 0
    ["Exact path" "/products" "/products/field-notebook"] 1
    ["Path pattern" "/products/*" "/products/field-notebook"] 2
    ["Regular expression" "^/products/[a-z-]+$" "/products/field-notebook"] 3
    ["Regular expression" "^/products/[a-z-]+$" "/shop/products/field-notebook"] 4}
   [(example-value example "match_type")
    (example-value example "expression")
    (example-value example "pathname")]))

(defn- assert-path! [text example observation]
  (let [production (:production observation)]
    (cond
      (contains? #{"event scope is displayed"
                   "the operator can choose This domain on all paths, Only the current path, Selected paths or patterns, or Every domain and path"
                   "This domain on all paths is selected by default"
                   "domain 127.0.0.1, event pageview, captured source, and payload target are prefilled"
                   "the operator is not asked to type any"} text)
      (support/assert! (and (= ["This domain on all paths" "Only the current path" "Selected paths or patterns" "Every domain and path"]
                              (get-in observation [:scope :choices]))
                            (= "This domain on all paths" (get-in observation [:scope :selected])))
                       "Guided path scope choices or inferred default are incomplete." {:observation observation})

      (contains? #{"Selected paths or patterns is chosen"
                   "the path condition builder opens"
                   "the current pathname / is offered as an Exact path condition"
                   "each condition has a match type, expression, match result, and Remove condition action"
                   "Add another path condition adds one separately labelled condition"
                   "the scope states that the assignment matches when any condition matches"} text)
      (support/assert! (= {:explanation "This assignment matches when any condition matches."
                           :conditionLabel "Path condition 1"
                           :matchType "Exact path"
                           :expression "/"
                           :result "/ is a match"
                           :remove "Remove condition"
                           :testButton "Test another path"}
                          (:pathBuilder observation))
                       "Rendered path builder did not expose its condition controls and match result." {:observation observation})

      (contains? #{"one <match_type> condition has expression <expression>"
                   "pathname <pathname> is tested"
                   "pathname <pathname> is a <condition_result> for that condition"} text)
      (let [result (get-in production [:paths (path-case-index example)])]
        (support/assert! (= (= "match" (example-value example "condition_result")) (:matches result))
                         "Production path condition result did not match the outline example."
                         {:example example :result result}))

      (contains? #{"path conditions are Exact path / and Path pattern /products/*"
                   "pathname /products/field-notebook is tested"
                   "the combined condition result is match"
                   "the matching Path pattern condition is identified"
                   "the Exact path condition is not required to match"} text)
      (support/assert! (= {:matchType "Path pattern" :expression "/products/*"}
                          (get-in production [:combined :matchingCondition]))
                       "Combined production condition did not identify the matching path pattern." {:production production})

      (contains? #{"a Regular expression condition is being edited"
                   "its expression is malformed"
                   "the condition identifies the syntax error and cannot be saved"
                   "a valid expression is tested against the current pathname without leaving the form"
                   "Test another path accepts a pathname and reports whether the entire pathname matches"} text)
      (support/assert! (and (false? (get-in production [:malformed :valid]))
                            (seq (get-in production [:malformed :error]))
                            (= "/products/field-notebook is a match" (:anotherPath observation)))
                       "Malformed production regular expression was not blocked with an error." {:production production})

      (contains? #{"Exact path condition /products is saved"
                   "captured URL <captured_url> is evaluated"
                   "pathname used for matching is <matched_pathname>"
                   "the saved condition returns <condition_result>"} text)
      (let [index (if (str/includes? (example-value example "captured_url") "field-notebook") 6 5)
            result (get-in production [:paths index])]
        (support/assert! (= (= "match" (example-value example "condition_result")) (:matches result))
                         "Captured URL was not reduced to its pathname before production matching."
                         {:example example :result result}))

      :else (support/assert! (:scope observation)
                             "Guided path browser boundary was not exercised." {:step text}))))

(defn- transition [world example _captures {:keys [text]}]
  (let [mode (get entry-modes text)
        world (if mode
                (assoc world
                       :guided-validation-mode mode
                       :guided-validation-observation (browser-observation!))
                world)
        observation (:guided-validation-observation world)
        active-mode (:guided-validation-mode world)]
    (support/assert! observation "Guided validation browser adapter was not executed." {:step text})
    (case active-mode
      :creation (assert-creation! text observation)
      :constraint (assert-constraint! text example observation)
      :form (assert-form! text observation)
      :path (assert-path! text example observation))
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? entry-modes (:text spec))
                           (:guided-validation-mode world)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
