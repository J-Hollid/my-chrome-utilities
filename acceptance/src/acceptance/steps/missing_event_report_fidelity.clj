(ns acceptance.steps.missing-event-report-fidelity
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-missing-event-report-representation-fidelity.feature"
   "features/data-layer-missing-event-report-representation-fidelity-runtime.feature"])

(def entry-modes
  {"a missing pageview report is being built from Generic pageview revision 4" :model
   "the built extension side panel is running with the production missing-event builder, report preview, Jira copy, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Missing-event report fidelity model verification failed. "
   "node" "test/data-layer-missing-event-report-representation-fidelity-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "MISSING_EVENT_REPORT_FIDELITY_BROWSER_ADAPTER"
    :observation-key :missingEventReportFidelity
    :runtime-error "Missing-event report fidelity browser runtime failed."
    :missing-error "Missing-event report fidelity browser evidence is missing."}))

(defn- assert-runtime! [{:keys [incomplete beforeConfirmation complete edited persistence] :as observed}]
  (support/assert! (and (= {:value "" :tag "TEXTAREA"} (:additional incomplete))
                        (= 1 (:preCount incomplete))
                        (< 1 (:preLines incomplete))
                        (false? (:paragraphHasJson incomplete)))
                   "The incomplete production preview did not retain one multiline JSON block and an empty optional textarea."
                   incomplete)
  (support/assert! (and (= {:page_type "product_detail" :products [{:id 1 :name "robot"}]}
                           (:payload beforeConfirmation))
                        (= ["P" "PRE"] (:structure beforeConfirmation))
                        (= ["Visit /products" "Click Robot" "Visit /checkout" "Expect pageview to be pushed"]
                           (:steps beforeConfirmation)))
                   "Completing expected values changed the incomplete representation or reproduction order."
                   beforeConfirmation)
  (support/assert! (and (= ["P" "P" "PRE"] (:structure complete))
                        (= 1 (:narrativeCount complete))
                        (= 1 (:preCount complete))
                        (:additionalBeforeNarrative complete)
                        (:literalText complete)
                        (:markupAbsent complete)
                        (= "schema-provided value" (get-in complete [:sources (keyword "/page_type")]))
                        (= "operator custom response" (get-in complete [:sources (keyword "/products/0/id")]))
                        (= {:id "page-type" :name "Page type requirement" :version 1 :propertyPath "/page_type"}
                           (get-in complete [:provenance (keyword "/page_type")])))
                   "The complete preview duplicated narrative, interpreted markup, or lost internal response metadata."
                   complete)
  (support/assert! (and (= [1 1 true] [(:preCount edited) (:narrativeCount edited) (:staleAbsent edited)])
                        (= "robot <&> \"quoted\"\nline two" (get-in edited [:payload :products 0 :name]))
                        (= ["Visit /products" "Click Robot card" "Visit /checkout" "Expect pageview to be pushed"]
                           (:steps edited)))
                   "Nested value, additional prose, or reproduction-step edits left stale or duplicate preview content."
                   edited)
  (support/assert! (and (:copiedSame persistence)
                        (:reopenedSame persistence)
                        (:recopiedSame persistence)
                        (= 1 (:reopenedPre persistence))
                        (:provenanceHidden persistence)
                        (:plainBreaks persistence)
                        (= (:savedSources persistence) (:sources complete)))
                   "Clipboard, saved, reopened, and recopied production representations diverged or exposed provenance."
                   persistence)
  observed)

(def model-example-values
  {"field_state" #{"never been edited"
                    "operator-entered text Checkout should emit it"
                    "operator-entered whitespace"}
   "prose_outcome" #{"omitted"
                     "Checkout should emit it appears once"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   model-example-values example
   (filter #(support/example-value example %) (keys model-example-values))
   "Missing-event report fidelity example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :missing-event-report-fidelity-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T01:51:29.078772388+02:00", :module-hash "-1967827838", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-97614922"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "1967212701"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "-1517554031"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "1912253999"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "-645521739"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 70, :hash "-1585008973"} {:id "def/model-example-values", :kind "def", :line 72, :end-line 77, :hash "700641594"} {:id "defn-/validate-example!", :kind "defn-", :line 79, :end-line 83, :hash "335677351"} {:id "def/handlers", :kind "def", :line 85, :end-line 88, :hash "1741356857"}]}
;; clj-mutate-manifest-end
