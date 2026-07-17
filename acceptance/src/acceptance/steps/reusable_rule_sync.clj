(ns acceptance.steps.reusable-rule-sync
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-reusable-rule-sync-publication.feature"
   "features/data-layer-reusable-rule-sync-publication-runtime.feature"])

(def entry-modes
  {"reusable rule Approved page types revision 1 is attached to current Page view revision 3 and Product detail revision 5" :model
   "the built extension is running with production Rule Library, schema revision, validation, and persistence systems" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Reusable-rule sync model verification failed. "
   "node" "test/data-layer-reusable-rule-sync-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "REUSABLE_RULE_SYNC_BROWSER_ADAPTER"
    :observation-key :reusableRuleSync
    :runtime-error "Reusable-rule sync browser runtime failed."
    :missing-error "Reusable-rule sync browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert!
   (= {:schemasUnchanged true
       :version 2
       :values ["page" "product" "checkout"]
       :action true}
      (:saved observed))
   "Saving the reusable revision through the Rule Library changed schemas or omitted sync."
   observed)
  (support/assert!
   (and (str/includes? (get-in observed [:review :summary]) "2 schemas and 3 attachments")
        (str/includes? (get-in observed [:review :summary]) "Page view revision 3 to 4")
        (str/includes? (get-in observed [:review :summary]) "Product detail revision 5 to 6")
        (not (get-in observed [:review :confirmDisabled]))
        (get-in observed [:review :cancelled]))
   "The production sync review omitted affected revisions, attachments, or cancel isolation."
   observed)
  (support/assert!
   (and (get-in observed [:failure :unchanged])
        (str/includes? (get-in observed [:failure :message]) "No schema revision was published"))
   "A production persistence failure left a partial schema publication."
   observed)
  (support/assert!
   (and (= [4 6 7] (get-in observed [:published :versions]))
        (= [["reusable-51" 2] ["reusable-51" 2]] (get-in observed [:published :pageRules]))
        (= [["reusable-51" 2]] (get-in observed [:published :productRules]))
        (= [[1 1] [1]] (get-in observed [:published :historical]))
        (= ["page" "product" "checkout"] (get-in observed [:published :values]))
        (zero? (get-in observed [:published :workingDrafts]))
        (get-in observed [:published :actionRemoved]))
   "Atomic sync did not publish exactly one revision per affected schema or retain history."
   observed)
  (support/assert!
   (and (str/includes? (get-in observed [:blocked :summary]) "Publish or discard the Product detail draft first")
        (get-in observed [:blocked :disabled])
        (= ["Unrelated"] (get-in observed [:blocked :draft])))
   "An existing working draft was not blocked and preserved."
   observed)
  observed)

(def model-example-values
  {"completion_event" #{"the operator cancels" "publication fails" "confirmation succeeds"}
   "schema_outcome" #{"all attached schemas remain at their current revisions"
                      "no attached schema receives a partial new revision"
                      "all reviewed schema revisions are published"}})

(def runtime-example-values
  {"sync_condition" #{"Product detail has an existing working draft"
                      "Product detail revision publication fails"
                      "the operator cancels"}
   "storage_outcome" #{"its complete pre-sync snapshot" "every schema pre-sync snapshot"}
   "operator_outcome" #{"Publish or discard the Product detail draft first"
                        "no schema revision was published"
                        "sync review closed without publication"}})

(def model-example-relations
  [{:keys ["completion_event" "schema_outcome"]
    :rows #{["the operator cancels" "all attached schemas remain at their current revisions"]
            ["publication fails" "no attached schema receives a partial new revision"]
            ["confirmation succeeds" "all reviewed schema revisions are published"]}}])

(def runtime-example-relations
  [{:keys ["sync_condition" "storage_outcome" "operator_outcome"]
    :rows #{["Product detail has an existing working draft" "its complete pre-sync snapshot"
             "Publish or discard the Product detail draft first"]
            ["Product detail revision publication fails" "every schema pre-sync snapshot"
             "no schema revision was published"]
            ["the operator cancels" "every schema pre-sync snapshot"
             "sync review closed without publication"]}}])

(defn- validate-example! [mode example]
  (support/validate-mode-example!
   mode runtime-example-values model-example-values
   runtime-example-relations model-example-relations example
   "Reusable-rule sync example value is outside the approved domain."
   "Reusable-rule sync example columns describe an invalid outcome."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :reusable-rule-sync-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T22:11:44.917276047+02:00", :module-hash "-1123328942", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1025312596"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "267609753"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "1707599729"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "-140620088"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "363678761"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 68, :hash "1075710315"} {:id "def/model-example-values", :kind "def", :line 70, :end-line 74, :hash "-205344117"} {:id "def/runtime-example-values", :kind "def", :line 76, :end-line 83, :hash "-106933932"} {:id "def/model-example-relations", :kind "def", :line 85, :end-line 89, :hash "-119031623"} {:id "def/runtime-example-relations", :kind "def", :line 91, :end-line 98, :hash "1349924925"} {:id "defn-/validate-example!", :kind "defn-", :line 100, :end-line 105, :hash "1099846745"} {:id "def/handlers", :kind "def", :line 107, :end-line 110, :hash "864598032"}]}
;; clj-mutate-manifest-end
