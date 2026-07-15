(ns acceptance.steps.defect-report-component-options
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-defect-report-component-options.feature"
   "features/data-layer-defect-report-component-options-runtime.feature"])
(def entry-steps
  #{"captured purchase has selected validation issues for /commerce/currency and /order_id"
    "production purchase has selected validation issues, corrected expected values, semantic differences, validation evidence, and capture metadata"
    "the built extension side panel is running with production validation, captured-event defect reporting, Jira export, and Defect Library persistence"})
(defonce ^:private observation (atom nil))
(def ^:private example-values
  {"rules_state" #{"cleared" "selected"}
   "capture_state" #{"cleared" "selected"}})

(defn- browser-observation! []
  (support/cached-browser-observation!
   observation
   {:adapter-env "DEFECT_REPORT_COMPONENT_OPTIONS_BROWSER_ADAPTER"
    :observation-key :defectReportComponentOptions
    :runtime-error "Defect report component-options browser runtime failed."
    :missing-error "Defect report component-options browser observation is missing."}))

(defn- selected? [value] (= value "selected"))

(defn- assert-example! [example observed]
  (when-let [rules-state (support/example-value example "rules_state")]
    (support/validate-example-domain!
     example-values example ["rules_state" "capture_state"]
     "Defect-report component option example was outside the specified contract.")
    (let [capture-state (support/require-example example "capture_state")
          rules? (selected? rules-state)
          capture? (selected? capture-state)
          result (first (filter #(and (= rules? (:rulesState %))
                                      (= capture? (:captureState %)))
                                (:combinations observed)))
          optional (cond-> []
                     (or rules? capture?) (conj "Validation evidence")
                     rules? (conj "Validation rules covered")
                     capture? (conj "Capture metadata"))]
      (support/assert!
       (and result
            (= (:preview result) (:rich result))
            (= optional (:plain result))
            (= optional (filterv #{"Validation evidence" "Validation rules covered" "Capture metadata"}
                                 (:preview result))))
       "Optional evidence rendering disagreed across preview, rich, or plain output."
       {:example example :result result}))))

(defn- assert-observation! [example observed]
  (support/assert!
   (= [[true false false]
       ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result" "Differences"]
       true]
      [(get-in observed [:initial :states])
       (get-in observed [:initial :headings])
       (get-in observed [:initial :required])])
   "New captured-event report component defaults changed." observed)
  (support/assert!
   (= {:rules 1 :schema true :severity true :pointer true :violation true
       :constraint true :actual true :capture true :noProvenance true}
      (:evidence observed))
   "Selected evidence components lost, duplicated, or contaminated evidence." observed)
  (support/assert!
   (and (not (some #{"Differences"} (get-in observed [:withoutDifferences :headings])))
        (get-in observed [:withoutDifferences :red])
        (get-in observed [:withoutDifferences :green])
        (= 3 (count (:restoredDifferences observed)))
        (= 3 (count (distinct (:restoredDifferences observed)))))
   "Differences suppression changed highlighting or deterministic restoration." observed)
  (support/assert!
   (and (:structuredControlsUnchanged observed)
        (every? #(= {:focus true :scroll 43} %) (vals (:refreshes observed)))
        (= [false false true] (get-in observed [:afterRefresh :states])))
   "Component controls changed structured data or report edits lost presentation state." observed)
  (let [stored (:stored observed)
        expected-headings ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result" "Validation evidence" "Capture metadata" "Supporting timeline"]]
    (support/assert!
     (and (= {:differences false :validationRules false :captureMetadata true} (:components stored))
          (every? #(= expected-headings %) [(:preview stored) (:afterEdit stored) (:rich stored) (:recopy stored)])
          (:structured stored)
          (= "Internal note" (:notes stored)))
     "Saved, edited, reopened, or recopied reports lost component selections or structured data."
     observed))
  (support/assert!
   (and (= ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result"
            "Differences" "Validation evidence" "Validation rules covered" "Capture metadata" "Supporting timeline"]
           (get-in observed [:legacy :headings])
           (get-in observed [:legacy :copy]))
        (get-in observed [:legacy :unchanged])
        (= [true false false] (get-in observed [:legacy :newDefaults])))
   "Legacy fallback or new-builder defaults changed." observed)
  (assert-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (support/stateful-transition
   world example text entry-steps :defect-report-component-options browser-observation!
   "Defect report component-options adapter was not executed."
   assert-observation!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :defect-report-component-options
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T18:46:11.536042426+02:00", :module-hash "360663725", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "980283895"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "360754286"} {:id "def/entry-steps", :kind "def", :line 7, :end-line 10, :hash "991335764"} {:id "form/3/defonce", :kind "defonce", :line 11, :end-line 11, :hash "-1819867165"} {:id "def/example-values", :kind "def", :line 12, :end-line 14, :hash "421858561"} {:id "defn-/browser-observation!", :kind "defn-", :line 16, :end-line 22, :hash "-1698678917"} {:id "defn-/selected?", :kind "defn-", :line 24, :end-line 24, :hash "-194408770"} {:id "defn-/assert-example!", :kind "defn-", :line 26, :end-line 48, :hash "543701680"} {:id "defn-/assert-observation!", :kind "defn-", :line 50, :end-line 93, :hash "725967798"} {:id "defn-/transition", :kind "defn-", :line 95, :end-line 99, :hash "12532909"} {:id "def/handlers", :kind "def", :line 101, :end-line 106, :hash "-1961762933"}]}
;; clj-mutate-manifest-end
