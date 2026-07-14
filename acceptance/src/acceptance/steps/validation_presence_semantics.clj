(ns acceptance.steps.validation-presence-semantics
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-validation-presence-semantics.feature"
   "features/data-layer-validation-presence-semantics-runtime.feature"])

(def entry-modes
  {"schema Otelo - Generic Pageview v2 is assigned to a captured event" :model
   "the built extension validation modules and Live inspector presentation are loaded" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Validation presence-semantics model verification failed. "
   "node" "test/data-layer-validation-presence-semantics-test.mjs"))

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
  (support/assert! (= {:statuses ["error" "pass"] :actuals ["undefined" "undefined"] :issueActual "undefined"}
                      (:undefinedValue observation))
                   "Explicit undefined was present but leaked an unstable observed-value representation."
                   (:undefinedValue observation))
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
  (support/assert! (= {:hiddenByDefault true :revealed true :issueRows 0 :invalidMissing false}
                      (:liveInspector observation))
                   "The rendered Live inspector did not preserve neutral optional-absence presentation."
                   (:liveInspector observation))
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
     "Validation presence-semantics example value was outside the specified contract.")
    (when-let [issue-count (support/example-value example "issue_count")]
      (let [failure? (some #{"Failed" "error"}
                           (map #(support/example-value example %)
                                ["required_result" "allowed_values_result" "rule_result"
                                 "required_status" "allowed_status" "status"]))]
        (support/assert! (= (if failure? "1" "0") issue-count)
                         "Validation presence-semantics issue count contradicted its rule result."
                         {:mode mode :example example})))
    (when-let [issue-source (support/example-value example "issue_source")]
      (let [expected (cond
                       (= "Failed" (support/example-value example "required_result")) "Required"
                       (= "Failed" (support/example-value example "allowed_values_result")) "Allowed values"
                       :else "none")]
        (support/assert! (= expected issue-source)
                         "Validation presence-semantics issue attribution contradicted its rule result."
                         {:mode mode :example example})))
    (when-let [outcome (support/example-value example "issue_outcome")]
      (let [expected (cond
                       (= "error" (support/example-value example "required_status")) "one Required issue"
                       (= "error" (support/example-value example "allowed_status")) "one Allowed values issue"
                       :else "no issue")]
        (support/assert! (= expected outcome)
                         "Validation presence-semantics runtime issue outcome contradicted its statuses."
                         {:mode mode :example example})))
    example))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-modes
   :validation-presence-semantics-mode
   (fn [world example _captures {:keys [text]}]
     (support/mode-transition
      world example text entry-modes :validation-presence-semantics-mode
      verify-model! validate-example! #(assert-runtime-boundary! (browser-observation!))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T17:39:30.498737762+02:00", :module-hash "-1906346752", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-135206568"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-1223094497"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "-984489401"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn/verify-model!", :kind "defn", :line 15, :end-line 19, :hash "-808924326"} {:id "defn/browser-observation!", :kind "defn", :line 21, :end-line 27, :hash "1717773233"} {:id "defn/assert-runtime-boundary!", :kind "defn", :line 29, :end-line 71, :hash "-755888253"} {:id "def/model-example-values", :kind "def", :line 73, :end-line 83, :hash "-1786934155"} {:id "def/runtime-example-values", :kind "def", :line 85, :end-line 96, :hash "351585306"} {:id "defn/validate-example!", :kind "defn", :line 98, :end-line 127, :hash "-1209457316"} {:id "def/handlers", :kind "def", :line 129, :end-line 137, :hash "-1328409276"}]}
;; clj-mutate-manifest-end
