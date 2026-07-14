(ns acceptance.steps.defect-library
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-library.feature"
   "features/data-layer-defect-library-runtime.feature"])

(def entry-modes
  {"a testing session contains captured events with schema validation results" :model
   "the built extension side panel is running with production validation, defect reporting, saved sessions, and local persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (when-not @model-verified?
    (let [result (process/shell support/build-shell-options "node" "test/data-layer-defect-library-test.mjs")]
      (support/assert! (zero? (:exit result))
                       (str "Defect Library model verification failed. " (:err result))
                       {:out (:out result) :err (:err result)})
      (reset! model-verified? true))))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "DEFECT_LIBRARY_BROWSER_ADAPTER"
    :observation-key :defectLibrary
    :runtime-error "Defect Library browser runtime verification failed."
    :missing-error "Defect Library browser observation is missing."}))

(defn- assert-runtime! [observed]
  (support/assert! (= ["Live" "Library" "Sessions" "Defects" "Schemas"] (:nav observed))
                   "Defects did not follow Sessions and precede Schemas." observed)
  (support/assert! (= [["Copy for Jira Cloud" 0 true]
                       ["Save as reported defect" 1 false]
                       ["Save as reported defect and copy" 1 true]]
                      (:actionResults observed))
                   "Report save/copy actions changed persistence or clipboard independently." observed)
  (support/assert! (= ["Reported" "Reported" "New" "New" "New" "New" "New" "New" "Review required"]
                      (:differences observed))
                   "Issue match identity included evidence fields or omitted an identity field." observed)
  (support/assert! (= ["active:sku"] (:wildcardMatch observed))
                   "Wildcard matching did not use the canonical template path." observed)
  (support/assert! (= [["2 new issues" 0 2]
                       ["1 new and 1 reported" 1 1]
                       ["all 2 issues reported" 2 0]]
                      (mapv (juxt :triage :reported :fresh) (:renderCases observed)))
                   "Rendered Live issue triage suppressed or replaced current failures." observed)
  (support/assert! (every? #(and (str/includes? (:feed %) "2 issues")
                                 (str/starts-with? (:validation %) "Validation failed"))
                           (:renderCases observed))
                   "Live validation failure presentation was replaced by defect triage." observed)
  (support/assert! (= {:view "true" :detail false} (:openedFromIssue observed))
                   "A Reported issue link did not open its persisted defect." observed)
  (support/assert! (= {:view "true" :event "purchase" :focused true :scrollPreserved true}
                      (:returnedToIssue observed))
                   "Returning from a defect lost the event, issue focus, or feed scroll." observed)
  (support/assert! (= {:href "https://jira.example/browse/DL-42" :target "_blank" :rel "noopener noreferrer"}
                      (get-in observed [:edited :safeLink]))
                   "A note link was not rendered as a safe navigable link." observed)
  (support/assert! (and (str/includes? (:recopy observed) "Edited details")
                        (= {:count 1 :status "Archived" :description "Edited details" :notes "Jira https://jira.example/browse/DL-42"}
                           (:stored observed)))
                   "Edited report details, notes, lifecycle, or reload persistence were lost." observed)
  (support/assert! (= {:sessions 1 :id "saved:session:one" :contains true :immutable true}
                      (:linked observed))
                   "The linked saved session was not immutable or did not report its matching issue." observed)
  (support/assert! (= {:resolved "Possible regression treated New" :archived "New"}
                      (:statuses observed))
                   "Resolved and Archived defects participated in active matching." observed)
  (support/assert! (and (= 2 (:restoredCount observed))
                        (= 1 (:filteredCount observed))
                        (= 1 (:afterDelete observed))
                        (str/includes? (:confirmation observed) "Captured evidence and saved sessions remain unchanged"))
                   "Defect restoration, filtering, or confirmed deletion diverged." observed)
  observed)

(def model-example-values
  {"report_action" #{"Copy for Jira Cloud" "Save as reported defect" "Save as reported defect and copy"}
   "saved_defect_count" #{"0" "1"}
   "clipboard_outcome" #{"report copied" "clipboard unchanged"}
   "difference" #{"nothing" "actual invalid value" "page URL" "source display name" "source id" "event name" "schema id" "validation target" "canonical affected path" "rule id" "rule revision"}
   "match_result" #{"Reported" "New" "Review required and treated as New"}
   "issue_count" #{"2"}
   "reported_count" #{"0" "1" "2"}
   "triage_state" #{"2 new issues" "1 new and 1 reported" "all 2 issues reported"}
   "defect_status" #{"Reported" "Resolved" "Archived"}
   "triage_result" #{"Reported" "Possible regression treated New" "New"}
   "lifecycle_action" #{"Resolve" "Reopen" "none"}})

(def runtime-example-values
  {"report_action" #{"Copy for Jira Cloud" "Save as reported defect" "Save as reported defect and copy"}
   "stored_count" #{"0" "1"}
   "copy_count" #{"0" "1"}
   "difference" #{"actual value" "page URL" "source id" "event name" "schema id" "validation target" "canonical path" "rule id" "rule revision"}
   "triage_result" #{"Reported" "New" "Review required" "Possible regression treated New"}
   "reported_count" #{"0" "1" "2"}
   "new_count" #{"0" "1" "2"}
   "triage_state" #{"2 new issues" "1 new and 1 reported" "all 2 issues reported"}
   "defect_status" #{"Reported" "Resolved" "Archived"}
   "active_match_count" #{"0" "1"}})

(defn- validate-example! [mode example]
  (let [domains (if (= mode :runtime) runtime-example-values model-example-values)]
    (support/validate-example-domain!
     domains example (filter #(support/example-value example %) (keys domains))
     "Defect Library example value was outside the specified contract.")))

(defn- transition [world example _captures {:keys [text]}]
  (let [mode (or (entry-modes text) (:defect-library-mode world))]
    (support/assert! mode "Defect Library scenario did not establish its execution mode." {:step text})
    (verify-model!)
    (validate-example! mode example)
    (when (= mode :runtime) (assert-runtime! (runtime-observation!)))
    (assoc world :defect-library-mode mode)))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? entry-modes (:text spec))
                           (:defect-library-mode world)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
