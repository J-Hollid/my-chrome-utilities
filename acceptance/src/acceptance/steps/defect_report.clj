(ns acceptance.steps.defect-report
  (:require [acceptance.steps.defect-report-delivery-assertions :as delivery-assertions]
            [acceptance.steps.defect-report-expected-result-assertions :as expected-result-assertions]
            [acceptance.steps.defect-report-reproduction-assertions :as reproduction-assertions]
            [acceptance.steps.defect-report-timeline-assertions :as timeline-assertions]
            [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-report-builder.feature"
   "features/data-layer-defect-report-jira-cloud-export.feature"
   "features/data-layer-defect-report-reproduction-step-composer.feature"
   "features/data-layer-defect-report-reproduction.feature"])

(defonce ^:private runtime-observation (atom nil))

(def ^:private entry-steps
  #{"captured event purchase is invalid under Checkout schema version 4"
    "a completed defect report is previewed for Jira Cloud"
    "a defect report has numbered pathname step 1 Visit /products and step 2 Visit /checkout"
    "a defect report is being built from invalid event purchase"})

(defn- json-output-line? [line]
  (str/starts-with? line "{"))

(defn- last-json-output-line [result]
  (last (filter json-output-line? (str/split-lines (:out result)))))

(defn- result-observation [result observation-key]
  (when-let [line (last-json-output-line result)]
    (get (json/parse-string line true) observation-key)))

(defn- assert-runtime-result! [result failure-message]
  (support/assert! (zero? (:exit result))
                   (str failure-message ": " (:err result))
                   {:out (:out result) :err (:err result)}))

(defn- load-observation! []
  (let [result (process/shell support/build-shell-options "node" "test/data-layer-defect-report-runtime-test.mjs")
        ui-result (process/shell support/build-shell-options "node" "test/data-layer-defect-report-ui-test.mjs")
        defect-report-observation (result-observation result :defectReport)
        ui-observation (result-observation ui-result :defectReportUi)
        action-rows-observation (support/load-browser-observation!
                                 {:adapter-env "REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER"
                                  :observation-key :reproductionStepActionRows
                                  :runtime-error "Reproduction step action rows browser runtime failed."
                                  :missing-error "Reproduction step action rows browser observation is missing."})
        observation (some-> defect-report-observation
                            (assoc :ui ui-observation
                                   :reproductionStepActionRows action-rows-observation))]
    (assert-runtime-result! result "Defect report production runtime failed")
    (assert-runtime-result! ui-result "Defect report production UI runtime failed")
    (support/assert! observation "Defect report runtime observation is missing." {:out (:out result)})
    (reset! runtime-observation observation)))

(defn- observation! [] (or @runtime-observation (load-observation!)))

(defn- assert-builder-state! [observation]
  (support/assert! (= "purchase-1" (:associatedEvent observation)) "The builder lost its captured event association." observation)
  (support/assert! (= {:currency true :order_id true :coupon false :debug true :total true} (:initial observation)) "Initial issue selection is incorrect." observation)
  (support/assert! (not (some #{"passing"} (:offeredIssues observation))) "Passing evaluations were offered." observation)
  (support/assert! (and (= true (get-in observation [:toggled :coupon])) (= false (get-in observation [:toggled :currency]))) "Issues are not independently selectable." observation)
  (support/assert! (= (:original observation) (get-in observation [:actual :payload])) "The actual result changed the captured payload." observation)
  (support/assert! (= "red" (get-in observation [:actual :differences 0 :treatment])) "The actual difference is not red." observation)
  (support/assert! (= "−" (get-in observation [:actual :differences 0 :marker])) "The actual difference lacks a minus marker." observation))

(defn- assert-reproduction-and-timeline! [observation]
  (support/assert! (= ["/products" "/checkout" "/products" "/checkout"] (mapv :pathname (:steps observation))) "Pathname skeleton is not visit-ordered." observation)
  (support/assert! (= "Open the selected product" (get-in observation [:steps 0 :text])) "Operator reproduction edits were lost." observation)
  (support/assert! (= 1 (:filteredTimelineCount observation)) "Timeline filters did not compose." observation)
  (support/assert! (= ["pageview" "purchase"] (mapv :name (:selectedTimeline observation))) "Supporting timeline selection or chronology is incorrect." observation)
  (support/assert! (nil? (get-in observation [:selectedTimeline 0 :payload])) "Unrequested timeline payload was included." observation)
  (support/assert! (= "Products opened" (get-in observation [:selectedTimeline 0 :summary])) "Requested timeline summary is missing." observation)
  (support/assert! (seq (get-in observation [:selectedTimeline 1 :validationDetails])) "Requested validation details are missing." observation))

(defn- assert-observation! [_text example observation]
  (assert-builder-state! observation)
  (expected-result-assertions/assert-expected-example! example observation)
  (expected-result-assertions/assert-inline-example! example observation)
  (expected-result-assertions/assert-comment-example! example observation)
  (expected-result-assertions/assert-assistance! observation)
  (expected-result-assertions/assert-inline-delivery! observation)
  (expected-result-assertions/assert-custom-override! observation)
  (expected-result-assertions/assert-raw-allowed-values! observation)
  (assert-reproduction-and-timeline! observation)
  (delivery-assertions/assert-preview-and-copy! observation)
  (reproduction-assertions/assert-reproduction-composer! example observation)
  (timeline-assertions/assert-timeline-composer! observation)
  (delivery-assertions/assert-production-ui! observation)
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
;; {:version 1, :tested-at "2026-07-15T18:43:39.296454009+02:00", :module-hash "221761395", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 9, :hash "1727629619"} {:id "def/feature-files", :kind "def", :line 11, :end-line 15, :hash "1040459923"} {:id "form/2/defonce", :kind "defonce", :line 17, :end-line 17, :hash "140063040"} {:id "def/entry-steps", :kind "def", :line 19, :end-line 23, :hash "-2005533574"} {:id "defn-/json-output-line?", :kind "defn-", :line 25, :end-line 26, :hash "1279333289"} {:id "defn-/last-json-output-line", :kind "defn-", :line 28, :end-line 29, :hash "-463411948"} {:id "defn-/result-observation", :kind "defn-", :line 31, :end-line 33, :hash "-11906012"} {:id "defn-/assert-runtime-result!", :kind "defn-", :line 35, :end-line 38, :hash "-1095752944"} {:id "defn-/load-observation!", :kind "defn-", :line 40, :end-line 56, :hash "-563091226"} {:id "defn-/observation!", :kind "defn-", :line 58, :end-line 58, :hash "-569553941"} {:id "defn-/assert-builder-state!", :kind "defn-", :line 60, :end-line 67, :hash "1920614534"} {:id "defn-/assert-reproduction-and-timeline!", :kind "defn-", :line 69, :end-line 76, :hash "1789303158"} {:id "defn-/assert-observation!", :kind "defn-", :line 78, :end-line 92, :hash "-2014586088"} {:id "defn-/transition", :kind "defn-", :line 94, :end-line 97, :hash "-650328638"} {:id "def/handlers", :kind "def", :line 99, :end-line 106, :hash "-914950263"}]}
;; clj-mutate-manifest-end
