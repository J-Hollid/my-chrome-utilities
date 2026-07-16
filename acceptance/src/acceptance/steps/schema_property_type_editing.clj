(ns acceptance.steps.schema-property-type-editing
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-property-type-editing.feature"
   "features/data-layer-schema-property-type-editing-runtime.feature"])

(def entry-modes
  {"Page view revision 3 has an open working draft" :model
   "the built extension side panel is running with the production Schema Library, property editor, validation, documentation, rules, inheritance, and persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(def model-values
  {"new_type" #{"String" "Boolean" "Object" "Array" "Array of String"}
   "stored_type" #{"string" "boolean" "object"}
   "current_type" #{"Array of String" "Array"}
   "selected_type" #{"Array" "Array of String" "Array of Number" "Array of Object"}
   "item_validation" #{"no item type validation" "every item must be a string" "every item must be a number" "every item must be an object"}
   "stored_definition" #{"array without an items constraint" "array with string items" "array with number items" "array with object items"}
   "property_path" #{"/products" "/commerce"}
   "dependent_schema_data" #{"object items with item properties, rules, and documentation" "object children with required membership and documentation"}
   "affected_data" #{"item definitions, item rules, and item documentation" "child definitions, required membership, and documentation"}
   "treatment" #{"Error" "Warning" "Ignore"}
   "type_outcome" #{"one error-severity Type mismatch" "one warning-severity Type mismatch" "no Type mismatch issue"}
   "validation_summary" #{"1 error" "1 warning" "Valid"}})

(def runtime-values
  {"selected_type" #{"String" "Boolean" "Object" "Array" "Array of String" "Array of Number" "Array of Object"}
   "stored_type" #{"string" "boolean" "object"}
   "item_definition" #{"no items constraint" "string items" "number items" "object items"}
   "validation_outcome" #{"mixed item types accepted" "non-string items fail at their concrete indexes" "non-number items fail at their concrete indexes" "Add item property is available"}
   "displayed_type" #{"type array" "type array of string" "type array of number" "type array of object"}
   "treatment" #{"Error" "Warning" "Ignore"}
   "type_evidence" #{"one error-severity Type mismatch at /price" "one warning-severity Type mismatch at /price" "no Type mismatch for /price"}
   "validation_summary" #{"1 error" "1 warning" "Valid"}})

(def model-relations
  [{:keys ["new_type" "stored_type"]
    :rows #{["String" "string"] ["Boolean" "boolean"] ["Object" "object"]}}
   {:keys ["current_type" "selected_type" "item_validation" "stored_definition"]
    :rows #{["Array of String" "Array" "no item type validation" "array without an items constraint"]
            ["Array" "Array of String" "every item must be a string" "array with string items"]
            ["Array of String" "Array of Number" "every item must be a number" "array with number items"]
            ["Array" "Array of Object" "every item must be an object" "array with object items"]}}
   {:keys ["property_path" "dependent_schema_data" "new_type" "affected_data"]
    :rows #{["/products" "object items with item properties, rules, and documentation" "Array" "item definitions, item rules, and item documentation"]
            ["/products" "object items with item properties, rules, and documentation" "Array of String" "item definitions, item rules, and item documentation"]
            ["/commerce" "object children with required membership and documentation" "String" "child definitions, required membership, and documentation"]}}
   {:keys ["treatment" "type_outcome" "validation_summary"]
    :rows #{["Error" "one error-severity Type mismatch" "1 error"]
            ["Warning" "one warning-severity Type mismatch" "1 warning"]
            ["Ignore" "no Type mismatch issue" "Valid"]}}])

(def runtime-relations
  [{:keys ["selected_type" "stored_type"]
    :rows #{["String" "string"] ["Boolean" "boolean"] ["Object" "object"]}}
   {:keys ["selected_type" "item_definition" "validation_outcome" "displayed_type"]
    :rows #{["Array" "no items constraint" "mixed item types accepted" "type array"]
            ["Array of String" "string items" "non-string items fail at their concrete indexes" "type array of string"]
            ["Array of Number" "number items" "non-number items fail at their concrete indexes" "type array of number"]
            ["Array of Object" "object items" "Add item property is available" "type array of object"]}}
   {:keys ["treatment" "type_evidence" "validation_summary"]
    :rows #{["Error" "one error-severity Type mismatch at /price" "1 error"]
            ["Warning" "one warning-severity Type mismatch at /price" "1 warning"]
            ["Ignore" "no Type mismatch for /price" "Valid"]}}])

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema property type editing model verification failed. "
   "npm" "run" "test:unit:schema-property-type-editing"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER"
    :observation-key :schemaPropertyTypeEditing
    :runtime-error "Schema property type editing browser runtime failed."
    :missing-error "Schema property type editing browser evidence is missing."}))

