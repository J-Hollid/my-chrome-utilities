(ns acceptance.steps.local-rule-editing
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-local-rule-editing.feature"
   "features/data-layer-local-rule-editing-runtime.feature"])

(def entry-modes
  {"Page view revision 3 contains local rule Known page types at /page_type" :model
   "the built extension is running with production schema editor, validation, and persistence systems" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Local-rule editing model verification failed. "
   "node" "test/data-layer-local-rule-editing-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "LOCAL_RULE_EDITING_BROWSER_ADAPTER"
    :observation-key :localRuleEditing
    :runtime-error "Local-rule editing browser runtime failed."
    :missing-error "Local-rule editing browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert!
   (and (= ["page" "product"] (get-in observed [:opened :values]))
        (= "warning" (get-in observed [:opened :severity]))
        (get-in observed [:opened :enabled])
        (not (get-in observed [:opened :reusableMetadata]))
        (str/includes? (get-in observed [:opened :context]) "Local rule origin")
        (str/includes? (get-in observed [:opened :context]) "/page_type")
        (get-in observed [:opened :focused]))
   "The actual local-rule editor omitted configuration, origin, path, or focus."
   observed)
  (support/assert!
   (= {:storageUnchanged true :reopened ["page" "product"]}
      (:cancelled observed))
   "Cancelling an unsaved local edit did not restore the persisted configuration."
   observed)
  (support/assert!
   (and (= 3 (get-in observed [:saved :version]))
        (= ["page" "product"] (get-in observed [:saved :published]))
        (= ["page" "product" "checkout"] (get-in observed [:saved :draft]))
        (= 1 (get-in observed [:saved :index]))
        (str/includes? (last (get-in observed [:saved :pending])) "Edit Known page types at /page_type")
        (get-in observed [:saved :open])
        (zero? (:previewIssues observed)))
   "The production edit did not preserve publication, stable index, disclosure, or draft validation."
   observed)
  (support/assert!
   (and (str/includes? (get-in observed [:invalid :assistance]) "Correct the regular expression")
        (get-in observed [:invalid :button])
        (get-in observed [:invalid :storageUnchanged]))
   "Invalid local configuration changed storage or lacked inline assistance."
   observed)
  (support/assert!
   (= {:ruleLibrary "true" :reusableEditor true :name "Approved page names" :localDialog false}
      (:routed observed))
   "A reusable attachment did not route to its Rule Library editor."
   observed)
  observed)

(defn- validate-example! [_mode _example] true)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :local-rule-editing-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
