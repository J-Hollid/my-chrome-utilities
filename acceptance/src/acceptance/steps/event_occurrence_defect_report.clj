(ns acceptance.steps.event-occurrence-defect-report
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-event-occurrence-defect-report.feature"
   "features/data-layer-event-occurrence-defect-report-runtime.feature"])

(def entry-modes
  {"a testing session contains a valid page_view event captured during the /products page visit" :model
   "the built extension side panel is running with production Live observation, validation, common defect reporting, Jira export, Defect Library persistence, and saved sessions" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Event-occurrence defect-report model verification failed. "
   "node" "test/data-layer-event-occurrence-defect-report-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "EVENT_OCCURRENCE_DEFECT_REPORT_BROWSER_ADAPTER"
    :observation-key :eventOccurrenceDefectReport
    :runtime-error "Event-occurrence defect-report browser runtime failed."
    :missing-error "Event-occurrence defect-report browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial unexpected wrong common persisted clipboard immutable layout runtimeErrors] :as observed}]
  (support/assert! (and (= "Validation passed" (:validation initial))
                        (= ["Report unexpected event" "Report wrong event name"] (:actions initial))
                        (= "captured occurrence and absence expectation" (:stage unexpected))
                        (= "Unexpected event" (:type unexpected))
                        (empty? (:corrections unexpected))
                        (str/includes? (:preview unexpected) "no page_view event is fired"))
                   "Valid-event entry or unexpected-occurrence production evidence diverged."
                   observed)
  (support/assert! (and (= "captured occurrence and replacement event identity" (:stage wrong))
                        (= "assignment:product-view" (:identity wrong))
                        (str/includes? (:payloadState wrong) "product_detail")
                        (= "Wrong event name" (:type wrong))
                        (:representationsEquivalent wrong)
                        (str/includes? (:preview wrong) "product_view"))
                   "Wrong-name identity, payload, or representations diverged."
                   wrong)
  (support/assert! (and (= {:expected true :steps true :timeline true :details 3} common)
                        (= ["Unexpected event" "Wrong event name"] (mapv :type persisted))
                        (every? :occurrenceMatch persisted)
                        (= 1 (:rich clipboard))
                        immutable
                        (<= (:body layout) (:width layout))
                        (<= (:builder layout) (:width layout))
                        (empty? runtimeErrors))
                   "Common controls, persistence, immutability, clipboard, or 320px layout regressed."
                   observed)
  observed)

(def model-example-values
  {"validation_state" #{"Valid" "1 issue"}
   "report_action" #{"Report unexpected event" "Report wrong event name"}
   "evidence_stage" #{"captured occurrence and absence expectation" "captured occurrence and replacement event identity"}
   "identity_source" #{"one enabled covering product_view assignment" "several enabled covering assignments" "no covering assignment and custom product_view" "current page_view identity"}
   "expected_identity" #{"assignment source, name, target, and scope" "no assignment selected" "explicit source, name, target, and scope" "unchanged captured identity"}
   "operator_action" #{"confirm the assignment" "choose one readable assignment" "acknowledge non-schema expectation and confirm" "change the event name before completing the report"}
   "schema_relationship" #{"captured payload satisfies expected schema" "captured payload fails expected schema" "expected schema has additional properties" "no expected schema is selected"}
   "payload_outcome" #{"typed captured payload is reused unchanged" "compatible values are prefilled" "captured values and schema tree are combined" "captured payload is retained as a draft"}
   "editing_outcome" #{"optional editing remains available" "invalid and missing fields require operator review" "recursive property and array editing is available" "warning and explicit operator confirmation are required"}
   "evidence_condition" #{"covering assignment says page_view applies on /products" "product_view was also captured in the products visit" "expected event name equals page_view" "no contradictory assignment or captured event exists"}
   "expectation" #{"page_view should not fire" "product_view should replace page_view" "a different event name should be used"}
   "guardrail_outcome" #{"warning with explicit override" "warning with matching event evidence and explicit override" "completion blocked until identity differs" "expectation can be confirmed"}
   "mode" #{"Unexpected event" "Wrong event name"}
   "final_assertion" #{"Expect no page_view event to be pushed during /products" "Expect product_view instead of page_view during /products"}
   "difference" #{"nothing" "captured payload values" "capture time" "same-URL page-load generation" "source display name" "source id" "actual event name" "validation target" "pathname scope" "expectation mode" "expected event name in wrong-name mode" "expected source or target in wrong-name mode"}
   "match_result" #{"Reported" "New"}})

(def runtime-example-values
  {"report_action" #{"Report unexpected event" "Report wrong event name"}
   "evidence_stage" #{"captured occurrence and absence expectation" "captured occurrence and replacement event identity"}
   "schema_relationship" #{"compatible assigned schema" "incompatible assigned schema" "nested object and array schema" "no covering assignment and custom identity"}
   "payload_state" #{"typed captured payload reused" "compatible captured fields prefilled" "recursive schema tree and captured values shown" "captured payload retained as draft"}
   "completion_state" #{"ready with optional editing" "blocked on invalid and missing expected fields" "ready after required nested values are completed" "blocked on warning acknowledgement and confirmation"}
   "contradiction" #{"covering page_view assignment" "captured product_view in the same page visit" "expected identity still named page_view" "none"}
   "expectation" #{"page_view should not fire" "product_view should replace page_view" "different event should fire"}
   "guardrail" #{"explicit override required" "matching event evidence and explicit override required" "completion blocked" "confirmation accepted"}
   "mode" #{"Unexpected event" "Wrong event name"}
   "assertion" #{"Expect no page_view event to be pushed during /products" "Expect product_view instead of page_view during /products"}
   "difference" #{"captured payload" "capture time" "same-URL reload generation" "source id" "actual event name" "pathname scope" "expectation mode" "wrong-name expected identity"}
   "match_result" #{"Reported" "New"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Event-occurrence defect-report example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :event-occurrence-defect-report-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T11:05:34.387401119+02:00", :module-hash "1985378159", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "2071105471"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-504068906"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1133751091"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "1239932126"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "210726359"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 56, :hash "-96770988"} {:id "def/model-example-values", :kind "def", :line 58, :end-line 74, :hash "1942233932"} {:id "def/runtime-example-values", :kind "def", :line 76, :end-line 88, :hash "-1173301888"} {:id "defn-/validate-example!", :kind "defn-", :line 90, :end-line 93, :hash "-289857018"} {:id "def/handlers", :kind "def", :line 95, :end-line 98, :hash "1317897710"}]}
;; clj-mutate-manifest-end
