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
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "CONDITIONAL_VALIDATION_RULES_BROWSER_ADAPTER"
    :observation-key :conditionalValidationRules
    :runtime-error "Conditional validation rules browser runtime failed."
    :missing-error "Conditional validation rules browser evidence is missing."}))

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
    (require! (= [["Not applicable" 0] ["Failed" 1] ["Passed" 0] ["Not applicable" 0] ["Not applicable" 0]]
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
  (support/validate-observation-example!
   example observation example-validators validate-row-example!))

(defn- transition [world example _captures _spec]
  (support/validated-observation-transition
   world example :conditional-validation-rules
   browser-observation! validate-browser-observation! validate-example!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-step-texts
   :conditional-validation-rules
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T15:46:00.99146508+02:00", :module-hash "1553481179", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1393853260"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-2067815109"} {:id "def/entry-step-texts", :kind "def", :line 8, :end-line 10, :hash "-2040109592"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-1618529344"} {:id "defn/browser-observation!", :kind "defn", :line 14, :end-line 20, :hash "1279255030"} {:id "defn-/require!", :kind "defn-", :line 22, :end-line 23, :hash "-2090315788"} {:id "defn/validate-browser-observation!", :kind "defn", :line 25, :end-line 55, :hash "1838091347"} {:id "defn-/example-value", :kind "defn-", :line 57, :end-line 58, :hash "369719940"} {:id "defn-/assert-example!", :kind "defn-", :line 60, :end-line 63, :hash "1583223720"} {:id "defn-/matching-row", :kind "defn-", :line 65, :end-line 72, :hash "1214301808"} {:id "defn-/expected-value", :kind "defn-", :line 74, :end-line 75, :hash "-1174460561"} {:id "defn-/validate-row-example!", :kind "defn-", :line 77, :end-line 80, :hash "565976123"} {:id "def/example-validators", :kind "def", :line 82, :end-line 112, :hash "-806894585"} {:id "defn/validate-example!", :kind "defn", :line 114, :end-line 116, :hash "1286172312"} {:id "defn-/transition", :kind "defn-", :line 118, :end-line 121, :hash "454780542"} {:id "def/handlers", :kind "def", :line 123, :end-line 128, :hash "1225550685"}]}
;; clj-mutate-manifest-end
