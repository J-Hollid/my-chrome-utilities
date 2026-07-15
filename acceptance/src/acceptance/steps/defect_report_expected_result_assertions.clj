(ns acceptance.steps.defect-report-expected-result-assertions
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defn assert-expected-example! [example observation]
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

(defn assert-inline-example! [example observation]
  (when-let [selection (:selection example)]
    (let [match (some #(when (= selection (:selection %)) %) (get-in observation [:pageType :inlineCases]))]
      (support/assert! match "Inline expected-response selection was not exercised by production code." {:example example})
      (support/assert! (= (:expected_response example) (:inlineResponse match)) "Inline expected response differs." match)
      (support/assert! (= (:response_source example) (:responseSource match)) "Inline response provenance differs." match)
      (support/assert! (= 1 (:correctionCount match)) "Changing selection retained more than one inline correction." match)
      (support/assert! (str/includes? (get-in match [:preview :text]) (:expected_response example)) "Plain preview omitted the inline expected response." match)
      (support/assert! (str/includes? (get-in match [:preview :html]) "background-color:#d9f7d9") "Rich preview omitted green inline highlighting." match)
      (support/assert! (= {:page_type "unknown"} (get-in observation [:pageType :original])) "Inline selection mutated the captured event." observation))))

(defn assert-comment-example! [example observation]
  (when-let [checkbox-state (:checkbox_state example)]
    (let [match (some #(when (= checkbox-state (:checkboxState %)) %) (get-in observation [:pageType :commentCases]))
          expected-json (some-> (:expectedJson match) (json/parse-string true))]
      (support/assert! match "Allowed-values comment state was not exercised by production code." {:example example})
      (support/assert! (= (:expected_line example) (:inlineResponse match)) "Allowed-values inline line differs." match)
      (support/assert! (= "homepage" (:response match)) "Comment toggling changed the selected expected value." match)
      (support/assert! (= "homepage" (:page_type expected-json)) "Expected JSON lost the selected page_type value." {:expected-json expected-json})
      (support/assert! (not (str/includes? (:expectedJson match) "must be of type")) "Schema comment was inserted into Expected JSON." match))))

(defn assert-assistance! [observation]
  (support/assert! (= "/commerce/currency must be one of EUR or USD" (get-in observation [:assistance :genericConstraint])) "Generic constraint assistance is incorrect." observation)
  (support/assert! (= ["EUR" "USD"] (get-in observation [:assistance :schemaValues])) "Schema allowed values are incorrect." observation)
  (support/assert! (not (some #{"GBP"} (get-in observation [:assistance :schemaValues]))) "The invalid actual value was offered as valid." observation)
  (support/assert! (= "/commerce/currency must be one of EUR or USD" (get-in observation [:generic :explanation])) "Generic Expected result is incorrect." observation)
  (support/assert! (= (:original observation) (get-in observation [:generic :payload])) "Generic constraint changed Expected JSON." observation)
  (support/assert! (= "none" (get-in observation [:generic :corrections 0 :operation])) "Generic constraint invented a JSON operation." observation)
  (support/assert! (= ["homepage" "product listing" "product detail" "checkout"] (get-in observation [:pageType :assistance :schemaValues])) "Page type schema values are incorrect." observation)
  (support/assert! (not (some #{"unknown"} (get-in observation [:pageType :assistance :schemaValues]))) "Invalid page_type was offered as valid." observation)
  (support/assert! (false? (get-in observation [:pageType :customValidation :valid])) "Invalid custom page_type was accepted as schema-valid." observation)
  (support/assert! (str/includes? (get-in observation [:pageType :customValidation :warning]) "category landing does not satisfy") "Custom page_type warning is missing." observation))

(defn assert-inline-delivery! [observation]
  (let [generic-inline (get-in observation [:pageType :inlineCases 0])
        commented-inline (get-in observation [:pageType :commentCases 0])
        generic-copy (get-in observation [:pageType :inlineRichWrites 0])
        commented-copy (get-in observation [:pageType :inlineRichWrites 1])]
    (support/assert! (= "unknown" (:page_type (json/parse-string (:expectedJson generic-inline) true))) "Generic constraint became a selected literal JSON value." generic-inline)
    (doseq [representation [(get-in generic-inline [:preview :text]) (:text generic-copy)]]
      (support/assert! (str/includes? representation "page_type: homepage OR product listing OR product detail OR checkout") "Generic inline response is absent from preview or clipboard." {}))
    (doseq [representation [(get-in commented-inline [:preview :text]) (:text commented-copy)]]
      (support/assert! (str/includes? representation "page_type: \"homepage\", // must be of type homepage, product listing, product detail, or checkout") "Commented inline response is absent from preview or clipboard." {}))
    (support/assert! (not (str/includes? (:html generic-copy) "page_type response source: schema constraint")) "Generic rich clipboard exposed generated response provenance." generic-copy)
    (support/assert! (str/includes? (:html commented-copy) "background-color:#d9f7d9") "Commented rich clipboard omitted green highlighting." commented-copy)))

(defn assert-custom-override! [observation]
  (support/assert! (false? (get-in observation [:custom :validation :valid])) "Invalid custom response was accepted as schema-valid." observation)
  (support/assert! (str/includes? (get-in observation [:custom :validation :warning]) "does not satisfy") "Invalid custom response warning is missing." observation)
  (support/assert! (true? (get-in observation [:custom :correction :operatorProvided])) "Kept custom override lacks operator provenance." observation))

(defn assert-raw-allowed-values! [observation]
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T18:43:52.436904247+02:00", :module-hash "-623728380", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "722711715"} {:id "defn/assert-expected-example!", :kind "defn", :line 6, :end-line 18, :hash "-1578852075"} {:id "defn/assert-inline-example!", :kind "defn", :line 20, :end-line 29, :hash "-772282266"} {:id "defn/assert-comment-example!", :kind "defn", :line 31, :end-line 39, :hash "687472998"} {:id "defn/assert-assistance!", :kind "defn", :line 41, :end-line 51, :hash "2087490166"} {:id "defn/assert-inline-delivery!", :kind "defn", :line 53, :end-line 64, :hash "-1390915191"} {:id "defn/assert-custom-override!", :kind "defn", :line 66, :end-line 69, :hash "1383021673"} {:id "defn/assert-raw-allowed-values!", :kind "defn", :line 71, :end-line 86, :hash "-2102938666"}]}
;; clj-mutate-manifest-end
