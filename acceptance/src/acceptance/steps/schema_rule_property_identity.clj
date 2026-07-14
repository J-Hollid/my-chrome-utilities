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
                          (str/includes? (:documentation initial) "Business page type"))
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
  (let [domains (if (= mode :runtime) runtime-example-values model-example-values)]
    (support/validate-example-domain!
     domains example
     (filter #(support/example-value example %) (keys domains))
     "Schema rule property identity example value was outside the specified contract.")))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-rule-property-identity-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
