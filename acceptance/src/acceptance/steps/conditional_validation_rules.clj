(ns acceptance.steps.conditional-validation-rules
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-conditional-validation-rules.feature"
   "features/data-layer-conditional-validation-rules-runtime.feature"])

(def entry-step-texts
  #{"schema Product event is being edited"
    "the built extension side panel is running with production Schema Library persistence and validation"})

(defonce browser-observation (atom nil))

(defn browser-observation! []
  (or @browser-observation
      (reset! browser-observation
              (support/load-browser-observation!
               {:adapter-env "CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER"
                :observation-key :conditionalValidationRules
                :runtime-error "Conditional validation rules browser runtime failed."
                :missing-error "Conditional validation rules browser evidence is missing."}))))

(defn- require! [condition message data]
  (support/assert! condition message data))

(defn validate-browser-observation! [observation]
  (let [{:keys [editor stored evaluations groups presentation lifecycle]} observation]
    (require! (= ["Apply only when" "/page_type" "Equals" "product_detail" 1]
                 [(:applyOnlyWhen editor) (:property editor) (:operator editor)
                  (:initializedValue editor) (:oneConsequence editor)])
              "The built conditional editor did not retain one consequence with a typed trigger."
              editor)
    (require! (= [1 "When page_type equals product_detail, oOrder.aProducts must contain at least 1 item"]
                 [(:count stored) (:summary stored)])
              "The conditional rule was not stored atomically with its readable summary."
              stored)
    (require! (= [["Failed" 1] ["Failed" 1] ["Passed" 0] ["Not applicable" 0] ["Not applicable" 0]]
                 (mapv (juxt :result :issues) evaluations))
              "Conditional production evaluation did not gate its consequence."
              evaluations)
    (require! (= [["Passed" 1] ["Not applicable" 0] ["Passed" 1] ["Not applicable" 0]]
                 (mapv (juxt :result :invocationCount) groups))
              "All and Any groups invoked their consequence incorrectly."
              groups)
    (require! (= [1 "/oOrder/aProducts" true true true true 0]
                 [(:issueCount presentation) (:expectedPath presentation) (:conditionShown presentation)
                  (:consequenceShown presentation) (:triggerNotFailing presentation)
                  (:notApplicableShown presentation) (:notApplicableIssues presentation)])
              "Live validation did not attribute the conditional outcome to the consequence path."
              presentation)
    (require! (and (:atomic lifecycle)
                   (= {:type "string" :value "product_detail"} (:typedValue lifecycle))
                   (= [1 2 true] [(:pinnedVersion lifecycle) (:revisedVersion lifecycle) (:revisedPreserved lifecycle)]))
              "Conditional rule persistence lost atomic data or reusable version pinning."
              lifecycle)
    observation))

(defn- example-value [example key]
  (support/example-value example key))

(defn- assert-example! [expected actual key example]
  (support/assert! (= expected actual)
                   (str "Conditional validation example did not match " key ".")
                   {:key key :example example :actual actual}))

(defn- matching-row [example rows comparisons]
  (first
   (filter
    (fn [row]
      (every? (fn [[key observed]]
                (= (example-value example key) (observed row)))
              comparisons))
    rows)))

(defn- expected-value [key]
  #(example-value % key))

(defn- validate-row-example! [example observation {:keys [rows comparisons assertions]}]
  (let [row (matching-row example (rows observation) comparisons)]
    (doseq [[key expected observed] assertions]
      (assert-example! (expected example) (observed row) key example))))

(def example-validators
  [["products_value"
    {:rows :evaluations
     :comparisons [["page_type_value" :page_type]
                   ["products_value" :products]]
     :assertions [["rule_result" (expected-value "rule_result") :result]
                  ["issue_count" (expected-value "issue_count") (comp str :issues)]]}]
   ["observed_state"
    {:rows :predicateCases
     :comparisons [["observed_state" :observedState]
                   ["predicate" :predicate]
                   ["configured_value" :configuredValue]]
     :assertions [["predicate_result" (expected-value "predicate_result") (comp str :result)]]}]
   ["invalid_configuration"
    {:rows :invalidConfigurations
     :comparisons [["invalid_configuration" :configuration]]
     :assertions [["recovery_message" (expected-value "recovery_message") :assistance]
                  ["rule cannot be saved" (constantly false) :ready]]}]
   ["first_result"
    {:rows :truthGroups
     :comparisons [["group_operator" :operator]
                   ["first_result" (comp str :first)]
                   ["second_result" (comp str :second)]]
     :assertions [["consequence_behavior" (expected-value "consequence_behavior") :behavior]]}]
   ["currency_value"
    {:rows :groups
     :comparisons [["group_operator" :operator]
                   ["page_type_value" :page_type]
                   ["currency_value" :currency]]
     :assertions [["invocation_count" (expected-value "invocation_count") (comp str :invocationCount)]
                  ["rule_result" (expected-value "rule_result") :result]]}]])

(defn validate-example! [example observation]
  (some (fn [[key validation]]
          (when (example-value example key)
            (validate-row-example! example observation validation)
            true))
        example-validators)
  observation)

(defn- transition [world example _captures _spec]
  (let [observation (validate-browser-observation! (browser-observation!))]
    (validate-example! example observation)
    (assoc world :conditional-validation-rules observation)))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-step-texts
   :conditional-validation-rules
   transition))
