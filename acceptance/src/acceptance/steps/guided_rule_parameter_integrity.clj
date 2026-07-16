(ns acceptance.steps.guided-rule-parameter-integrity
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-guided-rule-parameter-integrity.feature"
   "features/data-layer-guided-rule-parameter-integrity-runtime.feature"])

(def ^:private entry-modes
  {"schema Otelo - Generic Pageview revision 1 contains property /login_status" :model
   "the built extension side panel is running with production guided validation, Schema Library persistence, and schema validation" :runtime})

(defonce ^:private model-verified? (atom false))
(defonce ^:private browser-observation (atom nil))

(def ^:private canonical-example-rows
  {:model
   [{"requirement" "Must be present" "configuration" "no configuration" "operator" "required" "operator_parameters" "no parameters"}
    {"requirement" "Must be one of these values" "configuration" "not logged in and logged in" "operator" "allowed-values" "operator_parameters" "not logged in and logged in"}
    {"requirement" "Must match a pattern" "configuration" "^not logged in$" "operator" "regular-expression" "operator_parameters" "^not logged in$"}
    {"actual_value" "not logged in" "validation_result" "Passed" "issue_count" "0"}
    {"actual_value" "logged in" "validation_result" "Passed" "issue_count" "0"}
    {"actual_value" "logged out" "validation_result" "Failed" "issue_count" "1"}
    {"property_path_state" "propertyPath /login_status" "stored_parameters" "/login_status:not logged in,logged in" "actual_value" "not logged in" "effective_allowed_values" "not logged in and logged in"}
    {"property_path_state" "propertyPath /login_status" "stored_parameters" "not logged in,logged in" "actual_value" "logged in" "effective_allowed_values" "not logged in and logged in"}
    {"property_path_state" "propertyPath /login_status" "stored_parameters" "urn:status:not-logged-in,logged in" "actual_value" "urn:status:not-logged-in" "effective_allowed_values" "urn:status:not-logged-in and logged in"}
    {"property_path_state" "propertyPath /login_status" "stored_parameters" "/other_status:not-logged-in,logged in" "actual_value" "/other_status:not-logged-in" "effective_allowed_values" "/other_status:not-logged-in and logged in"}
    {"property_path_state" "no propertyPath" "stored_parameters" "login_status:not logged in,logged in" "actual_value" "not logged in" "effective_allowed_values" "not logged in and logged in"}
    {"rule_ownership" "local" "schema_destination" "new schema draft"}
    {"rule_ownership" "local" "schema_destination" "existing schema working draft"}
    {"rule_ownership" "reusable" "schema_destination" "new schema draft"}
    {"rule_ownership" "reusable" "schema_destination" "existing schema working draft"}]
   :runtime
   [{"requirement" "Must be present" "configuration" "no configuration" "operator" "required" "operator_parameters" "no parameters" "matching_value" "not logged in"}
    {"requirement" "Must be one of these values" "configuration" "not logged in and logged in" "operator" "allowed-values" "operator_parameters" "not logged in,logged in" "matching_value" "logged in"}
    {"requirement" "Must match a pattern" "configuration" "^not logged in$" "operator" "regular-expression" "operator_parameters" "^not logged in$" "matching_value" "not logged in"}
    {"stored_parameters" "/login_status:not logged in,logged in" "actual_value" "not logged in" "validation_result" "Valid" "effective_allowed_values" "not logged in and logged in"}
    {"stored_parameters" "urn:status:not-logged-in,logged in" "actual_value" "urn:status:not-logged-in" "validation_result" "Valid" "effective_allowed_values" "urn:status:not-logged-in and logged in"}
    {"stored_parameters" "/other_status:not-logged-in,logged in" "actual_value" "/other_status:not-logged-in" "validation_result" "Valid" "effective_allowed_values" "/other_status:not-logged-in and logged in"}
    {"stored_parameters" "not logged in,logged in" "actual_value" "logged out" "validation_result" "1 issue" "effective_allowed_values" "not logged in and logged in"}
    {"rule_ownership" "local" "schema_destination" "new schema draft"}
    {"rule_ownership" "local" "schema_destination" "existing schema working draft"}
    {"rule_ownership" "reusable" "schema_destination" "new schema draft"}
    {"rule_ownership" "reusable" "schema_destination" "existing schema working draft"}]})

