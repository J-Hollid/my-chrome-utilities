(ns acceptance.steps.defect-report-delivery-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn assert-preview-and-copy! [observation]
  (doseq [heading ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result" "Differences" "Supporting timeline"]]
    (support/assert! (str/includes? (get-in observation [:preview :text]) heading) "Report preview section is missing." {:heading heading}))
  (support/assert! (str/includes? (get-in observation [:preview :html]) "background-color:#ffd7d7") "Rich actual highlighting is missing." observation)
  (support/assert! (str/includes? (get-in observation [:preview :html]) "background-color:#d9f7d9") "Rich expected highlighting is missing." observation)
  (support/assert! (= "success" (get-in observation [:copies :richCopy :status])) "Rich clipboard copy did not succeed." observation)
  (support/assert! (= "warning" (get-in observation [:copies :plainCopy :status])) "Plain clipboard fallback did not warn." observation)
  (support/assert! (= "failure" (get-in observation [:copies :failedCopy :status])) "Clipboard failure was not reported." observation)
  (support/assert! (not= "success" (get-in observation [:copies :failedCopy :status])) "Clipboard failure reported success." observation))

(defn assert-production-ui! [observation]
  (support/assert! (= 2 (get-in observation [:ui :reproductionSteps])) "Production UI did not generate pathname reproduction steps." observation)
  (support/assert! (= 0 (get-in observation [:ui :timelineEntries])) "Production UI preselected timeline entries." observation)
  (support/assert! (true? (get-in observation [:ui :editedSummaryVisible])) "Production UI did not preserve editable report details." observation)
  (support/assert! (= 1 (get-in observation [:ui :copied])) "Production UI did not invoke the Jira clipboard callback." observation)
  (support/assert! (= ["EUR" "USD"] (get-in observation [:ui :schemaResponses])) "Production UI did not render separate schema responses." observation)
  (support/assert! (true? (get-in observation [:ui :pageType :genericSelected])) "Production UI did not initially select Use generic constraint." observation)
  (support/assert! (= ["homepage" "product listing" "product detail" "checkout"] (get-in observation [:ui :pageType :schemaResponses])) "Production UI did not render page_type schema responses." observation)
  (support/assert! (true? (get-in observation [:ui :pageType :commentAvailable])) "Production UI omitted the allowed-values comment control." observation)
  (support/assert! (str/includes? (get-in observation [:ui :pageType :genericInline]) "page_type: homepage OR product listing OR product detail OR checkout") "Production UI omitted the generic inline response." observation)
  (support/assert! (str/includes? (get-in observation [:ui :pageType :schemaInline]) "page_type: product detail") "Production UI did not replace the generic inline response." observation)
  (support/assert! (str/includes? (get-in observation [:ui :pageType :commentedInline]) "// must be of type homepage, product listing, product detail, or checkout") "Production UI omitted the selected schema comment." observation)
  (support/assert! (not (str/includes? (get-in observation [:ui :pageType :clearedInline]) "must be of type homepage")) "Production UI retained a cleared schema comment." observation)
  (support/assert! (true? (get-in observation [:ui :customInitiallyHidden])) "Custom input was displayed before selection." observation)
  (support/assert! (true? (get-in observation [:ui :customVisibleAfterSelection])) "Custom input did not appear after selection." observation)
  (support/assert! (str/includes? (get-in observation [:ui :invalidCustomWarning]) "does not satisfy") "Production UI omitted custom constraint warning." observation)
  (support/assert! (true? (get-in observation [:ui :customOverrideVisible])) "Production UI omitted operator override provenance." observation)
  (support/assert! (= ["Back to captured event" "Back to Live feed"] (get-in observation [:ui :navigationActions])) "Builder navigation actions are missing or unordered." observation)
  (support/assert! (= {:backToCapturedEvent 1 :focusCreateDefectReport 1 :backToLiveFeed 1} (get-in observation [:ui :navigation])) "Builder navigation callbacks did not restore both destinations and focus." observation)
  (support/assert! (= 480 (get-in observation [:ui :liveFeedScrollTop])) "Builder navigation changed Live feed scroll." observation)
  (support/assert! (>= (:contrast observation) 4.5) "Highlighted text contrast is below 4.5:1." observation))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T18:44:05.63243964+02:00", :module-hash "656638462", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-2007836204"} {:id "defn/assert-preview-and-copy!", :kind "defn", :line 5, :end-line 13, :hash "2052728187"} {:id "defn/assert-production-ui!", :kind "defn", :line 15, :end-line 35, :hash "1669978424"}]}
;; clj-mutate-manifest-end
