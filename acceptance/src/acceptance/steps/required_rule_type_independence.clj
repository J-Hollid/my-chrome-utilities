(ns acceptance.steps.required-rule-type-independence
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-required-rule-type-independence.feature"
   "features/data-layer-required-rule-type-independence-runtime.feature"])

(def entry-modes
  {"reusable rule Product-detail requirement says Required when /page_type Equals product_detail" :model
   "the built extension is running with production Rule Library, schema editor, validation, and persistence systems" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Required-rule type-independence model verification failed. "
   "node" "test/data-layer-required-rule-type-independence-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "REQUIRED_RULE_TYPE_INDEPENDENCE_BROWSER_ADAPTER"
    :observation-key :requiredRuleTypeIndependence
    :runtime-error "Required-rule type-independence browser runtime failed."
    :missing-error "Required-rule type-independence browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert!
   (and (= ["/title" "/quantity" "/consented" "/customer" "/products"]
           (mapv :path (:offered observed)))
        (every? :enabled (:offered observed))
        (every? #(str/includes? (:metadata %) "type any") (:offered observed)))
   "The actual property picker did not offer the legacy Required rule for every property type."
   observed)
  (support/assert!
   (and (= 5 (count (:attachments observed)))
        (every? #(= "reusable-required-7" (:id %)) (:attachments observed))
        (every? #(= 3 (:version %)) (:attachments observed))
        (= 1 (:libraryCount observed))
        (:ruleUnchanged observed)
        (:reloadPreserved observed))
   "Production persistence duplicated or rewrote the reusable Required rule."
   observed)
  (support/assert!
   (and (= ["error" "error" "error" "error" "error"] (get-in observed [:validation :missingStatuses]))
        (= ["pass" "pass" "pass" "pass" "pass"] (get-in observed [:validation :presentStatuses]))
        (= ["not-applicable" "not-applicable" "not-applicable" "not-applicable" "not-applicable"]
           (get-in observed [:validation :notApplicableStatuses]))
        (zero? (get-in observed [:validation :presentIssues]))
        (zero? (get-in observed [:validation :notApplicableIssues])))
   "Production conditional Required validation changed across consequence property types."
   observed)
  observed)

(defn- validate-example! [_mode _example] true)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :required-rule-type-independence-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
