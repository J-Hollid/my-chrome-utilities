(ns acceptance.steps.validation-presence-semantics
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

(def feature-files
  ["features/data-layer-validation-presence-semantics.feature"
   "features/data-layer-validation-presence-semantics-runtime.feature"])

(def entry-modes
  {"schema Otelo - Generic Pageview v2 is assigned to a captured event" :model
   "the built extension validation modules and Live inspector presentation are loaded" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn verify-model! []
  (when-not @model-verified?
    (let [result (process/shell support/build-shell-options
                                "node" "test/data-layer-validation-presence-semantics-test.mjs")]
      (support/assert! (zero? (:exit result))
                       (str "Validation presence-semantics model verification failed. " (:err result))
                       {:out (:out result) :err (:err result)})
      (reset! model-verified? true))))

(defn browser-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "VALIDATION_PRESENCE_BROWSER_ADAPTER"
    :observation-key :validationPresenceSemantics
    :runtime-error "Validation presence-semantics browser runtime failed."
    :missing-error "Validation presence-semantics browser evidence is missing."}))

(defn assert-runtime-boundary! [observation]
  (support/assert! (every? #(= ["not-applicable" 0 "Valid"]
                               (mapv % [:status :issues :state]))
                           (:operators observation))
                   "An optional value operator treated absence as invalid." (:operators observation))
  (support/assert! (= [{:observed "missing" :statuses ["error" "not-applicable"] :issues ["Required"]}
                       {:observed "test" :statuses ["pass" "pass"] :issues []}
                       {:observed "another value" :statuses ["pass" "error"] :issues ["Allowed values"]}]
                      (:requiredCases observation))
                   "Required and Allowed values did not preserve independent presence semantics."
                   (:requiredCases observation))
  (support/assert! (= {:status "error" :actual "null" :issueActual "null"} (:nullValue observation))
                   "Explicit null was confused with an absent property." (:nullValue observation))
  (support/assert! (= [["Nested required" "/profile/status"]
                       ["Wildcard required" "/products/1/sku"]
                       ["Index required" "/products/2"]]
                      (get-in observation [:nested :issues]))
                   "Nested, wildcard, or index absence produced the wrong issues." (:nested observation))
  (support/assert! (and (= #{"/profile/status" "/products/1/sku" "/products/2"}
                            (set (get-in observation [:nested :notApplicable])))
                        (= 1 (get-in observation [:nested :wildcardPasses])))
                   "Nested optional rules were not-applicable or concrete wildcard values were not evaluated once."
                   (:nested observation))
  (support/assert! (= [["not-applicable" 0] ["not-applicable" 0] ["error" 1] ["error" 1]]
                      (mapv #(mapv % [:status :issues]) (:conditionalCases observation)))
                   "Conditional consequence presence semantics diverged." (:conditionalCases observation))
  (support/assert! (= {:legacy "not-applicable" :inherited "not-applicable" :issues 0}
                      (:equivalent observation))
                   "Legacy or inherited optional rules diverged from canonical local rules." (:equivalent observation))
  (support/assert! (= {:status "9 rules not applicable" :symbolName "neutral" :treatment "neutral"
                       :errors 0 :warnings 0 :passed 0}
                      (:liveSummary observation))
                   "Live presentation counted not-applicable rules as pass, failure, error, or warning."
                   (:liveSummary observation))
  observation)

(def model-example-values
  {"rule" #{"Exact value" "Value type" "Non-empty string" "Text length" "Digits only" "Allowed values" "Regular expression" "Numeric range" "Item count"}
   "configuration" #{"test" "string" "none" "4" "^test$" "1 through 10" "minimum 1"}
   "property_state" #{"missing" "test" "another value" "present with bad value"}
   "required_result" #{"Failed" "Passed"}
   "allowed_values_result" #{"Not applicable" "Passed" "Failed"}
   "issue_count" #{"0" "1"}
   "issue_source" #{"Required" "none" "Allowed values"}
   "consequence_rule" #{"Allowed values" "Required"}
   "condition_result" #{"not satisfied" "satisfied"}
   "rule_result" #{"Not applicable" "Failed"}})

(def runtime-example-values
  {"operator" #{"exact-value" "value-type" "non-empty-string" "text-length" "digits-only" "allowed-values" "regular-expression" "numeric-range" "item-count"}
   "parameters" #{"test" "string" "none" "4" "^test$" "1,10" "1"}
   "observed_value" #{"missing" "test" "another value"}
   "required_status" #{"error" "pass"}
   "allowed_status" #{"not-applicable" "pass" "error"}
   "issue_outcome" #{"one Required issue" "no issue" "one Allowed values issue"}
   "consequence" #{"allowed-values test" "item-count 1" "required"}
   "target_path" #{"/test" "/oOrder/aProducts" "/oOrder/aProducts/0"}
   "target_state" #{"missing target" "existing empty array"}
   "status" #{"not-applicable" "error"}
   "issue_count" #{"0" "1"}})

(defn validate-example! [mode example]
  (let [values (if (= mode :runtime) runtime-example-values model-example-values)]
    (support/validate-example-domain!
     values example (filter #(support/example-value example %) (keys values))
     "Validation presence-semantics example value was outside the specified contract.")))

(defn transition [world example _captures {:keys [text]}]
  (let [mode (or (entry-modes text) (:validation-presence-semantics-mode world))]
    (support/assert! mode "Validation presence-semantics scenario did not establish its mode." {:step text})
    (verify-model!)
    (validate-example! mode example)
    (when (= mode :runtime) (assert-runtime-boundary! (browser-observation!)))
    (assoc world :validation-presence-semantics-mode mode)))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? entry-modes (:text spec))
                           (:validation-presence-semantics-mode world)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
