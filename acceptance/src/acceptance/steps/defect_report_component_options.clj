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
   (= {:focus true :scroll 43} (:componentControlRefresh observed))
   "Component-control refresh lost focus or report scroll." observed)
  (support/assert!
   (= [false false true] (get-in observed [:afterRefresh :states]))
   "Report edits reset component selections." observed)
  (let [stored (:stored observed)
        expected-headings ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result" "Validation evidence" "Capture metadata"]]
    (support/assert!
     (and (= {:differences false :validationRules false :captureMetadata true} (:components stored))
          (every? #(= expected-headings %) [(:preview stored) (:afterEdit stored) (:rich stored) (:recopy stored)])
          (:structured stored)
          (= "Internal note" (:notes stored)))
     "Saved, edited, reopened, or recopied reports lost component selections or structured data."
     observed))
  (support/assert!
   (and (= ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result"
            "Differences" "Validation evidence" "Validation rules covered" "Capture metadata"]
           (get-in observed [:legacy :headings])
           (get-in observed [:legacy :copy]))
        (get-in observed [:legacy :unchanged])
        (= [true false false] (get-in observed [:legacy :newDefaults])))
   "Legacy fallback or new-builder defaults changed." observed)
  (assert-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (entry-steps text)
                (assoc world :defect-report-component-options (browser-observation!))
                world)
        observed (:defect-report-component-options world)]
    (support/assert! observed "Defect report component-options adapter was not executed." {:step text})
    (assert-observation! example observed)
    world))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :defect-report-component-options
   transition))
