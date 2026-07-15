(ns acceptance.steps.defect-report-provenance-presentation
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-report-provenance-presentation.feature"
   "features/data-layer-defect-report-provenance-presentation-runtime.feature"])

(def entry-modes
  {"a captured-event defect report removes undeclared /action" :model
   "the built extension side panel is running with production validation, captured-event defect reporting, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Defect-report provenance-presentation model verification failed. "
   "node" "test/data-layer-defect-report-provenance-presentation-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "DEFECT_REPORT_PROVENANCE_PRESENTATION_BROWSER_ADAPTER"
    :observation-key :defectReportProvenancePresentation
    :runtime-error "Defect-report provenance-presentation browser runtime failed."
    :missing-error "Defect-report provenance-presentation browser evidence is missing."}))

(def generated-lines
  ["action response source: schema declared-property policy"
   "page_type response source: schema constraint"
   "error_action response source: assigned schema"
   "error_message response source: operator custom override"
   "error_action value-rule provenance: Exact value for error_action v1"])

(defn- assert-runtime! [{:keys [captured missing legacy immutable layout runtimeErrors] :as observed}]
  (support/assert! (and (:suppressed captured)
                        (:operatorPreserved captured)
                        (:expectedPayloadSame captured)
                        (:structuredRetained captured)
                        (str/includes? (get-in captured [:controls :removal]) "schema declared-property policy")
                        (some #(= ["error" "Assigned error schema revision 7"]
                                  [(:value %) (:source %)])
                              (get-in captured [:controls :schema]))
                        (some #{"Custom value or response"} (get-in captured [:controls :custom])))
                   "Captured-event controls, representations, or structured provenance diverged."
                   captured)
  (support/assert! (= [["action" "remove" "schema declared-property policy"]
                       ["error_action" "add" "Assigned error schema revision 7"]
                       ["page_type" "none" "schema constraint"]
                       ["error_message" "add" "operator custom override"]]
                      (mapv (juxt :issueId :operation :responseSource) (:corrections captured)))
                   "Production corrections lost issue, operation, or response-source identity."
                   (:corrections captured))
  (support/assert! (and (= 7 (get-in captured [:corrections 1 :responseProvenance :schema :version]))
                        (every? #(and (:rule %) (integer? (:ruleVersion %)) (:severity %)
                                      (:pointer %) (:violation %) (:constraint %)
                                      (contains? % :actual))
                                (:evidence captured))
                        (true? (get-in captured [:focusScroll :before :focus]))
                        (true? (get-in captured [:focusScroll :after :focus]))
                        (= 53 (get-in captured [:focusScroll :before :scroll])
                           (get-in captured [:focusScroll :after :scroll])
                           (get-in captured [:focusScroll :scroll])))
                   "Validation evidence, rule provenance, focus, or scroll was not retained."
                   captured)
  (support/assert! (and (:suppressed missing) (:operatorPreserved missing) (:reportAvailable missing)
                        (= {:error_action "error"} (:payload missing))
                        (= "schema-provided value" (get-in missing [:sources (keyword "/error_action")]))
                        (= 1 (get-in missing [:provenance (keyword "/error_action") :version])))
                   "Missing-event presentation or retained provenance diverged."
                   missing)
  (support/assert! (and (:suppressed legacy) (:metadata legacy) (:unchanged legacy) (:assistance legacy)
                        immutable
                        (<= (:body layout) (:width layout))
                        (<= (:builder layout) (:width layout))
                        (<= (:missing layout) (:width layout))
                        (empty? runtimeErrors))
                   "Legacy neutrality, immutability, constrained layout, or runtime safety regressed."
                   observed)
  observed)

(def model-example-values
  {"metadata" #{"schema declared-property policy" "schema constraint" "schema-provided value"
                  "operator custom override" "Exact value for error_action v1 from revision 7"}
   "forbidden_text" (set generated-lines)
   "operator_text" #{"Verify the schema mapping with the implementation team"
                       "error_action response source: confirm with the implementation team"
                       "whitespace"}
   "prose_outcome" #{"preserved verbatim"
                       "preserved verbatim because it is operator-authored"
                       "omitted"}})

(def runtime-example-values
  {"source_kind" #{"schema declared-property policy" "schema constraint" "schema-provided value"
                     "operator custom override" "exact-value rule revision metadata"}
   "operation" #{"remove" "replace" "add"}
   "generated_line" #{"action response source: schema declared-property policy"
                       "page_type response source: schema constraint"
                       "error_action response source: assigned schema"
                       "error_message response source: operator custom override"
                       "error_action value-rule provenance: Exact value rule v1"}})

(def model-provenance-relations
  #{["schema declared-property policy" "action response source: schema declared-property policy"]
    ["schema constraint" "page_type response source: schema constraint"]
    ["schema-provided value" "error_action response source: assigned schema"]
    ["operator custom override" "error_message response source: operator custom override"]
    ["Exact value for error_action v1 from revision 7" "error_action value-rule provenance: Exact value for error_action v1"]})

(def operator-relations
  #{["Verify the schema mapping with the implementation team" "preserved verbatim"]
    ["error_action response source: confirm with the implementation team" "preserved verbatim because it is operator-authored"]
    ["whitespace" "omitted"]})

(def runtime-relations
  #{["schema declared-property policy" "remove" "action response source: schema declared-property policy"]
    ["schema constraint" "replace" "page_type response source: schema constraint"]
    ["schema-provided value" "add" "error_action response source: assigned schema"]
    ["operator custom override" "add" "error_message response source: operator custom override"]
    ["exact-value rule revision metadata" "add" "error_action value-rule provenance: Exact value rule v1"]})

(defn- validate-relation! [example keys allowed]
  (when (every? #(support/example-value example %) keys)
    (let [row (mapv #(support/example-value example %) keys)]
      (support/assert! (contains? allowed row)
                       "Provenance-presentation example row was outside the specified relationship."
                       {:keys keys :row row :allowed allowed}))))

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Provenance-presentation example value was outside the specified contract.")
  (validate-relation! example ["metadata" "forbidden_text"] model-provenance-relations)
  (validate-relation! example ["operator_text" "prose_outcome"] operator-relations)
  (validate-relation! example ["source_kind" "operation" "generated_line"] runtime-relations))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :defect-report-provenance-presentation-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T10:25:24.790204364+02:00", :module-hash "-841842125", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-218813697"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-708140740"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "1386558154"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "1289951894"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "-464715929"} {:id "def/generated-lines", :kind "def", :line 29, :end-line 34, :hash "-1500695546"} {:id "defn-/assert-runtime!", :kind "defn-", :line 36, :end-line 81, :hash "-1736577912"} {:id "def/model-example-values", :kind "def", :line 83, :end-line 92, :hash "-1090261672"} {:id "def/runtime-example-values", :kind "def", :line 94, :end-line 102, :hash "1157674472"} {:id "def/model-provenance-relations", :kind "def", :line 104, :end-line 109, :hash "-622510636"} {:id "def/operator-relations", :kind "def", :line 111, :end-line 114, :hash "-1241482875"} {:id "def/runtime-relations", :kind "def", :line 116, :end-line 121, :hash "-347488974"} {:id "defn-/validate-relation!", :kind "defn-", :line 123, :end-line 128, :hash "854533012"} {:id "defn-/validate-example!", :kind "defn-", :line 130, :end-line 136, :hash "-279533788"} {:id "def/handlers", :kind "def", :line 138, :end-line 141, :hash "-190219858"}]}
;; clj-mutate-manifest-end
