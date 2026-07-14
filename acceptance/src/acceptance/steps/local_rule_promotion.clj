(ns acceptance.steps.local-rule-promotion
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-local-rule-promotion.feature"
   "features/data-layer-local-rule-promotion-runtime.feature"])

(def entry-modes
  {"Page view revision 3 has an open working draft in the schema editor" :model
   "the built extension is running with production schema editor, Rule Library, validation, and persistence systems" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Local-rule promotion model verification failed. "
   "node" "test/data-layer-local-rule-promotion-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "LOCAL_RULE_PROMOTION_BROWSER_ADAPTER"
    :observation-key :localRulePromotion
    :runtime-error "Local-rule promotion browser runtime failed."
    :missing-error "Local-rule promotion browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert! (= [1 0 0 "local-41"]
                      ((juxt :localCount :reusableCount :inheritedCount :focused)
                       (:initial observed)))
                   "Production origin resolution exposed promotion outside the exact local attachment row."
                   observed)
  (support/assert! (and (str/includes? (get-in observed [:review :observation :summary]) "Page view revision 3 working draft")
                        (str/includes? (get-in observed [:review :observation :summary]) "/page_type")
                        (str/includes? (get-in observed [:review :observation :summary]) "local-41")
                        (str/includes? (get-in observed [:review :observation :configuration]) "string product")
                        (str/includes? (get-in observed [:review :observation :configuration]) "severity warning")
                        (= "local-rule-promotion-heading" (get-in observed [:review :observation :focus]))
                        (get-in observed [:review :observation :required])
                        (get-in observed [:review :observation :withinWidth]))
                   "The focused review omitted stable source identity, retained configuration, or 320px containment."
                   observed)
  (support/assert! (= {:focus "local-41" :open true :scroll 47}
                      (get-in observed [:review :cancelled]))
                   "Cancel did not restore the originating action, disclosure, and scroll position."
                   observed)
  (support/assert! (every? #(and (:unchanged %) (:local %) (zero? (:rules %))
                                 (str/includes? (:assistance %) "simulated persistence failure"))
                           (:failures observed))
                   "A reusable-rule or schema-draft save failure left partial storage or UI state."
                   observed)
  (support/assert! (= ["local-40" "reusable-51" "local-42"]
                      (get-in observed [:beforePublish :ids]))
                   "Promotion did not replace the stable local identity at the original attachment index."
                   observed)
  (support/assert! (and (= "reusable-51" (get-in observed [:beforePublish :rule :id]))
                        (= 1 (get-in observed [:beforePublish :rule :version]))
                        (= ["product" "content"] (get-in observed [:beforePublish :rule :allowedValues]))
                        (= "warning" (get-in observed [:beforePublish :rule :severity]))
                        (= "Use a known page type" (get-in observed [:beforePublish :rule :message]))
                        (= ["Document page ownership"
                            "Promote local rule local-41 to reusable rule reusable-51"]
                           (get-in observed [:beforePublish :pending]))
                        (= "local-41" (get-in observed [:beforePublish :publishedId])))
                   "The saved reusable revision lost configuration, pending identity evidence, or published isolation."
                   observed)
  (support/assert! (and (= "reusable-51" (get-in observed [:beforePublish :focus]))
                        (get-in observed [:beforePublish :open])
                        (= 47 (get-in observed [:beforePublish :scroll]))
                        (get-in observed [:beforePublish :noHorizontal]))
                   "Success did not restore the replacement attachment and constrained editor presentation."
                   observed)
  (support/assert! (= {:version 4 :currentId "reusable-51" :historicalId "local-41" :otherIds []}
                      (:afterPublish observed))
                   "Publication mixed current reusable attribution, historical local attribution, or other schemas."
                   observed)
  (support/assert! (= {:rules [["reusable-51" 1]]
                       :attachments [["local-40" 1] ["reusable-51" 1] ["local-42" 1]]}
                      (:reloaded observed))
                   "Reload did not preserve one reusable revision and the exact replacement order."
                   observed)
  observed)

(def example-values
  {"rule_origin" #{"local to the working draft" "reusable Rule Library attachment" "active inherited rule" "disabled inherited rule" "historical published revision rule"}
   "action_state" #{"available" "absent"}
   "configuration" #{"typed Allowed values containing number 1" "Numeric range from 0 through 100" "Required applying only when /page_type Equals product" "disabled Regular expression beginning with SKU-"}
   "accepted_value" #{"number 1" "number 50" "string SKU-1" "string OTHER"}
   "rejected_value" #{"string 1" "number 101" "missing value" "string OTHER"}
   "rejected_result" #{"Failed" "Not applicable"}
   "candidate_name" #{"blank" "Approved page types" "Consumer page types"}
   "confirmation_state" #{"blocked" "available"}
   "assistance" #{"Enter a reusable rule name" "Open or use the existing differently defined rule" "Review and confirm promotion"}
   "completion_event" #{"the operator cancels" "saving the reusable rule fails" "saving the schema draft fails" "confirmation succeeds"}
   "schema_outcome" #{"the local attachment remains unchanged" "one reusable attachment replaces local"}
   "library_outcome" #{"no reusable rule is created" "no partial reusable rule remains" "one reusable revision is saved"}
   "resolved_origin" #{"local stable id absent from library" "reusable stable id present in library" "inherited stable id from parent"}
   "promotion_control_count" #{"1" "0"}
   "source_configuration" #{"number Allowed values containing 1" "warning with issue message Use a known page type" "condition /site Equals consumer" "disabled Regular expression beginning with SKU-"}
   "retained_configuration" #{"number parameter 1 distinct from string parameter 1" "warning and issue message" "complete condition group" "disabled attachment state"}
   "evaluation_equivalence" #{"identical for number 1 and string 1" "identical issue severity and message" "identical applicable and skipped states" "Not applicable in both states"}
   "library_state" #{"semantically equivalent reusable-50 revision 2" "same normalized name with a different definition"}
   "review_outcome" #{"equivalent revision 2 is recommended" "duplicate-definition warning" "conflicting existing rule is identified"}
   "selected_action" #{"use existing reusable rule" "create Consumer page types" "blocked confirmation"}
   "persistence_outcome" #{"attach reusable-50 revision 2 without creation" "create one distinct revision 1" "no storage mutation"}
   "failure_point" #{"reusable-rule save" "schema working-draft save"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Local-rule promotion example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :local-rule-promotion-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T20:36:48.378744606+02:00", :module-hash "639211678", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1497160872"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-214841804"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "1185159144"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "78750384"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-1751960169"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 85, :hash "-798774580"} {:id "def/example-values", :kind "def", :line 87, :end-line 109, :hash "-1784017255"} {:id "defn-/validate-example!", :kind "defn-", :line 111, :end-line 114, :hash "-129864397"} {:id "def/handlers", :kind "def", :line 116, :end-line 119, :hash "-2073274511"}]}
;; clj-mutate-manifest-end
