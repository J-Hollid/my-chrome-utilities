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

(defn validate-example! [example observation]
  (cond
    (example-value example "products_value")
    (let [row (first (filter #(and (= (example-value example "page_type_value") (:page_type %))
                                   (= (example-value example "products_value") (:products %)))
                             (:evaluations observation)))]
      (assert-example! (example-value example "rule_result") (:result row) "rule_result" example)
      (assert-example! (example-value example "issue_count") (str (:issues row)) "issue_count" example))

    (example-value example "observed_state")
    (let [row (first (filter #(and (= (example-value example "observed_state") (:observedState %))
                                   (= (example-value example "predicate") (:predicate %))
                                   (= (example-value example "configured_value") (:configuredValue %)))
                             (:predicateCases observation)))]
      (assert-example! (example-value example "predicate_result") (str (:result row)) "predicate_result" example))

    (example-value example "invalid_configuration")
    (let [row (first (filter #(= (example-value example "invalid_configuration") (:configuration %))
                             (:invalidConfigurations observation)))]
      (assert-example! (example-value example "recovery_message") (:assistance row) "recovery_message" example)
      (assert-example! false (:ready row) "rule cannot be saved" example))

    (example-value example "first_result")
    (let [row (first (filter #(and (= (example-value example "group_operator") (:operator %))
                                   (= (example-value example "first_result") (str (:first %)))
                                   (= (example-value example "second_result") (str (:second %))))
                             (:truthGroups observation)))]
      (assert-example! (example-value example "consequence_behavior") (:behavior row) "consequence_behavior" example))

    (example-value example "currency_value")
    (let [row (first (filter #(and (= (example-value example "group_operator") (:operator %))
                                   (= (example-value example "page_type_value") (:page_type %))
                                   (= (example-value example "currency_value") (:currency %)))
                             (:groups observation)))]
      (assert-example! (example-value example "invocation_count") (str (:invocationCount row)) "invocation_count" example)
      (assert-example! (example-value example "rule_result") (:result row) "rule_result" example)))
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
