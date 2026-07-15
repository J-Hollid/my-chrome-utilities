(ns acceptance.steps.live-guided-conditional-rules
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-live-guided-conditional-rule-authoring.feature"
   "features/data-layer-live-guided-conditional-rule-authoring-runtime.feature"])

(def entry-modes
  {"captured product_detail event is open in the Live event inspector" :model
   "the built extension side panel is running with production Live inspection, guided validation, schema persistence, and conditional validation" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Live guided conditional rule model verification failed. "
   "node" "test/data-layer-live-guided-conditional-rule-authoring-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "LIVE_GUIDED_CONDITIONAL_RULE_BROWSER_ADAPTER"
    :observation-key :liveGuidedConditionalRule
    :runtime-error "Live guided conditional rule browser runtime failed."
    :missing-error "Live guided conditional rule browser evidence is missing."}))

(defn- assert-runtime! [{:keys [requirement initial absent invalidEmpty invalidPattern invalidNoPredicates preview confirmation review local reusable cancelled lifecycle] :as observed}]
  (support/assert! (and (= "Define requirement" (:heading requirement))
                        (:applyOnlyWhen requirement)
                        (:schemaEditorHidden requirement)
                        (:pickerClosed requirement))
                   "The production guided requirement stage did not expose inline conditional authoring."
                   requirement)
  (support/assert! (and (= "Detected type: string" (:type initial))
                        (= "product_detail" (:comparison initial))
                        (= ["Exists" "Does not exist" "Equals" "Does not equal" "Is one of" "Matches pattern"] (:operators initial))
                        (= 1 (:customerCount initial))
                        (= 1 (:currentPageCount initial))
                        (:noConsequenceOption initial)
                        (:withinWidth initial)
                        (str/includes? (:summary initial) "When page_type equals product_detail"))
                   "Trigger options, typed default, readable summary, or constrained layout were incorrect."
                   initial)
  (support/assert! (and (= "Detected type: string" (:type absent))
                        (= "" (:comparison absent)))
                   "A schema-only condition property invented an observed comparison value."
                   absent)
  (support/assert! (and (:storageUnchanged invalidEmpty)
                        (:storageUnchanged invalidPattern)
                        (:storageUnchanged invalidNoPredicates)
                        (str/includes? (:assistance invalidEmpty) "Enter a comparison value")
                        (str/includes? (:assistance invalidPattern) "Correct the regular expression")
                        (str/includes? (:assistance invalidNoPredicates) "Add at least one condition"))
                   "Invalid guided conditions persisted state or lost local recovery assistance."
                   {:empty invalidEmpty :pattern invalidPattern :none invalidNoPredicates})
  (support/assert! (= {:allResult "Failed for the current event"
                       :allFalse "Not applicable for the current event"
                       :anyResult "Failed for the current event"}
                      preview)
                   "All/Any current-event preview results did not use conditional semantics."
                   preview)
  (support/assert! (and (:open confirmation) (:retained confirmation) (:discarded confirmation))
                   "Conditional predicate discard confirmation did not preserve both choices."
                   confirmation)
  (support/assert! (and (:storageUnchanged review)
                        (str/includes? (:text review) "When page_type equals product_detail, oOrder.aProducts.0 must be present"))
                   "The joint guided review was incomplete or mutated storage."
                   review)
  (support/assert! (and (= "/oOrder/aProducts/0" (:path local))
                        (= "All" (get-in local [:condition :operator]))
                        (= {:type "string" :value "product_detail"} (get-in local [:condition :predicates 0 :comparison]))
                        (= "error" (:severity local))
                        (:enabled local)
                        (= 1 (:failedIssues local))
                        (= "not-applicable" (:notApplicable local))
                        (zero? (:notApplicableIssues local))
                        (= "Add validation for /oOrder/aProducts" (:restoredFocus local)))
                   "The local conditional attachment or validation outcomes were not retained."
                   local)
  (support/assert! (= {:libraryCount 1 :attachmentCount 1 :sameIdentity true :sameRevision true :conditionEqual true :attachmentTotal 2}
                      reusable)
                   "Reusable guided save did not create one pinned identity with the complete condition group."
                   reusable)
  (support/assert! (and (:storageUnchanged cancelled)
                        (:inspectorVisible cancelled)
                        (= "Add validation for /oOrder/aProducts" (:focus cancelled)))
                   "Cancel did not preserve storage and return to the originating Live property action."
                   cancelled)
  (support/assert! (and (= 4 (:version lifecycle))
                        (:workingDraftAbsent lifecycle)
                        (:conditionRetained lifecycle)
                        (= {:type "string" :value "product_detail"} (:typedComparison lifecycle))
                        (= ["rule:product-detail-requirement"] (:libraryIds lifecycle))
                        (= 1 (:pinnedVersion lifecycle))
                        (= 2 (:revisedVersion lifecycle))
                        (:revisedConditionRetained lifecycle))
                   "Publication and export/import/reload lost conditional identities or typed predicates."
                   lifecycle)
  observed)

(def model-example-values
  {"condition_path" #{"/page_type" "/basket_total" "/consented" "/products"}
   "condition_type" #{"string" "number" "boolean" "array"}
   "compatible_operator" #{"Matches pattern" "Is at least" "Equals" "Exists"}
   "incompatible_operator" #{"Is greater than" "Matches pattern" "Is less than"}
   "group_operator" #{"All" "Any"}
   "first_result" #{"true" "false"}
   "second_result" #{"true" "false"}
   "consequence_behavior" #{"evaluated" "Not applicable"}
   "page_type_value" #{"product_detail" "category"}
   "product_state" #{"present" "missing"}
   "preview_result" #{"Passed" "Failed" "Not applicable"}
   "issue_count" #{"0" "1"}
   "rule_scope" #{"local rule" "reusable rule"}
   "persistence_outcome" #{"one local conditional attachment is created"
                            "one reusable conditional rule and one pinned attachment are created"}
   "invalid_configuration" #{"no condition"
                              "condition without a property"
                              "Equals without a comparison value"
                              "malformed Matches pattern value"
                              "Is greater than on a string property"}
   "recovery_message" #{"Add at least one condition"
                         "Choose a condition property"
                         "Enter a comparison value"
                         "Correct the regular expression"
                         "Choose an operator compatible with string"}})

(def runtime-example-values
  {"invalid_configuration" #{"no predicates"
                              "Equals with no comparison value"
                              "malformed Matches pattern value"
                              "number-only operator on string path"}
   "invalid_control" #{"condition group" "comparison value" "trigger operator"}})

(defn- validate-example! [mode example]
  (let [domains (if (= mode :runtime) runtime-example-values model-example-values)]
    (support/validate-example-domain!
     domains example
     (filter #(support/example-value example %) (keys domains))
     "Live guided conditional rule example value was outside the specified contract.")))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :live-guided-conditional-rules-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
