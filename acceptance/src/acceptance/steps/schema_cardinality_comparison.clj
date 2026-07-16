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

(def legacy-comparisons {"Text length" "==" "Item count" ">="})

(defn- assert-compatibility! [example observed]
  (when-let [rule-type (support/example-value example "rule_type")]
    (when-let [property-type (support/example-value example "property_type")]
      (support/assert! (= "available" (get-in observed [:availability (if (= property-type "string") :text :items)]))
                       "Cardinality rule compatibility changed." {:example example})
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
          text-length? (= rule-type "Text length")]
      (support/assert! (some #(= {:operator (if text-length? "text-length" "item-count")
                                  :comparison comparison
                                  :limit (parse-long limit)} %)
                             (:reopened observed))
                       "Cardinality fields did not survive reopening." {:example example})
      (support/assert! (= (support/require-example example "expected_constraint")
                          (get-in observed [:reopenedIssues (keyword (if text-length? "/title" "/items")) :expected]))
                       "Cardinality issue did not identify the expected constraint." {:example example}))))

(defn- assert-legacy-behavior! [example observed]
  (when-let [legacy (support/example-value example "legacy_behavior")]
    (let [rule-type (support/require-example example "rule_type")
          configuration (get-in observed [:legacy (if (= rule-type "Text length") :text :items)])]
      (support/assert! (and (= (legacy-comparisons rule-type) (:comparison configuration))
                            (= (support/require-example example "limit") (:limit configuration))
                            (seq legacy))
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
  (let [[world observed] (support/stateful-observation world text #{entry-step} :schema-cardinality-comparison observation!
                                                       "Schema cardinality browser adapter was not executed.")]
    (assert-example! example observed)
    world))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs [feature-file] #{})
   #{entry-step}
   :schema-cardinality-comparison
   transition))
