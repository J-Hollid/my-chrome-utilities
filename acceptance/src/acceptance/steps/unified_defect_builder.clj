(ns acceptance.steps.unified-defect-builder
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-unified-defect-report-builder.feature"
   "features/data-layer-unified-defect-report-builder-runtime.feature"])

(def entry-modes
  {"a testing session contains visits to /products and /checkout" :model
   "the built extension side panel is running with production defect reporting, schema validation, session chronology, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification! model-verified?
    "Unified defect builder model verification failed. "
    "node" "test/data-layer-unified-defect-builder-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation! browser-observation
    {:adapter-env "UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER"
     :observation-key :unifiedDefectBuilder
     :runtime-error "Unified defect builder browser runtime failed."
     :missing-error "Unified defect builder browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (let [initial (get-in observed [:unified :initial])
        complete (get-in observed [:unified :complete])
        nested (get-in observed [:unified :nested])
        failures (get-in observed [:unified :failures])]
    (support/assert! (and (every? (set (:stages initial)) ["Expected result" "Steps to reproduce" "Supporting timeline" "Report details"])
                          (:evidence initial)
                          (:commonControls initial)
                          (:copyDisabled initial)
                          (:saveDisabled initial)
                          (:noCreate initial)
                          (:noInterval initial)
                          (= "/products" (:from initial))
                          (= "/checkout" (:to initial)))
                     "The rendered missing-event path did not use the common production stages and composers."
                     observed)
    (support/assert! (and (str/includes? (:schemaExpected initial) "order_id · string · required")
                          (str/includes? (:schemaExpected initial) "Use schema value EUR")
                          (str/includes? (:preview initial) "Actual result")
                          (str/includes? (:preview initial) "Expected result"))
                     "Schema-derived expectations or the continuously rendered preview were absent."
                     observed)
    (support/assert! (and (false? (:copyDisabled complete))
                          (false? (:saveDisabled complete))
                          (str/includes? (:preview complete) "pushed or observed in event-history")
                          (str/includes? (:preview complete) "Checkout purchase revision 4")
                          (str/includes? (:preview complete) "Expect purchase to be pushed"))
                     "Completion did not retain absence evidence, schema identity, journey assertion, copy, and save."
                     observed)
    (support/assert! (and (= {:page_name "test" :products [{:id 1 :name "robot"}]} (:payload nested))
                          (= 2 (:duplicatedItems nested))
                          (= 1 (:itemCount nested))
                          (= [false false false] (:actions nested))
                          (= 3 (count (:sources nested)))
                          (= #{"schema-provided value" "operator custom response"} (set (vals (:sources nested))))
                          (= {:saves 1 :copiedSame true :feedback "Missing-event report saved and copied for Jira Cloud."} (:combined nested))
                          (every? #(str/includes? (:tree nested) %) ["page_name · string" "products · array" "products.0.id · number" "products.0.name · string"])
                          (str/includes? (:preview nested) "pageview is fired with {\"page_name\":\"test\",\"products\":[{\"id\":1,\"name\":\"robot\"}]}")
                          (str/includes? (:html nested) "&quot;products&quot;: ["))
                     "Recursive typed expected-payload editing or shared representation diverged."
                     nested)
    (support/assert! (and (= "Copy failed" (:copyFailure failures))
                          (= "Save failed" (:saveFailure failures))
                          (= 1 (:rejectedSaveCalls failures))
                          (:unchanged failures))
                     "A failed clipboard or persistence boundary changed the draft or announced success."
                     failures)
    (support/assert! (and (= "Missing event" (get-in observed [:zero :report :type]))
                          (nil? (get-in observed [:zero :report :payload]))
                          (nil? (get-in observed [:zero :report :capture]))
                          (zero? (get-in observed [:zero :report :issues]))
                          (= ["purchase-1"] (get-in observed [:warning :override :evidence])))
                     "The unified path fabricated captured evidence or lost explicit matching-event override evidence."
                     observed))
  observed)

(def example-values
  {"defect_kind" #{"captured validation issue" "missing purchase event"}
   "evidence_stage" #{"selected issue and captured Actual result" "expected-event confirmation and absence verification" "validation issue selection and captured Actual result"}
   "property_path" #{"page_name" "products.0.id" "products.0.name" "logged_in"}
   "property_type" #{"string" "number" "boolean"}
   "schema_choices" #{"home and test" "none" "robot and vehicle" "true and false"}
   "value_source" #{"schema" "custom"}
   "entered_value" #{"test" "1" "robot" "false"}
   "stored_value" #{"test" "1" "robot" "false"}
   "json_pointer" #{"/page_name" "/products/0/id" "/products/0/name" "/logged_in"}
   "json_type" #{"string" "number" "boolean"}
   "response_source" #{"schema constraint" "schema-provided value" "operator custom response"}
   "step_kind" #{"Click component" "Log in as user" "Scroll" "Custom step"}
   "step_input" #{"Checkout, sticky footer button" "returning customer" "bottom of the page" "Apply the free delivery filter"}
   "step_text" #{"Click Checkout — sticky footer button" "Log in as returning customer" "Scroll to the bottom of the page" "Apply the free delivery filter"}
   "report_action" #{"Copy for Jira Cloud" "Save as reported defect" "Save as reported defect and copy"}
   "successful_effect" #{"the current preview is written through the Jira clipboard integration" "one discoverable Missing event defect is persisted in Defects" "one defect is persisted and the same representation is written to clipboard"}
   "failed_effect" #{"clipboard writing rejects" "Defect Library persistence rejects"}
   "boundary" #{"Jira clipboard adapter" "Defect Library persistence"}
   "failure_feedback" #{"Copy failed" "Save failed"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain! example-values example
    (filter #(support/example-value example %) (keys example-values))
    "Unified defect builder example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :unified-defect-builder-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T20:36:54.077795872+02:00", :module-hash "-1670320735", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-900589086"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-431635032"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "1892810973"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "-187678025"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 26, :hash "984813460"} {:id "defn-/assert-runtime!", :kind "defn-", :line 28, :end-line 58, :hash "-756824726"} {:id "def/example-values", :kind "def", :line 60, :end-line 70, :hash "-302237122"} {:id "defn-/validate-example!", :kind "defn-", :line 72, :end-line 75, :hash "2052622672"} {:id "def/handlers", :kind "def", :line 77, :end-line 80, :hash "4626468"}]}
;; clj-mutate-manifest-end
