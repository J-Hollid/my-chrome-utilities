(ns acceptance.steps.allowed-values-rule-migration
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-allowed-values-rule-migration.feature"
   "features/data-layer-allowed-values-rule-migration-runtime.feature"])

(def entry-modes
  {"Generic pageview revision 4 declares String error_type, Number quantity, and Boolean enabled properties" :model
   "the built extension side panel is running with production schema storage, rule authoring, validation, and specification building" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(def model-values
  {"property_path" #{"/error_type" "/quantity" "/enabled" "/context"}
   "property_type" #{"String" "Number" "Boolean" "Unspecified"}
   "parameters" #{"technical, validation" "1, 2" "true, false" "1, true"}
   "typed_values" #{"String technical and validation" "Number 1 and 2" "Boolean true and false" "String 1 and true"}
   "schema_surface" #{"current revision 4" "historical revision 2" "working draft" "inherited parent revision 3"}
   "source_behavior" #{"current validation and specification"
                       "revision 2 validation and specification"
                       "working-draft validation and specification"
                       "effective child validation and specification"}
   "authoring_surface" #{"schema property rule picker" "guided validation authoring" "reusable Rule Library editor"}})

(def runtime-values
  {"schema_surface" #{"current revision" "historical revision" "working draft" "inherited parent"}
   "property_type" #{"String" "Number" "Boolean"}
   "parameters" #{"a,b" "1,2" "true,false" "parent,child"}
   "typed_values" #{"String a and b" "Number 1 and 2" "Boolean true and false" "String parent and child"}
   "authoring_surface" #{"property rule picker" "guided validation" "reusable Rule Library editor"}})

(def model-relations
  [{:keys ["property_path" "property_type" "parameters" "typed_values"]
    :rows #{["/error_type" "String" "technical, validation" "String technical and validation"]
            ["/quantity" "Number" "1, 2" "Number 1 and 2"]
            ["/enabled" "Boolean" "true, false" "Boolean true and false"]
            ["/context" "Unspecified" "1, true" "String 1 and true"]}}
   {:keys ["schema_surface" "source_behavior"]
    :rows #{["current revision 4" "current validation and specification"]
            ["historical revision 2" "revision 2 validation and specification"]
            ["working draft" "working-draft validation and specification"]
            ["inherited parent revision 3" "effective child validation and specification"]}}])

(def runtime-relations
  [{:keys ["schema_surface" "property_type" "parameters" "typed_values"]
    :rows #{["current revision" "String" "a,b" "String a and b"]
            ["historical revision" "Number" "1,2" "Number 1 and 2"]
            ["working draft" "Boolean" "true,false" "Boolean true and false"]
            ["inherited parent" "String" "parent,child" "String parent and child"]}}])

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Allowed values rule migration model verification failed. "
   "npm" "run" "test:unit:allowed-values-rule-migration"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER"
    :observation-key :allowedValuesRuleMigration
    :runtime-error "Allowed values rule migration browser runtime failed."
    :missing-error "Allowed values rule migration browser evidence is missing."}))

(defn- validate-example! [mode example]
  (support/validate-mode-example!
   mode runtime-values model-values runtime-relations model-relations example
   "Allowed values migration example value is outside the approved domain."
   "Allowed values migration example columns describe an invalid relation."))

(defn- assert-runtime! [{:keys [current historical draft reusable allowedCell coverage idempotent runtimeErrors] :as observed}]
  (support/assert!
   (and (= ["technical" "validation" "authentication" "login" "notification"] (:allowedValues current))
        (nil? (:parameters current))
        (= [1 2] (:allowedValues historical))
        (= [true false] (:allowedValues draft))
        (= [1 2] (:allowedValues reusable))
        (str/includes? allowedCell "technical | validation | authentication | login | notification")
        (zero? (get-in coverage [:validation :valid]))
        (seq (get-in coverage [:validation :invalid]))
        (= [1 2] (get-in coverage [:authoring :picker :allowedValues]))
        (= [true false] (get-in coverage [:authoring :guided :allowedValues]))
        (= ["red" "blue"] (get-in coverage [:authoring :authored :allowedValues]))
        (= 1 (get-in coverage [:propertyPicker :count]))
        (str/includes? (get-in coverage [:propertyPicker :text]) "Allowed values: 1, 2")
        (= 1 (get-in coverage [:ruleLibrary :authoredSearch :count]))
        (str/includes? (get-in coverage [:ruleLibrary :authoredSearch :text]) "Allowed values: red, blue")
        (= 1 (get-in coverage [:ruleLibrary :migratedSearch :count]))
        (str/includes? (get-in coverage [:ruleLibrary :migratedSearch :text]) "Allowed values: 1, 2")
        (= ["parent" "child"] (get-in coverage [:inheritance :values]))
        (seq (get-in coverage [:inheritance :invalid]))
        (= ["red" "blue" "gold"] (get-in coverage [:semantics :row :values]))
        (= ["red | blue" "gold when tier equals vip for the same products item"]
           (get-in coverage [:semantics :row :groups]))
        (= ["documentation" "allowed:red" "allowed:blue" "allowed:gold" "custom" "blank"]
           (get-in coverage [:semantics :examples]))
        (= false (get-in coverage [:semantics :rules 2 :enabled]))
        (= "/products/*/code" (get-in coverage [:semantics :rules 0 :propertyPath]))
        (= "red, blue" (get-in coverage [:semantics :metadata :examples]))
        (= ["disabled"] (vec (vals (get-in coverage [:semantics :override]))))
        (= 2 (count (get-in coverage [:semantics :inheritedIssues])))
        (zero? (get-in coverage [:semantics :overriddenIssues]))
        (str/includes? (get-in coverage [:semantics :copies :plain]) "red | blue; gold when tier equals vip")
        (str/includes? (get-in coverage [:semantics :copies :html]) "red | blue<br>gold when tier equals vip")
        (str/includes? (get-in coverage [:invalidMigration :unsafe :migrationIssue]) "not-a-number")
        (= ["kept"] (get-in coverage [:invalidMigration :canonical :allowedValues]))
        (str/includes? (get-in coverage [:copyImport :plain]) "technical | validation | authentication | login | notification")
        (= (:allowedValues current) (get-in coverage [:copyImport :imported :allowedValues]))
        idempotent
        (empty? runtimeErrors))
   "Production migration consumers did not use canonical typed Allowed values."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :allowed-values-rule-migration-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T19:11:21.18926033+02:00", :module-hash "-569961285", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1789977227"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-439600747"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "1857569268"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "def/model-values", :kind "def", :line 16, :end-line 26, :hash "442208385"} {:id "def/runtime-values", :kind "def", :line 28, :end-line 33, :hash "-431465697"} {:id "def/model-relations", :kind "def", :line 35, :end-line 45, :hash "-1612629596"} {:id "def/runtime-relations", :kind "def", :line 47, :end-line 52, :hash "42414048"} {:id "defn-/verify-model!", :kind "defn-", :line 54, :end-line 58, :hash "-1486693029"} {:id "defn-/runtime-observation!", :kind "defn-", :line 60, :end-line 66, :hash "-852388571"} {:id "defn-/validate-example!", :kind "defn-", :line 68, :end-line 72, :hash "-342150009"} {:id "defn-/assert-runtime!", :kind "defn-", :line 74, :end-line 116, :hash "-370032577"} {:id "def/handlers", :kind "def", :line 118, :end-line 121, :hash "692948582"}]}
;; clj-mutate-manifest-end