(defn- validate-example! [mode example]
  (let [keys (set (mapcat keys (get canonical-example-rows mode)))
        supplied (into {} (keep (fn [key]
                                  (when-let [value (support/example-value example key)]
                                    [key value])))
                       keys)]
    (when (seq supplied)
      (support/assert! (contains? (set (get canonical-example-rows mode)) supplied)
                       "Guided rule parameter integrity example did not match production evidence."
                       {:mode mode :example supplied}))))

(defn- verify-model! []
  (when-not @model-verified?
    (let [result (process/shell support/build-shell-options
                                "node" "test/data-layer-guided-rule-parameter-integrity-test.mjs")]
      (support/assert! (zero? (:exit result))
                       (str "Guided rule parameter integrity verification failed: " (:err result))
                       {:out (:out result) :err (:err result)})
      (reset! model-verified? true))))

(defn- browser-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "GUIDED_VALIDATION_BROWSER_ADAPTER"
    :observation-key :guidedValidation
    :runtime-error "Guided rule browser runtime verification failed."
    :missing-error "Guided rule browser observation is missing."}))

(defn- assert-runtime-boundary! [observation]
  (let [attachment (get-in observation [:saved :attachedRule])
        published-attachment (get-in observation [:published :attachedRule])
        reusable (get-in observation [:published :reusableRule])
        validation (get-in observation [:saved :validation])
        legacy (get-in observation [:saved :legacy])]
    (support/assert! (= ["/page_type" "allowed-values" ["product_list" "homepage"] nil]
                        (mapv attachment [:propertyPath :operator :allowedValues :parameters]))
                     "Rendered guided save did not persist canonical operator parameters."
                     {:attachment attachment})
    (support/assert! (nil? (:parameters attachment))
                     "Rendered guided save duplicated its property path in operator parameters."
                     {:attachment attachment})
    (support/assert! (= (:allowedValues published-attachment) (:allowedValues reusable))
                     "Reusable rule and schema attachment diverged at the browser persistence boundary."
                     {:attachment published-attachment :reusable reusable})
    (support/assert! (= ["Valid" 0 [["/page_type" "pass" "product_list,homepage" "product_list"]]]
                        [(:state validation) (:issues validation)
                         (mapv (juxt :propertyPath :status :expected :actual) (:evaluations validation))])
                     "The stored guided attachment was not immediately used by production validation."
                     validation)
    (support/assert! (= [["product_list" "homepage"] "Valid" 0
                         [["/page_type" "pass" "product_list,homepage" "product_list"]]
                         ["product_list" "homepage"]]
                        [(:allowedValues legacy) (:state legacy) (:issues legacy)
                         (mapv (juxt :propertyPath :status :expected :actual) (:evaluations legacy))
                         (:exportedAllowedValues legacy)])
                     "Legacy restore or export did not preserve canonical guided-rule semantics."
                     legacy)))

(defn- transition [world example _captures {:keys [text]}]
  (let [mode (or (get entry-modes text) (:guided-rule-parameter-integrity-mode world))]
    (support/assert! mode "Guided rule parameter integrity scenario did not establish its mode." {:step text})
    (verify-model!)
    (validate-example! mode example)
    (when (= mode :runtime) (assert-runtime-boundary! (browser-observation!)))
    (assoc world :guided-rule-parameter-integrity-mode mode)))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-modes
   :guided-rule-parameter-integrity-mode
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T19:11:53.360379444+02:00", :module-hash "-613938763", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-762672925"} {:id "def/feature-files", :kind "def", :line 6, :end-line 8, :hash "1096474843"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "-87847049"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line 14, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "def/canonical-example-rows", :kind "def", :line 17, :end-line 45, :hash "2090364792"} {:id "defn-/validate-example!", :kind "defn-", :line 47, :end-line 56, :hash "-669540829"} {:id "defn-/verify-model!", :kind "defn-", :line 58, :end-line 65, :hash "-95545936"} {:id "defn-/browser-observation!", :kind "defn-", :line 67, :end-line 73, :hash "-540147877"} {:id "defn-/assert-runtime-boundary!", :kind "defn-", :line 75, :end-line 103, :hash "2115354429"} {:id "defn-/transition", :kind "defn-", :line 105, :end-line 111, :hash "1146911008"} {:id "def/handlers", :kind "def", :line 113, :end-line 118, :hash "-1569659581"}]}
;; clj-mutate-manifest-end
