(ns acceptance.steps.canonical-declared-property-validation
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-canonical-declared-property-validation.feature"
   "features/data-layer-canonical-declared-property-validation-runtime.feature"])

(def entry-modes
  {"Generic pageview revision 3 is assigned to history event pageview and target payload" :model
   "persisted Generic pageview working draft declares path-keyed properties /page_type, /login_status, and /page_levels" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Canonical declared property validation model verification failed. "
   "node" "test/data-layer-canonical-declared-property-validation-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "CANONICAL_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER"
    :observation-key :canonicalDeclaredPropertyValidation
    :runtime-error "Canonical declared property validation browser runtime failed."
    :missing-error "Canonical declared property validation browser evidence is missing."}))

(defn- assert-runtime! [{:keys [policy representationCases pageCases inheritance disabled publication live reopened runtimeErrors] :as observed}]
  (support/assert! (and (:checked policy)
                        (:stored policy)
                        (:propertiesUnchanged policy)
                        (empty? (:declaredIssues policy))
                        (= [{:instancePath "/debug" :expected "declared property" :actual "boolean"}]
                           (:extraIssues policy)))
                   "The production checkbox or canonical closed-object policy changed property definitions or misclassified payload keys."
                   policy)
  (support/assert! (and (= #{"nested" "path-keyed" "flat-array"} (set (map :name representationCases)))
                        (every? #(and (zero? (:undeclared %)) (:documentUnchanged %)) representationCases))
                   "A nested, path-keyed, or flat-array declaration was not resolved canonically."
                   representationCases)
  (support/assert! (and (= ["Required value"] (get-in pageCases [:missing :issues]))
                        (= ["Type mismatch"] (get-in pageCases [:numeric :issues]))
                        (= ["Value is not allowed"] (get-in pageCases [:disallowed :issues]))
                        (empty? (get-in pageCases [:allowed :issues]))
                        (every? false? (map :undeclared (vals pageCases)))
                        (every? (fn [result]
                                  (every? #(and (= "/page_type" (:propertyPath %))
                                                (= "Approved page types" (:rule %))
                                                (= 2 (:ruleVersion %)))
                                          (:evaluations result)))
                                (vals pageCases)))
                   "Type, required, allowed-value, or provenance behavior diverged for canonical page_type."
                   pageCases)
  (support/assert! (and (= ["/debug"] (:undeclared inheritance))
                        (:parentUnchanged inheritance)
                        (:childUnchanged inheritance))
                   "Inherited canonical declarations were lost or persisted documents were mutated."
                   inheritance)
  (support/assert! (and (:stored disabled)
                        (zero? (:undeclared disabled))
                        (:ruleActive disabled))
                   "Disabling the closed-object policy also disabled independent validation."
                   disabled)
  (support/assert! (and (= 4 (:version publication))
                        (:closed publication)
                        (:stored publication)
                        (:propertiesUnchanged publication)
                        (str/includes? (:result publication) "Revalidated 2 current Live events"))
                   "Publication did not persist and apply the canonical declared-property policy."
                   publication)
  (support/assert! (and (= #{["event:extra" true] ["event:declared" true]}
                           (set (map (fn [{:keys [eventId textContent]}]
                                       [eventId (if (= eventId "event:extra")
                                                  (str/includes? textContent "1 issues")
                                                  (str/includes? textContent "Valid"))])
                                     (:feedRows live))))
                        (str/includes? (:summary live) "1 error")
                        (str/includes? (:debug live) "1 error")
                        (= 1 (:debugRows live))
                        (:checked reopened)
                        (:propertiesUnchanged reopened)
                        (empty? runtimeErrors))
                   "Live results, reopen state, or runtime error evidence did not preserve the published policy."
                   {:live live :reopened reopened :runtimeErrors runtimeErrors})
  observed)

(def model-example-values
  {"schema_representation" #{"nested root property page_type"
                              "path-keyed root property /page_type"
                              "flat array root /page_levels with item /page_levels/0"
                              "nested array item products every item name"
                              "inherited path-keyed property /site_id"}
   "canonical_path" #{"/page_type" "/page_levels" "/products" "/site_id"}
   "payload_property" #{"page_type" "page_levels" "products" "site_id"}
   "additional_validation" #{"type string" "Required rule" "Allowed values product and content"}
   "actual_state" #{"number 42" "missing" "value internal" "value product"}
   "validation_outcome" #{"one Type mismatch issue" "one Required value issue" "one Value is not allowed issue" "no issue"}})

(def runtime-example-values
  {"schema_representation" #{"nested property page_type"
                              "path-keyed property /page_type"
                              "flat array /page_levels and item /page_levels/0"
                              "inherited path-keyed property /site_id"}
   "payload" #{"{\"page_type\":\"product\"}"
               "{\"page_levels\":[\"product\"]}"
               "{\"site_id\":\"otelo\"}"
               "{\"page_type\":\"product\",\"debug\":1}"}
   "canonical_path" #{"/page_type" "/page_levels" "/site_id"}
   "expected_undeclared_issues" #{"0" "1"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Canonical declared property validation example value was outside the specified contract."))

(def handlers
  (into [{:pattern #"^the built extension side panel is running with production schema editing, validation, persistence, and Live event presentation$"
          :handler (fn [world _example _captures] world)}]
        (support/verified-feature-mode-handlers
         feature-files entry-modes :canonical-declared-property-validation-mode
         verify-model! validate-example! runtime-observation! assert-runtime!)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T01:22:48.093004772+02:00", :module-hash "-1131484107", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-477298114"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "322791414"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-810162738"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "1257283293"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-1985355050"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 87, :hash "-1915493728"} {:id "def/model-example-values", :kind "def", :line 89, :end-line 99, :hash "1597422739"} {:id "def/runtime-example-values", :kind "def", :line 101, :end-line 111, :hash "-1288170676"} {:id "defn-/validate-example!", :kind "defn-", :line 113, :end-line 116, :hash "-1324760956"} {:id "def/handlers", :kind "def", :line 118, :end-line 121, :hash "281126603"}]}
;; clj-mutate-manifest-end
