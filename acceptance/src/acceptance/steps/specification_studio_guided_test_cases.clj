(ns acceptance.steps.specification-studio-guided-test-cases
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/specification-studio-guided-test-cases.feature"
   "features/specification-studio-guided-test-cases-runtime.feature"])

(def entry-modes
  {"an operator is authoring a Specification Project with Pages, Events, Assignments, and effective schemas" :model
   "the built extension is running with production Specification Studio, durable project storage, and project evaluation" :runtime})

(defonce model-observation (atom nil))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-observation!
   model-observation
   {:command ["node" "test/data-layer-guided-test-cases-test.mjs"]
    :observation-key :guidedTestCaseModel
    :runtime-error "Guided Test case model verification failed."
    :missing-error "Guided Test case model evidence is missing."}))

(defn- verify-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/browser-packs/guided-test-cases.mjs"]
    :observation-key :guidedTestCases
    :runtime-error "Guided Test case installed-browser verification failed."
    :missing-error "Guided Test case installed-browser evidence is missing."}))

(def example-values
  {"test_type" #{"Page context test" "Event validation test"}
   "purpose" #{"prove applicable Page Groups and Page validation"
               "prove routing and validation for one observed Event"
               "Page Group applicability and Page validation"
               "Assignment routing and Event validation"}
   "scope" #{"one named Page"
             "one named Event and optional Page"
             "one production Page"
             "one production Event and optional Page"}
   "evaluation" #{"Page applicability and effective Page schema"
                  "production Page effective-schema evaluation"
                  "production Assignment and schema evaluation"}
   "source" #{"manual creation" "saved Event Library template" "captured Live validation"}
   "copied_input" #{"a schema-assisted empty input"
                    "its saved Event identity, destination, typed payload, and schema attachment"
                    "its observed Event, context, payload, evaluation identity, and proposed assertions"
                    "one empty schema-assisted input model"
                    "saved Event identity, destination, typed payload, and schema attachment"
                    "observed Event, context, payload, evaluation identity, and proposed assertions"}
   "property_shape" #{"allowed strings retail and trade" "bounded number" "boolean"
                      "nested object" "array of products" "nullable value"
                      "number from 1 through 10" "nested order object"
                      "array of product objects" "nullable campaign"}
   "control" #{"typed retail and trade choices"
               "numeric input with visible minimum and maximum"
               "labelled true and false choice"
               "expandable child-property group"
               "add, remove, reorder, and edit item controls"
               "explicit null or typed-value choice"}
   "entered_value" #{"trade" "7" "false" "order id A-1" "product ids 1 and 2" "null"}
   "stored_value" #{"trade" "7" "false" "nested order id A-1" "two ordered products" "null"}
   "json_type" #{"string" "number" "boolean" "object" "array"
                 "null" "null or declared value type"}
   "assertions" #{"applicable Page Groups, validation outcome, and issue paths and codes"
                  "winning Assignment or no Assignment, validation outcome, and issue paths and codes"}
   "condition" #{"no input or no reviewed assertion"
                 "actual values equal every reviewed expectation"
                 "one actual value differs"
                 "its recorded evaluator revision is superseded"
                 "recorded evaluator revision is superseded"}
   "status" #{"Blocked" "Matched" "Mismatched" "Stale"}
   "operator_guidance" #{"the first incomplete guided control is opened"
                         "actual and expected evidence is retained"
                         "each field-level difference and repair target is shown"
                         "rerun is offered without discarding prior evidence"}
   "runtime_evidence" #{"focus reaches the first incomplete guided control"
                        "actual and expected result bytes are retained"
                        "a field-level difference links to its repair control"
                        "rerun is enabled and prior result bytes remain visible"}})

(defn- validate-example! [_mode example]
  (support/validate-mode-example-domain!
   :guided-test-cases example-values example-values example
   "Guided Test case example was outside the approved contract."))

(defn- scenario-evidence-key [mode world]
  (keyword (format "%s%03d"
                   (name mode)
                   (inc (:acceptance/scenario-index world)))))

(def handlers
  (support/feature-mode-handlers
   feature-files entry-modes :specification-studio-guided-test-cases-mode
   (fn [world example _captures {:keys [text]}]
     (let [state-key :specification-studio-guided-test-cases-mode
           mode (or (entry-modes text) (get world state-key))
           evidence (case mode
                      :model (verify-model!)
                      :runtime (verify-browser!)
                      nil)
           evidence-key (when mode (scenario-evidence-key mode world))]
       (support/assert! mode
                        "Scenario did not establish its Guided Test case acceptance mode."
                        {:step text})
       (validate-example! mode example)
       (support/assert! (true? (get evidence evidence-key))
                        "Scenario-specific Guided Test case evidence is missing."
                        {:mode mode :scenario-evidence evidence-key :evidence evidence})
       (assoc world state-key mode)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-31T12:23:29.920337986+02:00", :module-hash "-130508423", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "879438001"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-871823623"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "261009370"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "1408641943"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 21, :hash "1528971648"} {:id "defn-/verify-browser!", :kind "defn-", :line 23, :end-line 29, :hash "1704119877"} {:id "def/example-values", :kind "def", :line 31, :end-line 80, :hash "1626481849"} {:id "defn-/validate-example!", :kind "defn-", :line 82, :end-line 85, :hash "1847286181"} {:id "defn-/scenario-evidence-key", :kind "defn-", :line 87, :end-line 90, :hash "547583222"} {:id "def/handlers", :kind "def", :line 92, :end-line 110, :hash "-655501147"}]}
;; clj-mutate-manifest-end
