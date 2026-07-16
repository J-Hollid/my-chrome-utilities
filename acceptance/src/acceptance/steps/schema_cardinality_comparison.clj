(ns acceptance.steps.schema-cardinality-comparison
  (:require [acceptance.steps.support :as support]))

(def feature-file "features/data-layer-schema-cardinality-comparison-rules.feature")
(def entry-step "a Payload schema working draft declares string property /title and array property /items")
(defonce ^:private browser-observation (atom nil))

(defn- observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_CARDINALITY_COMPARISON_BROWSER_ADAPTER"
    :observation-key :schemaCardinalityComparison
    :runtime-error "Schema cardinality comparison browser runtime failed."
    :missing-error "Schema cardinality comparison browser evidence is missing."}))

(def expected-outcomes
  {">" ["issue" "issue" "pass"]
   ">=" ["issue" "pass" "pass"]
   "==" ["issue" "pass" "issue"]
   "<" ["pass" "issue" "issue"]
   "<=" ["pass" "pass" "issue"]})

(def legacy-behaviors
  {"exact length 8" [false true false]
   "minimum item count 1" [false true true]})

(defn- assert-compatibility! [example observed]
  (when-let [rule-type (support/example-value example "rule_type")]
    (when-let [property-type (support/example-value example "property_type")]
      (let [property-path (support/require-example example "property_path")]
        (support/assert! (= {:propertyType property-type
                             :measuredValue (support/require-example example "measured_value")
                             :availability "available"}
                            (get-in observed [:properties (keyword property-path)]))
                         "Cardinality property compatibility or measurement changed." {:example example}))
      (support/assert! (= [{:label "Comparison" :choices [">" ">=" "==" "<" "<="]}
                           {:label "Limit" :minimum 0 :step 1}]
                          (get-in observed [:controls (keyword rule-type)]))
                       "Cardinality controls changed." {:example example}))))

(defn- assert-comparison-outcome! [example observed]
  (when-let [below (support/example-value example "below_limit_outcome")]
    (let [rule-type (support/require-example example "rule_type")
          comparison (support/require-example example "comparison")
          actual (mapv #(get-in observed [:outcomes (keyword (str rule-type ":" comparison ":" %)) :outcome]) [49 50 51])]
      (support/assert! (= [below
                           (support/require-example example "at_limit_outcome")
                           (support/require-example example "above_limit_outcome")]
                          actual)
                       "Cardinality comparison outcome changed." {:example example}))))

(defn- assert-reopening! [example observed]
  (when-let [limit (and (support/example-value example "expected_constraint")
                        (support/example-value example "limit"))]
    (let [rule-type (support/require-example example "rule_type")
          comparison (support/require-example example "comparison")
          operator ({"Text length" "text-length" "Item count" "item-count"} rule-type)
          property-path ({"Text length" "/title" "Item count" "/items"} rule-type)]
      (support/assert! (some #(= {:operator operator
                                  :comparison comparison
                                  :limit (parse-long limit)} %)
                             (:reopened observed))
                       "Cardinality fields did not survive reopening." {:example example})
      (support/assert! (= (support/require-example example "expected_constraint")
                          (get-in observed [:reopenedIssues (keyword property-path) :expected]))
                       "Cardinality issue did not identify the expected constraint." {:example example}))))

(defn- assert-legacy-behavior! [example observed]
  (when-let [legacy (support/example-value example "legacy_behavior")]
    (let [rule-type (support/require-example example "rule_type")
          configuration (get-in observed [:legacy ({"Text length" :text "Item count" :items} rule-type)])
          behavior (support/require-example example "legacy_behavior")]
      (support/assert! (and (= (support/require-example example "comparison") (:comparison configuration))
                            (= (support/require-example example "limit") (:limit configuration))
                            (= (legacy-behaviors behavior) (:outcomes configuration)))
                       "Legacy cardinality behavior changed." {:example example}))))

(defn- assert-invalid-configuration! [example observed]
  (when-let [invalid (support/example-value example "invalid_configuration")]
    (support/assert! (= {:ready false :assistance (support/require-example example "assistance")}
                        (get-in observed [:invalid (keyword invalid)]))
                     "Invalid cardinality configuration was not blocked." {:example example})))

(defn- assert-example! [example observed]
  (assert-compatibility! example observed)
  (assert-comparison-outcome! example observed)
  (assert-reopening! example observed)
  (assert-legacy-behavior! example observed)
  (assert-invalid-configuration! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (support/stateful-transition
   world example text #{entry-step} :schema-cardinality-comparison observation!
   "Schema cardinality browser adapter was not executed." assert-example!))

(def handlers
  (support/stateful-feature-handlers
   feature-file entry-step :schema-cardinality-comparison transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T20:46:53.681045335+02:00", :module-hash "-704409972", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "70459626"} {:id "def/feature-file", :kind "def", :line 4, :end-line 4, :hash "-1743939847"} {:id "def/entry-step", :kind "def", :line 5, :end-line 5, :hash "-1527584830"} {:id "form/3/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1618529344"} {:id "defn-/observation!", :kind "defn-", :line 8, :end-line 14, :hash "1942335554"} {:id "def/expected-outcomes", :kind "def", :line 16, :end-line 21, :hash "1237275012"} {:id "def/legacy-behaviors", :kind "def", :line 23, :end-line 25, :hash "-824365357"} {:id "defn-/assert-compatibility!", :kind "defn-", :line 27, :end-line 39, :hash "2093458566"} {:id "defn-/assert-comparison-outcome!", :kind "defn-", :line 41, :end-line 50, :hash "-876127228"} {:id "defn-/assert-reopening!", :kind "defn-", :line 52, :end-line 66, :hash "-1601733972"} {:id "defn-/assert-legacy-behavior!", :kind "defn-", :line 68, :end-line 76, :hash "95919036"} {:id "defn-/assert-invalid-configuration!", :kind "defn-", :line 78, :end-line 82, :hash "-1875964690"} {:id "defn-/assert-example!", :kind "defn-", :line 84, :end-line 89, :hash "-1082319581"} {:id "defn-/transition", :kind "defn-", :line 91, :end-line 94, :hash "-1548213561"} {:id "def/handlers", :kind "def", :line 96, :end-line 98, :hash "470103277"}]}
;; clj-mutate-manifest-end
