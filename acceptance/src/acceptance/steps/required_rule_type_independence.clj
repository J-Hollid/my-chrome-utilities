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

(def example-values
  {"property_path" #{"/title" "/quantity" "/consented" "/customer" "/products"}
   "property_type" #{"string" "number" "boolean" "object" "array"}
   "page_type_value" #{"product_detail" "category"}
   "property_state" #{"missing" "present"}
   "rule_result" #{"Failed" "Passed" "Not applicable"}
   "issue_count" #{"0" "1"}
   "rule_name" #{"Approved page types" "Revenue range" "Product count"}
   "operator" #{"Allowed values" "Numeric range" "Item count"}
   "availability_outcome" #{"Approved page types is absent from attachable results"
                            "Revenue range is absent from attachable results"
                            "Product count is absent from attachable results"}
   "rule_definition" #{"Allowed values type string" "Numeric range type number"}
   "picker_outcome" #{"no attachment action for that reusable rule"}})

(def attachment-relation
  {:keys ["property_path" "property_type"]
    :rows #{["/title" "string"]
            ["/quantity" "number"]
            ["/consented" "boolean"]
            ["/customer" "object"]
            ["/products" "array"]}})

(def example-relations
  {:model
   [attachment-relation
    {:keys ["property_type" "page_type_value" "property_state" "rule_result" "issue_count"]
    :rows #{["string" "product_detail" "missing" "Failed" "1"]
            ["number" "product_detail" "missing" "Failed" "1"]
            ["boolean" "product_detail" "missing" "Failed" "1"]
            ["object" "product_detail" "missing" "Failed" "1"]
            ["array" "product_detail" "missing" "Failed" "1"]
            ["array" "product_detail" "present" "Passed" "0"]
            ["array" "category" "missing" "Not applicable" "0"]}}
   {:keys ["rule_name" "operator" "property_type" "availability_outcome"]
    :rows #{["Approved page types" "Allowed values" "number"
             "Approved page types is absent from attachable results"]
            ["Revenue range" "Numeric range" "string"
             "Revenue range is absent from attachable results"]
            ["Product count" "Item count" "object"
             "Product count is absent from attachable results"]}}]
   :runtime
   [attachment-relation
    {:keys ["property_type" "property_state" "rule_result" "issue_count"]
    :rows #{["string" "missing" "Failed" "1"]
            ["number" "missing" "Failed" "1"]
            ["boolean" "missing" "Failed" "1"]
            ["object" "missing" "Failed" "1"]
            ["array" "missing" "Failed" "1"]
            ["array" "present" "Passed" "0"]}}
   {:keys ["rule_definition" "property_type" "picker_outcome"]
    :rows #{["Allowed values type string" "number"
             "no attachment action for that reusable rule"]
            ["Numeric range type number" "string"
             "no attachment action for that reusable rule"]}}]})

(defn- validate-example! [mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Required-rule type-independence example value was outside the specified contract.")
  (support/validate-example-relations!
   (get example-relations mode) example
   "Required-rule type-independence example row was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :required-rule-type-independence-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T22:26:46.778432691+02:00", :module-hash "-1916979787", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "2095163204"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "1479788147"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1040309145"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "-1393255365"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-854766104"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 56, :hash "-1052009109"} {:id "def/example-values", :kind "def", :line 58, :end-line 71, :hash "704615422"} {:id "def/attachment-relation", :kind "def", :line 73, :end-line 79, :hash "-473351250"} {:id "def/example-relations", :kind "def", :line 81, :end-line 112, :hash "-952730385"} {:id "defn-/validate-example!", :kind "defn-", :line 114, :end-line 120, :hash "-1681437882"} {:id "def/handlers", :kind "def", :line 122, :end-line 125, :hash "-686049633"}]}
;; clj-mutate-manifest-end
