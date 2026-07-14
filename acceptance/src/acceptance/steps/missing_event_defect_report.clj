(ns acceptance.steps.missing-event-defect-report
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-missing-event-defect-report.feature"
   "features/data-layer-missing-event-defect-report-runtime.feature"])

(def entry-modes
  {"a testing session contains a visit to https://shop.example/checkout" :model
   "the built extension side panel is running with production Live sessions, Schema Library, defect reporting, and Jira Cloud export" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn verify-model! []
  (when-not @model-verified?
    (let [result (process/shell support/build-shell-options
                                "node" "test/data-layer-missing-event-defect-report-test.mjs")]
      (support/assert! (zero? (:exit result))
                       (str "Missing-event defect-report model verification failed. " (:err result))
                       {:out (:out result) :err (:err result)})
      (reset! model-verified? true))))

(defn browser-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "MISSING_EVENT_DEFECT_REPORT_BROWSER_ADAPTER"
    :observation-key :missingEventDefectReport
    :runtime-error "Missing-event defect-report browser runtime failed."
    :missing-error "Missing-event defect-report browser evidence is missing."}))

(defn assert-runtime-boundary! [observation]
  (let [{:keys [entries navigation zero warning scope expectationCases matchCounts saved]} observation
        zero-report (:report zero)
        representations [(:preview zero) (:jira zero) (:copied zero)]]
    (support/assert! (= {:sideEntry "Report missing event" :schemaRowEntries 1} entries)
                     "The production entry points did not render." entries)
    (support/assert! (= ["Back to selected page visit" "Back to Live feed"] (:labels navigation))
                     "The builder rendered the wrong navigation targets." navigation)
    (support/assert! (and (:noCapturedNavigation navigation) (:focused navigation))
                     "Captured-event navigation or focus was incorrect." navigation)
    (support/assert! (= ["Missing event" nil "No matching purchase event was captured"
                         "Checkout purchase revision 4" nil nil 0]
                        (mapv zero-report [:type :capturedEventId :actual :schema :payload :capture :issues]))
                     "The zero-match production report fabricated captured-event evidence." zero-report)
    (support/assert! (and (str/includes? (get-in zero [:replacement :review]) "custom_purchase would be replaced by purchase")
                          (= "purchase" (get-in zero [:replacement :acceptedEventName]))
                          (get-in zero [:replacement :intervalControls]))
                     "Replacement review or observation-interval controls were not rendered." (:replacement zero))
    (support/assert! (every? #(and (str/includes? % "Missing event")
                                   (str/includes? % "No matching purchase event was captured")
                                   (str/includes? % "Checkout purchase revision 4")
                                   (not (re-find #"(?i)actual json|validation differences" %)))
                            representations)
                     "Preview, Jira, or clipboard output violated the missing-event representation contract."
                     {:representations representations})
    (support/assert! (and (= 1 (get-in warning [:before :count]))
                          (get-in warning [:before :visible])
                          (get-in warning [:before :ordinaryAbsent])
                          (= "purchase-1" (:openedEvent warning))
                          (:restored warning)
                          (= ["purchase-1"] (get-in warning [:override :evidence]))
                          (str/includes? (get-in warning [:override :jira]) "Explicit override"))
                     "Matching-event warning, restoration, or explicit override evidence was lost." warning)
    (support/assert! (= {:zero {:count 0 :warning true :override nil}
                         :match {:count 1 :visible true :override nil}}
                        scope)
                     "Scope changes did not rerun matching and clear the previous override." scope)
    (support/assert! (= [[1 "assignment:checkout-purchase" 0]
                         [2 nil 0]
                         [0 nil 0]
                         [0 nil 1]]
                        (mapv #(mapv % [:enabled :selected :disabled]) expectationCases))
                     "Assignment prefill resolution diverged at the browser boundary." expectationCases)
    (support/assert! (= [{:count 0 :warning false :continuation "available without override"}
                         {:count 1 :warning true :continuation "available through explicit override"}
                         {:count 2 :warning true :continuation "available through explicit override"}]
                        matchCounts)
                     "Production matching counts did not drive warning and continuation state." matchCounts)
    (support/assert! (= {:immutable true :count 0 :sourceCount 2 :snapshotCount 1} saved)
                     "Later live capture changed a saved-session absence snapshot." saved)
    observation))

(def runtime-example-values
  {"matching_count" #{"0" "1" "2"}
   "warning_visibility" #{"hidden" "visible"}
   "continuation_state" #{"available without override" "available through explicit override"}
   "assignment_context" #{"1 enabled covering assignment" "2 enabled covering assignments" "no enabled covering assignment"}
   "prefill_result" #{"source, event, target, domain, and path" "readable assignment choices" "editable schema-referenced event details"}
   "required_action" #{"confirm the event expectation" "choose an assignment and confirm expectation" "acknowledge warning and confirm expectation"}
   "entry_point" #{"Live session actions" "schema row actions"}})

(def model-example-values
  {"entry_point" #{"the Live session actions" "the Checkout purchase schema actions"}
   "assignment_context" #{"1 enabled assignment covering the visit" "2 enabled assignments covering the visit" "no enabled assignment covering the visit" "only a disabled assignment covering the visit"}
   "prefill_result" #{"source, event, target, domain, and path" "readable assignment choices" "schema identity with editable event details" "disabled assignment shown as non-authoritative context"}
   "confirmation_requirement" #{"explicit operator confirmation" "explicit assignment choice and operator confirmation" "warning acknowledgement and operator confirmation"}})

(defn validate-example! [mode example]
  (support/validate-example-domain!
   (if (= mode :runtime) runtime-example-values model-example-values)
   example
   (filter #(support/example-value example %) (keys (if (= mode :runtime) runtime-example-values model-example-values)))
   "Missing-event defect-report example value was outside the specified contract."))

(defn transition [world example _captures {:keys [text]}]
  (let [mode (or (entry-modes text) (:missing-event-defect-report-mode world))]
    (support/assert! mode "Missing-event defect-report scenario did not establish its mode." {:step text})
    (verify-model!)
    (validate-example! mode example)
    (when (= mode :runtime) (assert-runtime-boundary! (browser-observation!)))
    (assoc world :missing-event-defect-report-mode mode)))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-modes
   :missing-event-defect-report-mode
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T16:29:57.565288867+02:00", :module-hash "317866169", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1298890434"} {:id "def/feature-files", :kind "def", :line 6, :end-line 8, :hash "-1892854164"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "-427372276"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line 14, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "defn/verify-model!", :kind "defn", :line 17, :end-line 24, :hash "670621551"} {:id "defn/browser-observation!", :kind "defn", :line 26, :end-line 32, :hash "-631967216"} {:id "defn/assert-runtime-boundary!", :kind "defn", :line 34, :end-line 84, :hash "-623924689"} {:id "def/runtime-example-values", :kind "def", :line 86, :end-line 93, :hash "712444672"} {:id "def/model-example-values", :kind "def", :line 95, :end-line 99, :hash "689559748"} {:id "defn/validate-example!", :kind "defn", :line 101, :end-line 106, :hash "1431160330"} {:id "defn/transition", :kind "defn", :line 108, :end-line 114, :hash "1634536681"} {:id "def/handlers", :kind "def", :line 116, :end-line 121, :hash "486454608"}]}
;; clj-mutate-manifest-end
