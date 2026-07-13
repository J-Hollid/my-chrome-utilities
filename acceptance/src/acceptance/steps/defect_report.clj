(ns acceptance.steps.defect-report
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-report-builder.feature"
   "features/data-layer-defect-report-jira-cloud-export.feature"
   "features/data-layer-defect-report-reproduction.feature"])

(defonce ^:private runtime-observation (atom nil))

(def ^:private entry-steps
  #{"captured event purchase is invalid under Checkout schema version 4"
    "a completed defect report is previewed for Jira Cloud"
    "a defect report is being built from invalid event purchase"})

(defn- load-observation! []
  (let [result (process/shell support/build-shell-options "node" "test/data-layer-defect-report-runtime-test.mjs")
        ui-result (process/shell support/build-shell-options "node" "test/data-layer-defect-report-ui-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        ui-line (last (filter #(str/starts-with? % "{") (str/split-lines (:out ui-result))))
        ui-observation (:defectReportUi (when ui-line (json/parse-string ui-line true)))
        observation (some-> (:defectReport (when line (json/parse-string line true)))
                            (assoc :ui ui-observation))]
    (support/assert! (zero? (:exit result))
                     (str "Defect report production runtime failed: " (:err result))
                     {:out (:out result) :err (:err result)})
    (support/assert! (zero? (:exit ui-result))
                     (str "Defect report production UI runtime failed: " (:err ui-result))
                     {:out (:out ui-result) :err (:err ui-result)})
    (support/assert! observation "Defect report runtime observation is missing." {:out (:out result)})
    (reset! runtime-observation observation)))

(defn- observation! [] (or @runtime-observation (load-observation!)))

(defn- assert-observation! [text example observation]
  (support/assert! (= "purchase-1" (:associatedEvent observation)) "The builder lost its captured event association." observation)
  (support/assert! (= {:currency true :order_id true :coupon false :debug true :total true} (:initial observation)) "Initial issue selection is incorrect." observation)
  (support/assert! (not (some #{"passing"} (:offeredIssues observation))) "Passing evaluations were offered." observation)
  (support/assert! (and (= true (get-in observation [:toggled :coupon])) (= false (get-in observation [:toggled :currency]))) "Issues are not independently selectable." observation)
  (support/assert! (= (:original observation) (get-in observation [:actual :payload])) "The actual result changed the captured payload." observation)
  (support/assert! (= "red" (get-in observation [:actual :differences 0 :treatment])) "The actual difference is not red." observation)
  (support/assert! (= "−" (get-in observation [:actual :differences 0 :marker])) "The actual difference lacks a minus marker." observation)
  (when (seq example)
    (let [match (some (fn [candidate]
                        (when (and (= (:issue example) (:issueId candidate))
                                   (= (:constraint example) (:constraint candidate))
                                   (= (:method example) (:method candidate))
                                   (= (:response example) (:response candidate)))
                          candidate))
                      (:cases observation))]
      (support/assert! match "Expected-result example was not exercised by production code." {:example example :cases (:cases observation)})
      (support/assert! (= (:expected_outcome example) (:outcome match)) "Expected explanation differs." match)
      (support/assert! (= (:json_operation example) (:jsonOperation match)) "JSON operation differs." match)))
  (support/assert! (= ["/products" "/checkout" "/products" "/checkout"] (mapv :pathname (:steps observation))) "Pathname skeleton is not visit-ordered." observation)
  (support/assert! (= "Open the selected product" (get-in observation [:steps 0 :text])) "Operator reproduction edits were lost." observation)
  (support/assert! (= 1 (:filteredTimelineCount observation)) "Timeline filters did not compose." observation)
  (support/assert! (= ["pageview" "purchase"] (mapv :name (:selectedTimeline observation))) "Supporting timeline selection or chronology is incorrect." observation)
  (support/assert! (nil? (get-in observation [:selectedTimeline 0 :payload])) "Unrequested timeline payload was included." observation)
  (support/assert! (= "Products opened" (get-in observation [:selectedTimeline 0 :summary])) "Requested timeline summary is missing." observation)
  (support/assert! (seq (get-in observation [:selectedTimeline 1 :validationDetails])) "Requested validation details are missing." observation)
  (doseq [heading ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result" "Differences" "Validation evidence" "Supporting timeline"]]
    (support/assert! (str/includes? (get-in observation [:preview :text]) heading) "Report preview section is missing." {:heading heading}))
  (support/assert! (str/includes? (get-in observation [:preview :html]) "background-color:#ffd7d7") "Rich actual highlighting is missing." observation)
  (support/assert! (str/includes? (get-in observation [:preview :html]) "background-color:#d9f7d9") "Rich expected highlighting is missing." observation)
  (support/assert! (= "success" (get-in observation [:copies :richCopy :status])) "Rich clipboard copy did not succeed." observation)
  (support/assert! (= "warning" (get-in observation [:copies :plainCopy :status])) "Plain clipboard fallback did not warn." observation)
  (support/assert! (= "failure" (get-in observation [:copies :failedCopy :status])) "Clipboard failure was not reported." observation)
  (support/assert! (not= "success" (get-in observation [:copies :failedCopy :status])) "Clipboard failure reported success." observation)
  (support/assert! (= 2 (get-in observation [:ui :reproductionSteps])) "Production UI did not generate pathname reproduction steps." observation)
  (support/assert! (= 2 (get-in observation [:ui :timelineEntries])) "Production UI did not render session timeline entries." observation)
  (support/assert! (true? (get-in observation [:ui :editedSummaryVisible])) "Production UI did not preserve editable report details." observation)
  (support/assert! (= 1 (get-in observation [:ui :copied])) "Production UI did not invoke the Jira clipboard callback." observation)
  true)

(defn- transition [world example _captures {:keys [text]}]
  (let [observation (observation!)]
    (assert-observation! text example observation)
    (assoc world :defect-report observation)))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (entry-steps (:text spec))
                           (contains? world :defect-report)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T03:23:24.395460851+02:00", :module-hash "152952066", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "554503955"} {:id "def/feature-files", :kind "def", :line 7, :end-line nil, :hash "-368844484"} {:id "form/2/defonce", :kind "defonce", :line 12, :end-line nil, :hash "140063040"} {:id "def/entry-steps", :kind "def", :line 14, :end-line nil, :hash "1217624902"} {:id "defn-/load-observation!", :kind "defn-", :line 19, :end-line nil, :hash "-857094689"} {:id "defn-/observation!", :kind "defn-", :line 36, :end-line nil, :hash "-569553941"} {:id "defn-/assert-observation!", :kind "defn-", :line 38, :end-line nil, :hash "791469015"} {:id "defn-/transition", :kind "defn-", :line 78, :end-line nil, :hash "-650328638"} {:id "def/handlers", :kind "def", :line 83, :end-line nil, :hash "-914950263"}]}
;; clj-mutate-manifest-end
