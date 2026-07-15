(ns acceptance.steps.defect-library
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-library.feature"
   "features/data-layer-defect-library-runtime.feature"])

(def entry-modes
  {"a testing session contains captured events with schema validation results" :model
   "the built extension side panel is running with production validation, defect reporting, saved sessions, and local persistence" :runtime})

(defonce model-verified? (atom false))
(defonce copy-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Defect Library model verification failed. "
   "node" "test/data-layer-defect-library-test.mjs"))

(defn- verify-copy! []
  (support/cached-command-verification!
   copy-verified?
   "Defect Library clipboard verification failed. "
   "node" "test/data-layer-defect-library-copy-test.mjs"))

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
                       ["Save defect" 1 false]
                       ["Save defect and copy" 1 true]]
                      (:actionResults observed))
                   "Report save/copy actions changed persistence or clipboard independently." observed)
  (support/assert! (= [[] ["Saved"] ["Saved"]] (:actionStatuses observed))
                   "Newly stored defects did not receive Saved status." observed)
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
  (support/assert! (and (= ["Saved" "Reported" "Resolved" "Archived"]
                           (get-in observed [:stateControl :options]))
                        (= 1 (get-in observed [:stateControl :updateButtons]))
                        (zero? (get-in observed [:stateControl :legacyButtons]))
                        (= #{"text/html" "text/plain"} (set (get-in observed [:recopy :types])))
                        (str/includes? (get-in observed [:recopy :html]) "Edited details")
                        (str/includes? (get-in observed [:recopy :text]) "Edited details")
                        (= {:count 1 :status "Reported" :description "Edited details" :notes "Jira https://jira.example/browse/DL-42"}
                           (:stored observed)))
                   "Stored report recopy, direct state selection, or reload persistence diverged." observed)
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
  {"report_action" #{"Copy for Jira Cloud" "Save defect" "Save defect and copy"}
   "saved_defect_count" #{"0" "1"}
   "clipboard_outcome" #{"report copied" "clipboard unchanged"}
   "difference" #{"nothing" "actual invalid value" "page URL" "source display name" "source id" "event name" "schema id" "validation target" "canonical affected path" "rule id" "rule revision"}
   "match_result" #{"Reported" "New" "Review required and treated as New"}
   "issue_count" #{"2"}
   "reported_count" #{"0" "1" "2"}
   "triage_state" #{"2 new issues" "1 new and 1 reported" "all 2 issues reported"}
   "current_status" #{"Saved" "Reported" "Resolved" "Archived"}
   "selected_status" #{"Saved" "Reported" "Resolved" "Archived"}
   "defect_type" #{"validation issue" "Missing event" "Unexpected event" "Wrong event name"}
   "jira_ticket" #{"https://jira.example/browse/DL-42"}
   "clipboard_availability" #{"plain text only" "unavailable"}
   "recopy_outcome" #{"plain-text report copied" "no clipboard representation was copied"}
   "feedback" #{"rich formatting was not copied" "copy failure"}
   "triage_result" #{"Reported" "Possible regression treated New" "New"}})

(def runtime-example-values
  {"report_action" #{"Copy for Jira Cloud" "Save defect" "Save defect and copy"}
   "stored_count" #{"0" "1"}
   "copy_count" #{"0" "1"}
   "difference" #{"actual value" "page URL" "source id" "event name" "schema id" "validation target" "canonical path" "rule id" "rule revision"}
   "triage_result" #{"Reported" "New" "Review required" "Possible regression treated New"}
   "reported_count" #{"0" "1" "2"}
   "new_count" #{"0" "1" "2"}
   "triage_state" #{"2 new issues" "1 new and 1 reported" "all 2 issues reported"}
   "defect_status" #{"Saved" "Reported" "Resolved" "Archived"}
   "current_status" #{"Saved" "Reported" "Resolved" "Archived"}
   "selected_status" #{"Saved" "Reported" "Resolved" "Archived"}
   "defect_type" #{"validation issue" "Missing event" "Unexpected event" "Wrong event name"}
   "jira_ticket" #{"https://jira.example/browse/DL-42"}
   "clipboard_support" #{"plain text only" "unavailable"}
   "clipboard_behavior" #{"plain-text report copied" "no clipboard representation was copied"}
   "feedback" #{"rich formatting was not copied" "copy failure"}
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
    (verify-copy!)
    (validate-example! mode example)
    (when (= mode :runtime) (assert-runtime! (runtime-observation!)))
    (assoc world :defect-library-mode mode)))

(def handlers
  (support/feature-mode-handlers
   feature-files entry-modes :defect-library-mode transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T15:19:21.262451568+02:00", :module-hash "1813747182", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-274521560"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-1831855263"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "1676478283"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1495442629"} {:id "form/5/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 17, :end-line 21, :hash "-1298890372"} {:id "defn-/verify-copy!", :kind "defn-", :line 23, :end-line 27, :hash "1209655485"} {:id "defn-/runtime-observation!", :kind "defn-", :line 29, :end-line 35, :hash "337029558"} {:id "defn-/assert-runtime!", :kind "defn-", :line 37, :end-line 90, :hash "2136625280"} {:id "def/model-example-values", :kind "def", :line 92, :end-line 108, :hash "1322072509"} {:id "def/runtime-example-values", :kind "def", :line 110, :end-line 127, :hash "-1542216714"} {:id "defn-/validate-example!", :kind "defn-", :line 129, :end-line 133, :hash "-1940833225"} {:id "defn-/transition", :kind "defn-", :line 135, :end-line 142, :hash "-732737909"} {:id "def/handlers", :kind "def", :line 144, :end-line 146, :hash "1013793018"}]}
;; clj-mutate-manifest-end
