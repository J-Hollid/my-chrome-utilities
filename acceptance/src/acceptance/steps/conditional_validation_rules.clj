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
  (let [{:keys [editor stored evaluations groups presentation lifecycle correlated]} observation]
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
    (require! (= [1 "/oOrder/aProducts" true true true true true 0]
                 [(:issueCount presentation) (:expectedPath presentation) (:conditionShown presentation)
                  (:consequenceShown presentation) (:triggerNotFailing presentation)
                  (:notApplicableHiddenByDefault presentation) (:notApplicableShown presentation)
                  (:notApplicableIssues presentation)])
              "Live validation did not attribute the conditional outcome to the consequence path."
              presentation)
    (require! (and (:atomic lifecycle)
                   (= {:type "string" :value "product_detail"} (:typedValue lifecycle))
                   (= [1 2 true] [(:pinnedVersion lifecycle) (:revisedVersion lifecycle) (:revisedPreserved lifecycle)]))
              "Conditional rule persistence lost atomic data or reusable version pinning."
              lifecycle)
    (require! (= [["number 29" "number 12" "Passed" 0]
                  ["null" "missing" "Failed" 1]
                  ["missing" "missing" "Not applicable" 0]
                  ["missing" "number 12" "Not applicable" 0]]
                 (mapv (juxt :priceMonthlyState :durationState :result :issues) (:cases correlated)))
              "Wildcard condition examples were not evaluated within their own products item."
              correlated)
    (require! (= [["/products/0/duration" "error"]
                  ["/products/1/duration" "not-applicable"]
                  ["/products/2/duration" "not-applicable"]
                  ["/products/3/duration" "pass"]]
                 (:mixed correlated))
              "Mixed products borrowed a wildcard condition match from another item."
              correlated)
    (require! (and (= {:predicate "/products/*/price_monthly"
                       :consequence "/products/*/duration"
                       :issue "/products/0/duration"}
                      (:persisted correlated))
                   (= "/products/*/duration" (get-in correlated [:issues 0 :templatePath]))
                   (some (fn [[path text]] (and (= path "/products/1/duration") (re-find #"not applicable" text))) (:rendered correlated))
                   (some (fn [[path text]] (and (= path "/products/3/duration") (re-find #"passed" text))) (:rendered correlated)))
              "Wildcard templates, reload, or rendered per-item details were not retained."
              correlated)
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
  [["price_monthly_state"
    {:rows (comp :cases :correlated)
     :comparisons [["price_monthly_state" :priceMonthlyState]
                   ["duration_state" :durationState]]
     :assertions [["item_result" (expected-value "item_result") :result]
                  ["issue_count" (expected-value "issue_count") (comp str :issues)]]}]
   ["products_value"
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
;; {:version 1, :tested-at "2026-07-14T19:46:53.198322473+02:00", :module-hash "-996922945", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1393853260"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-2067815109"} {:id "def/entry-step-texts", :kind "def", :line 8, :end-line 10, :hash "-2040109592"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-1618529344"} {:id "defn/browser-observation!", :kind "defn", :line 14, :end-line 20, :hash "1279255030"} {:id "defn-/require!", :kind "defn-", :line 22, :end-line 23, :hash "-2090315788"} {:id "defn/validate-browser-observation!", :kind "defn", :line 25, :end-line 56, :hash "-639609645"} {:id "defn-/example-value", :kind "defn-", :line 58, :end-line 59, :hash "369719940"} {:id "defn-/assert-example!", :kind "defn-", :line 61, :end-line 64, :hash "1583223720"} {:id "defn-/matching-row", :kind "defn-", :line 66, :end-line 73, :hash "1214301808"} {:id "defn-/expected-value", :kind "defn-", :line 75, :end-line 76, :hash "-1174460561"} {:id "defn-/validate-row-example!", :kind "defn-", :line 78, :end-line 81, :hash "565976123"} {:id "def/example-validators", :kind "def", :line 83, :end-line 113, :hash "-806894585"} {:id "defn/validate-example!", :kind "defn", :line 115, :end-line 117, :hash "1286172312"} {:id "defn-/transition", :kind "defn-", :line 119, :end-line 122, :hash "454780542"} {:id "def/handlers", :kind "def", :line 124, :end-line 129, :hash "1225550685"}]}
;; clj-mutate-manifest-end