(defn- validate-example! [mode example]
  (support/validate-mode-example!
   mode runtime-values model-values runtime-relations model-relations example
   "Schema property type editing example value is outside the approved domain."
   "Schema property type editing example columns describe an invalid relation."))

(defn- assert-runtime! [{:keys [review impactChoices descendantImpact persistenceFailure remainingRules reusableUnchanged publication itemTreatment runtimeErrors] :as observed}]
  (support/assert!
   (and (str/includes? review "type mismatch treatment")
        (str/includes? review "example value")
        (str/includes? review "conditional dependency order-condition")
        (= 3 (:count impactChoices))
        (:blocked impactChoices)
        (:resolved impactChoices)
        (:cancel impactChoices)
        (str/includes? (:review descendantImpact) "descendant required relationships")
        (:blocked descendantImpact)
        (:unchanged descendantImpact)
        (:focus descendantImpact)
        (str/includes? (:message persistenceFailure) "Simulated persistence failure")
        (:storedUnchanged persistenceFailure)
        (= "Number" (:inMemoryType persistenceFailure))
        (= ["replace" "remove" "replace"] (:resolutions persistenceFailure))
        (= ["product-name-required" "price-required" "order-condition"] remainingRules)
        reusableUnchanged
        (= 4 (:version publication))
        (:draftAbsent publication)
        (= "string" (get-in publication [:current :order]))
        (= "number" (get-in publication [:historical :order]))
        (= "ignore" (get-in publication [:current :priceTreatment]))
        (= "error" (get-in publication [:historical :priceTreatment]))
        (= {:label "Type owned by Base event" :owner "Base event" :unchanged true}
           (:inherited itemTreatment))
        (= [["/tags/1" "warning"]] (:warningItems itemTreatment))
        (= [["/tags" "warning"]] (:warningArray itemTreatment))
        (= [["/price" "error"]] (:unrelated itemTreatment))
        (false? (:ignoredItems itemTreatment))
        (false? (:ignoredArray itemTreatment))
        (empty? runtimeErrors))
   "Production property type editing did not preserve impact and publication semantics."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-property-type-editing-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T18:00:11.112915712+02:00", :module-hash "-1482954768", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1552119110"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-2125500363"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-2126124344"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "def/model-values", :kind "def", :line 16, :end-line 28, :hash "563155441"} {:id "def/runtime-values", :kind "def", :line 30, :end-line 38, :hash "396126580"} {:id "def/model-relations", :kind "def", :line 40, :end-line 55, :hash "1123604291"} {:id "def/runtime-relations", :kind "def", :line 57, :end-line 68, :hash "-630603278"} {:id "defn-/verify-model!", :kind "defn-", :line 70, :end-line 74, :hash "373927570"} {:id "defn-/runtime-observation!", :kind "defn-", :line 76, :end-line 82, :hash "-728881856"} {:id "defn-/validate-example!", :kind "defn-", :line 84, :end-line 88, :hash "1968985727"} {:id "defn-/assert-runtime!", :kind "defn-", :line 90, :end-line 125, :hash "140747749"} {:id "def/handlers", :kind "def", :line 127, :end-line 130, :hash "1738225993"}]}
;; clj-mutate-manifest-end
