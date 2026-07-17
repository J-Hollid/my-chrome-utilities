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
        (zero? (get-in observed [:published :workingDrafts])))
   "Atomic sync did not publish exactly one revision per affected schema or retain history."
   observed)
  (support/assert!
   (and (str/includes? (get-in observed [:blocked :summary]) "Publish or discard the Product detail draft first")
        (get-in observed [:blocked :disabled])
        (= ["Unrelated"] (get-in observed [:blocked :draft])))
   "An existing working draft was not blocked and preserved."
   observed)
  observed)

(defn- validate-example! [_mode _example] true)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :reusable-rule-sync-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
