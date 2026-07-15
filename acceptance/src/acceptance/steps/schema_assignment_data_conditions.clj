(ns acceptance.steps.schema-assignment-data-conditions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-assignment-data-conditions.feature"
   "features/data-layer-schema-assignment-data-conditions-runtime.feature"])

(def entry-modes
  {"Legacy generic event and Current generic event are published schemas" :model
   "the built extension side panel is running with production assignment editing, conditional predicates, schema resolution, validation, persistence, import, and export" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema-assignment-data-conditions model verification failed. "
   "node" "test/data-layer-schema-assignment-data-conditions-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER"
    :observation-key :schemaAssignmentDataConditions
    :runtime-error "Schema-assignment-data-conditions browser runtime failed."
    :missing-error "Schema-assignment-data-conditions browser evidence is missing."}))

(defn- assert-runtime!
  [{:keys [absent empty editor persisted duplicate families priority cases paths target persistence reloaded layout runtimeErrors]
    :as observed}]
  (support/assert!
   (and (str/includes? (:summary absent) "unrestricted")
        (false? (:saveDisabled absent))
        (= "Add at least one condition" (:assistance empty))
        (:saveDisabled empty)
        (= "payload" (:target editor))
        (= "Any" (:operator editor))
        (= ["/errorType" "/siteStructure" "/siteArea"] (:paths editor))
        (str/includes? (:summary editor) "Payload · Any")
        (false? (:saveDisabled editor))
        (= "/siteStructure" (:focus editor))
        (= 41 (:scroll editor)))
   "Production assignment-condition editor controls, validation, focus, or scroll diverged."
   {:absent absent :empty empty :editor editor})
  (support/assert!
   (and (= "payload" (:target persisted))
        (= "Any" (:operator persisted))
        (= ["/errorType" "/siteStructure" "/siteArea"] (:paths persisted))
        (= 20 (:priority persisted))
        (str/includes? (:summary persisted) "Legacy assignment")
        (str/includes? (:summary persisted) "Payload · Any")
        (= 2 (:count duplicate))
        (:equivalent duplicate)
        (:independent duplicate)
        (= 2 (:count reloaded))
        (= (:paths persisted) (:paths reloaded))
        (str/includes? (:summary reloaded) "Payload · Any"))
   "Assignment conditions lost identity, independence, readable summary, persistence, or reload behavior."
   {:persisted persisted :duplicate duplicate :reloaded reloaded})
  (support/assert!
   (and (every? #(= (:expected %) (:selected %)) (butlast families))
        (nil? (:selected (last families)))
        (every? #(str/includes? (:evidence %) "matched") (butlast families))
        (str/includes? (:evidence (last families)) "No assignment matched")
        (= [false false false true true true] cases)
        (= [true true true true true] (mapv :matched paths))
        (= ["Legacy generic event" "Current generic event"] [(:legacy priority) (:current priority)])
        (str/includes? (:tie priority) "Assignment error")
        (str/includes? (:tieDiagnostic priority) "equal highest priority"))
   "Typed predicate, pointer, property-family, priority, tie, or evidence routing diverged."
   {:families families :cases cases :paths paths :priority priority})
  (support/assert!
   (and (= {:selected "raw" :validationTarget "payload" :conditionTarget "raw input"} target)
        (= ["/errorType" "/siteStructure" "/siteArea"] (:restored persistence))
        (= "Legacy generic event" (:archived persistence))
        (= "legacy" (:archivedEvidence persistence))
        (:immutable persistence)
        (:activeUnchanged persistence)
        (<= (:body layout) (:width layout))
        (empty? runtimeErrors))
   "Condition target separation, archival evidence, immutability, layout, or runtime safety regressed."
   {:target target :persistence persistence :layout layout :runtimeErrors runtimeErrors})
  observed)

(def model-example-values
  {"property_family" #{"errorType" "siteStructure and siteArea" "error_type" "page_levels and site_section" "none of the configured discriminator properties"}
   "selected_assignment" #{"Legacy assignment" "Current assignment" "no assignment"}
   "selected_schema" #{"Legacy generic event" "Current generic event" "no schema"}
   "first_result" #{"match" "no match"}
   "second_result" #{"match" "no match"}
   "group_operator" #{"All" "Any"}
   "condition_result" #{"match" "no match"}
   "operator" #{"Exists" "Does not exist" "Equals" "Does not equal" "Is one of" "Matches pattern" "Is at least" "Is less than"}
   "configured_value" #{"none" "string legacy" "number 1" "string current" "strings legacy,current" "^legacy-" "number 10"}
   "observed_state" #{"string legacy" "missing" "null present" "string 1" "string current" "string legacy-page" "number 12"}
   "predicate_result" #{"match" "no match"}
   "property_path" #{"/context/siteArea" "/products/*/type" "/a~1b" "/tilde~0name"}
   "payload_shape" #{"context object with siteArea legacy" "two products with types legacy and current" "empty products array" "property a/b exists" "property tilde~name exists"}
   "path_result" #{"one existing string legacy" "two concrete values in capture order" "no concrete value" "one existing property a/b" "one existing property tilde~name"}
   "priority_relationship" #{"Legacy higher than Current" "Current higher than Legacy" "equal highest priority"}
   "resolution_outcome" #{"Legacy assignment selected" "Current assignment selected" "no schema selected"}
   "diagnostic_outcome" #{"both matches and priority decision retained" "Assignment error identifies both matches"}
   "condition_target" #{"payload" "raw input"}
   "data_result" #{"match" "no match"}
   "invalid_state" #{"empty condition group" "blank property path" "comparison missing" "number operator on string property" "invalid regular expression" "invalid canonical property path"}
   "assistance" #{"Add at least one condition" "Choose a condition property" "Enter a comparison value" "Choose an operator compatible with string" "Correct the regular expression" "Correct the condition property path"}})

(def runtime-example-values
  {"property_family" #{"errorType" "siteStructure and siteArea" "error_type" "page_levels and site_section"}
   "selected_schema" #{"Legacy generic event" "Current generic event"}
   "operator" #{"Exists" "Does not exist" "Equals" "Is one of" "Matches pattern" "Is at least"}
   "configured_value" #{"none" "number 1" "strings legacy,current" "^legacy-" "number 10"}
   "observed_state" #{"missing" "null present" "string 1" "string current" "string legacy-page" "number 12"}
   "predicate_result" #{"match" "no match"}
   "property_path" #{"/context/siteArea" "/products/*/type" "/a~1b" "/tilde~0name"}
   "captured_shape" #{"nested legacy value" "current and legacy product values" "empty products array with Does not exist" "escaped property a/b" "escaped property tilde~name"}
   "resolution" #{"matching concrete value" "match from legacy concrete value" "match from no concrete value" "matching property"}
   "priority_case" #{"Legacy 20 and Current 10" "Legacy 10 and Current 20" "Legacy 20 and Current 20"}
   "assignment_outcome" #{"Legacy selected" "Current selected" "Assignment error"}
   "diagnostic" #{"both matches and priority 20 wins" "both matching predicate summaries"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Schema-assignment-data-conditions example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-assignment-data-conditions-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T12:51:19.221002264+02:00", :module-hash "172389405", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1045087018"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "980082890"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-2019632527"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "1588579907"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-1972688756"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 85, :hash "690409672"} {:id "def/model-example-values", :kind "def", :line 87, :end-line 108, :hash "92862104"} {:id "def/runtime-example-values", :kind "def", :line 110, :end-line 122, :hash "1636676286"} {:id "defn-/validate-example!", :kind "defn-", :line 124, :end-line 127, :hash "846693054"} {:id "def/handlers", :kind "def", :line 129, :end-line 132, :hash "-901119021"}]}
;; clj-mutate-manifest-end
