(ns acceptance.steps.defect-report
  (:require [acceptance.steps.defect-report-timeline-assertions :as timeline-assertions]
            [acceptance.steps.defect-report-reproduction-assertions :as reproduction-assertions]
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

(defn- load-observation! []
  (let [result (process/shell support/build-shell-options "node" "test/data-layer-defect-report-runtime-test.mjs")
        ui-result (process/shell support/build-shell-options "node" "test/data-layer-defect-report-ui-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        ui-line (last (filter #(str/starts-with? % "{") (str/split-lines (:out ui-result))))
        ui-observation (:defectReportUi (when ui-line (json/parse-string ui-line true)))
        action-rows-observation (support/load-browser-observation!
                                 {:adapter-env "REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER"
                                  :observation-key :reproductionStepActionRows
                                  :runtime-error "Reproduction step action rows browser runtime failed."
                                  :missing-error "Reproduction step action rows browser observation is missing."})
        observation (some-> (:defectReport (when line (json/parse-string line true)))
                            (assoc :ui ui-observation
                                   :reproductionStepActionRows action-rows-observation))]
    (support/assert! (zero? (:exit result))
                     (str "Defect report production runtime failed: " (:err result))
                     {:out (:out result) :err (:err result)})
    (support/assert! (zero? (:exit ui-result))
                     (str "Defect report production UI runtime failed: " (:err ui-result))
                     {:out (:out ui-result) :err (:err ui-result)})
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

(defn- assert-expected-example! [example observation]
  (when (:issue example)
    (let [match (some (fn [candidate]
                        (when (and (= (:issue example) (:issueId candidate))
                                   (= (:constraint example) (:constraint candidate))
                                   (= (:response example) (:response candidate))
                                   (= (:response_source example) (:responseSource candidate)))
                          candidate))
                      (:cases observation))]
      (support/assert! match "Expected-result example was not exercised by production code." {:example example :cases (:cases observation)})
      (support/assert! (= (:expected_outcome example) (:outcome match)) "Expected explanation differs." match)
      (support/assert! (= (:json_operation example) (:jsonOperation match)) "JSON operation differs." match)
      (support/assert! (= (:response_source example) (:responseSource match)) "Expected response provenance differs." match))))

(defn- assert-inline-example! [example observation]
  (when-let [selection (:selection example)]
    (let [match (some #(when (= selection (:selection %)) %) (get-in observation [:pageType :inlineCases]))]
      (support/assert! match "Inline expected-response selection was not exercised by production code." {:example example})
      (support/assert! (= (:expected_response example) (:inlineResponse match)) "Inline expected response differs." match)
      (support/assert! (= (:response_source example) (:responseSource match)) "Inline response provenance differs." match)
      (support/assert! (= 1 (:correctionCount match)) "Changing selection retained more than one inline correction." match)
      (support/assert! (str/includes? (get-in match [:preview :text]) (:expected_response example)) "Plain preview omitted the inline expected response." match)
      (support/assert! (str/includes? (get-in match [:preview :html]) "background-color:#d9f7d9") "Rich preview omitted green inline highlighting." match)
      (support/assert! (= {:page_type "unknown"} (get-in observation [:pageType :original])) "Inline selection mutated the captured event." observation))))

(defn- assert-comment-example! [example observation]
  (when-let [checkbox-state (:checkbox_state example)]
    (let [match (some #(when (= checkbox-state (:checkboxState %)) %) (get-in observation [:pageType :commentCases]))
          expected-json (some-> (:expectedJson match) (json/parse-string true))]
      (support/assert! match "Allowed-values comment state was not exercised by production code." {:example example})
      (support/assert! (= (:expected_line example) (:inlineResponse match)) "Allowed-values inline line differs." match)
      (support/assert! (= "homepage" (:response match)) "Comment toggling changed the selected expected value." match)
      (support/assert! (= "homepage" (:page_type expected-json)) "Expected JSON lost the selected page_type value." {:expected-json expected-json})
      (support/assert! (not (str/includes? (:expectedJson match) "must be of type")) "Schema comment was inserted into Expected JSON." match))))

(defn- assert-assistance! [observation]
  (support/assert! (= "/commerce/currency must be one of EUR or USD" (get-in observation [:assistance :genericConstraint])) "Generic constraint assistance is incorrect." observation)
  (support/assert! (= ["EUR" "USD"] (get-in observation [:assistance :schemaValues])) "Schema allowed values are incorrect." observation)
  (support/assert! (not (some #{"GBP"} (get-in observation [:assistance :schemaValues]))) "The invalid actual value was offered as valid." observation)
  (support/assert! (= "/commerce/currency must be one of EUR or USD" (get-in observation [:generic :explanation])) "Generic Expected result is incorrect." observation)
  (support/assert! (= (:original observation) (get-in observation [:generic :payload])) "Generic constraint changed Expected JSON." observation)
  (support/assert! (= "none" (get-in observation [:generic :corrections 0 :operation])) "Generic constraint invented a JSON operation." observation)
  (support/assert! (= ["homepage" "product listing" "product detail" "checkout"] (get-in observation [:pageType :assistance :schemaValues])) "Page type schema values are incorrect." observation)
  (support/assert! (not (some #{"unknown"} (get-in observation [:pageType :assistance :schemaValues]))) "Invalid page_type was offered as a valid value." observation)
  (support/assert! (false? (get-in observation [:pageType :customValidation :valid])) "Invalid custom page_type was accepted as schema-valid." observation)
  (support/assert! (str/includes? (get-in observation [:pageType :customValidation :warning]) "category landing does not satisfy") "Custom page_type warning is missing." observation))

(defn- assert-inline-delivery! [observation]
  (let [generic-inline (get-in observation [:pageType :inlineCases 0])
        commented-inline (get-in observation [:pageType :commentCases 0])
        generic-copy (get-in observation [:pageType :inlineRichWrites 0])
        commented-copy (get-in observation [:pageType :inlineRichWrites 1])]
    (support/assert! (= "unknown" (:page_type (json/parse-string (:expectedJson generic-inline) true))) "Generic constraint became a selected literal JSON value." generic-inline)
    (doseq [representation [(get-in generic-inline [:preview :text]) (:text generic-copy)]]
      (support/assert! (str/includes? representation "page_type: homepage OR product listing OR product detail OR checkout") "Generic inline response is absent from preview or clipboard." {}))
    (doseq [representation [(get-in commented-inline [:preview :text]) (:text commented-copy)]]
      (support/assert! (str/includes? representation "page_type: \"homepage\", // must be of type homepage, product listing, product detail, or checkout") "Commented inline response is absent from preview or clipboard." {}))
    (support/assert! (str/includes? (:html generic-copy) "page_type response source: schema constraint") "Generic rich clipboard omitted response provenance." generic-copy)
    (support/assert! (str/includes? (:html commented-copy) "background-color:#d9f7d9") "Commented rich clipboard omitted green highlighting." commented-copy)))

(defn- assert-custom-override! [observation]
  (support/assert! (false? (get-in observation [:custom :validation :valid])) "Invalid custom response was accepted as schema-valid." observation)
  (support/assert! (str/includes? (get-in observation [:custom :validation :warning]) "does not satisfy") "Invalid custom response warning is missing." observation)
  (support/assert! (true? (get-in observation [:custom :correction :operatorProvided])) "Kept custom override lacks operator provenance." observation))

(defn- assert-raw-allowed-values! [observation]
  (let [runtime-values (:productAllowedValues observation)
        ui-values (get-in observation [:ui :productAllowedValues])
        expected-json (json/parse-string (:expectedJson runtime-values) true)]
    (support/assert! (= "product,content" (:displayedExpected runtime-values)) "The production validator did not expose the raw allowed-values expectation." runtime-values)
    (support/assert! (not (str/includes? (:displayedExpected runtime-values) "one of")) "The regression fixture still relies on prose parsing." runtime-values)
    (support/assert! (= ["product" "content"] (:ruleValues runtime-values)) "Assigned schema rule values were not preserved on the captured issue." runtime-values)
    (support/assert! (= ["product" "content"] (:schemaValues runtime-values)) "Defect assistance did not derive separate schema choices." runtime-values)
    (support/assert! (str/includes? (:issueText ui-values) "/page_type — product,content") "The product validation issue did not display the raw expectation." ui-values)
    (support/assert! (= ["product" "content"] (:schemaResponses ui-values)) "The product report did not render separate schema-provided values." ui-values)
    (support/assert! (str/includes? (:genericInline ui-values) "page_type: product OR content") "The raw allowed-values rule did not render a generic inline response." ui-values)
    (support/assert! (true? (:commentAvailable ui-values)) "The raw allowed-values rule omitted the comment control." ui-values)
    (support/assert! (str/includes? (:commentedInline ui-values) "page_type: &quot;product&quot;, // must be of type product or content") "The selected product response omitted its allowed-values comment." ui-values)
    (support/assert! (= "product" (:page_type expected-json)) "The expected JSON payload lost the selected product value." expected-json)
    (support/assert! (not (str/includes? (:expectedJson runtime-values) "must be of type")) "Presentation metadata leaked into expected JSON." runtime-values)
    (support/assert! (= {:page_type "product test"} (:original runtime-values) (:original ui-values)) "Defect assistance mutated the captured product event." {:runtime runtime-values :ui ui-values})))

(defn- assert-reproduction-and-timeline! [observation]
  (support/assert! (= ["/products" "/checkout" "/products" "/checkout"] (mapv :pathname (:steps observation))) "Pathname skeleton is not visit-ordered." observation)
  (support/assert! (= "Open the selected product" (get-in observation [:steps 0 :text])) "Operator reproduction edits were lost." observation)
  (support/assert! (= 1 (:filteredTimelineCount observation)) "Timeline filters did not compose." observation)
  (support/assert! (= ["pageview" "purchase"] (mapv :name (:selectedTimeline observation))) "Supporting timeline selection or chronology is incorrect." observation)
  (support/assert! (nil? (get-in observation [:selectedTimeline 0 :payload])) "Unrequested timeline payload was included." observation)
  (support/assert! (= "Products opened" (get-in observation [:selectedTimeline 0 :summary])) "Requested timeline summary is missing." observation)
  (support/assert! (seq (get-in observation [:selectedTimeline 1 :validationDetails])) "Requested validation details are missing." observation))

(defn- assert-preview-and-copy! [observation]
  (doseq [heading ["Summary" "Description" "Steps to reproduce" "Actual result" "Expected result" "Differences" "Validation evidence" "Supporting timeline"]]
    (support/assert! (str/includes? (get-in observation [:preview :text]) heading) "Report preview section is missing." {:heading heading}))
  (support/assert! (str/includes? (get-in observation [:preview :html]) "background-color:#ffd7d7") "Rich actual highlighting is missing." observation)
  (support/assert! (str/includes? (get-in observation [:preview :html]) "background-color:#d9f7d9") "Rich expected highlighting is missing." observation)
  (support/assert! (= "success" (get-in observation [:copies :richCopy :status])) "Rich clipboard copy did not succeed." observation)
  (support/assert! (= "warning" (get-in observation [:copies :plainCopy :status])) "Plain clipboard fallback did not warn." observation)
  (support/assert! (= "failure" (get-in observation [:copies :failedCopy :status])) "Clipboard failure was not reported." observation)
  (support/assert! (not= "success" (get-in observation [:copies :failedCopy :status])) "Clipboard failure reported success." observation))

(defn- assert-production-ui! [observation]
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

(defn- assert-observation! [_text example observation]
  (assert-builder-state! observation)
  (assert-expected-example! example observation)
  (assert-inline-example! example observation)
  (assert-comment-example! example observation)
  (assert-assistance! observation)
  (assert-inline-delivery! observation)
  (assert-custom-override! observation)
  (assert-raw-allowed-values! observation)
  (assert-reproduction-and-timeline! observation)
  (assert-preview-and-copy! observation)
  (reproduction-assertions/assert-reproduction-composer! example observation)
  (timeline-assertions/assert-timeline-composer! observation)
  (assert-production-ui! observation)
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
;; {:version 1, :tested-at "2026-07-13T13:57:08.003881113+02:00", :module-hash "-1492239983", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1578704479"} {:id "def/feature-files", :kind "def", :line 9, :end-line nil, :hash "1040459923"} {:id "form/2/defonce", :kind "defonce", :line 15, :end-line nil, :hash "140063040"} {:id "def/entry-steps", :kind "def", :line 17, :end-line nil, :hash "-2005533574"} {:id "defn-/load-observation!", :kind "defn-", :line 23, :end-line nil, :hash "-857094689"} {:id "defn-/observation!", :kind "defn-", :line 40, :end-line nil, :hash "-569553941"} {:id "defn-/assert-builder-state!", :kind "defn-", :line 42, :end-line nil, :hash "1920614534"} {:id "defn-/assert-expected-example!", :kind "defn-", :line 51, :end-line nil, :hash "738700816"} {:id "defn-/assert-inline-example!", :kind "defn-", :line 65, :end-line nil, :hash "339380930"} {:id "defn-/assert-comment-example!", :kind "defn-", :line 76, :end-line nil, :hash "1998249303"} {:id "defn-/assert-assistance!", :kind "defn-", :line 86, :end-line nil, :hash "-493777955"} {:id "defn-/assert-inline-delivery!", :kind "defn-", :line 98, :end-line nil, :hash "-727771082"} {:id "defn-/assert-custom-override!", :kind "defn-", :line 111, :end-line nil, :hash "1425250104"} {:id "defn-/assert-raw-allowed-values!", :kind "defn-", :line 116, :end-line nil, :hash "-678647453"} {:id "defn-/assert-reproduction-and-timeline!", :kind "defn-", :line 133, :end-line nil, :hash "1789303158"} {:id "defn-/assert-preview-and-copy!", :kind "defn-", :line 142, :end-line nil, :hash "-1088697637"} {:id "defn-/assert-production-ui!", :kind "defn-", :line 152, :end-line nil, :hash "-712946011"} {:id "defn-/assert-observation!", :kind "defn-", :line 174, :end-line nil, :hash "1753617643"} {:id "defn-/transition", :kind "defn-", :line 190, :end-line nil, :hash "-650328638"} {:id "def/handlers", :kind "def", :line 195, :end-line nil, :hash "-914950263"}]}
;; clj-mutate-manifest-end
