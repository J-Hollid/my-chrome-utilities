(ns acceptance.steps.schema-rule-property-identity
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-rule-property-identity.feature"
   "features/data-layer-schema-rule-property-identity-runtime.feature"])

(def entry-modes
  {"schema Page view working draft is open in the schema editor" :model
   "the built extension side panel is running with production schema editing and rule persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema rule property identity model verification failed. "
   "node" "test/data-layer-schema-rule-property-identity-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_RULE_PROPERTY_IDENTITY_BROWSER_ADAPTER"
    :observation-key :schemaRulePropertyIdentity
    :runtime-error "Schema rule property identity browser runtime failed."
    :missing-error "Schema rule property identity browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (let [{:keys [initial required reusable distinct targets reopened runtimeErrors]}
        observed
        identities ["/page_type" "/page_levels" "/page_levels/0" "/products" "/products/*" "/products/*/name" "/customer/id"]]
    (support/assert! (and (= identities (:identities initial))
                          (= [1 1 1 1] [(:pageTypeRows initial) (:pageLevelRows initial) (:nestedRows initial) (:inheritedRows initial)])
                          (str/includes? (:metadata initial) "type string")
                          (str/includes? (:documentation initial) "Business page type")
                          (str/includes? (get-in initial [:arrayPicker :heading]) "type array")
                          (true? (get-in initial [:arrayPicker :itemCount]))
                          (false? (get-in initial [:arrayPicker :regularExpression])))
                     "Production property rows did not expose one ordered canonical identity with metadata and documentation."
                     initial)
    (support/assert! (and (= 1 (:rules required))
                          (:documentUnchanged required)
                          (:identitiesUnchanged required)
                          (:count required)
                          (= 1 (:rows required))
                          (= "true" (:selected required))
                          (:expanded required)
                          (= 31 (:editorScroll required))
                          (= 19 (:treeScroll required))
                          (= "Add rule for page_type" (:focus required)))
                     "Local rule attachment changed document identity or lost property-tree interaction state."
                     required)
    (support/assert! (and (= 1 (:rules reusable))
                          (:documentUnchanged reusable)
                          (:count reusable)
                          (true? (get-in reusable [:retry :disabled]))
                          (str/includes? (get-in reusable [:retry :label]) "already attached"))
                     "Reusable rule identity was duplicated or not recognized on retry."
                     reusable)
    (support/assert! (and (= 2 (count (:rules distinct)))
                          (= #{"required" "allowed-values"} (set (map :operator (:rules distinct))))
                          (:count distinct)
                          (:documentUnchanged distinct)
                          (:oneRow distinct))
                     "Distinct local rules collapsed together or changed the path-keyed document."
                     distinct)
    (support/assert! (every? (fn [{:keys [attached documentUnchanged oneRow metadata position]}]
                               (and (= 1 attached) documentUnchanged oneRow metadata position))
                             targets)
                     "Array, wildcard, or inherited attachment changed its property row or schema representation."
                     targets)
    (support/assert! (and (:documentUnchanged reopened)
                          (= 1 (:pageTypeRows reopened))
                          (= 2 (:pageTypeRules reopened))
                          (= identities (:identities reopened))
                          (empty? runtimeErrors))
                     "Persisting and reopening migrated the schema, lost attachments, or raised a runtime error."
                     {:reopened reopened :runtimeErrors runtimeErrors}))
  observed)

(def model-example-values
  {"schema_representation" #{"path-keyed root property /page_type"
                              "nested root property page_type"
                              "path-keyed array /page_levels and item /page_levels/0"
                              "nested array item property products every item name"
                              "inherited path-keyed property /customer/id"}
   "canonical_path" #{"/page_type" "/page_levels/0" "/products/*/name" "/customer/id"}
   "displayed_path" #{"page_type" "page_levels.0" "products.*.name" "customer.id"}
   "rule_action" #{"local Required rule creation"
                   "reusable Approved page types version 2 attachment"
                   "local conditional Exact value rule creation"}
   "attached_rule" #{"one local Required rule"
                     "Approved page types version 2"
                     "one local conditional Exact value rule"}
   "property_representation" #{"path-keyed array item /page_levels/0"
                               "nested array item products every item name"
                               "inherited path-keyed property /customer/id"}})

(def runtime-example-values
  {"property_representation" #{"path-keyed array /page_levels with item /page_levels/0"
                               "nested array item products every item name"
                               "inherited path-keyed property /customer/id"}
   "displayed_path" #{"page_levels.0" "products.*.name" "customer.id"}
   "canonical_path" #{"/page_levels/0" "/products/*/name" "/customer/id"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Schema rule property identity example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-rule-property-identity-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T00:57:30.848976235+02:00", :module-hash "-1564752606", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1406492449"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "10464539"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "298562887"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "-148459447"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "381604718"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 81, :hash "1715989740"} {:id "def/model-example-values", :kind "def", :line 83, :end-line 99, :hash "-2094573518"} {:id "def/runtime-example-values", :kind "def", :line 101, :end-line 106, :hash "883065861"} {:id "defn-/validate-example!", :kind "defn-", :line 108, :end-line 111, :hash "-1723056156"} {:id "def/handlers", :kind "def", :line 113, :end-line 116, :hash "-422892444"}]}
;; clj-mutate-manifest-end
