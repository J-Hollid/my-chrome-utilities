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

(defn- saved-local-rule-evidence? [observed]
  (let [saved (:saved observed)]
    (and (= 3 (:version saved))
         (= ["page" "product"] (:published saved))
         (= ["page" "product" "checkout"] (:draft saved))
         (= ["page" "product" "checkout"] (:first saved))
         (= ["page" "product" "checkout"] (:rendered saved))
         (= {:ruleId "local-41"
             :ruleCount 1
             :propertyPath "/page_type"
             :operator "allowed-values"}
            (select-keys saved [:ruleId :ruleCount :propertyPath :operator]))
         (= ["Edit Known page types at /page_type"] (:pending saved))
         (:open saved)
         (zero? (:previewIssues observed)))))

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
   (saved-local-rule-evidence? observed)
   "The production edit did not preserve publication, stable rule identity, disclosure, or draft validation."
   observed)
  (support/assert!
   (and (str/includes? (get-in observed [:invalid :assistance]) "Correct the regular expression")
        (get-in observed [:invalid :button])
        (get-in observed [:invalid :storageUnchanged]))
   "Invalid local configuration changed storage or lacked inline assistance."
   observed)
  (support/assert!
   (and (= {:ruleLibrary "true"
            :reusableEditor true
            :name "Approved page names"
            :localDialog false}
           (select-keys (:routed observed)
                        [:ruleLibrary :reusableEditor :name :localDialog]))
        (= {:storageUnchanged true
            :pending []
            :busy "false"
            :controlsEnabled true}
           (get-in observed [:routed :selection])))
   "A reusable attachment did not route to a settled Rule Library editor without mutating schema storage."
   observed)
  observed)

(def model-example-values
  {"configuration" #{"page, product, and checkout" "malformed regular expression ["}
   "completion" #{"cancelling" "saving the changes"}
   "edit_outcome" #{"the local rule configuration closes"
                    "saving is blocked with Correct the regular expression"}})

(def runtime-example-values
  {"configuration" #{"page, product, and checkout" "malformed regular expression ["}
   "completion" #{"Cancel" "Save"}
   "stored_outcome" #{"the original local-41 bytes"}
   "editor_outcome" #{"the original local-41 values after reopen"
                      "an inline configuration error"}})

(def model-example-relations
  [{:keys ["configuration" "completion" "edit_outcome"]
    :rows #{["page, product, and checkout" "cancelling"
             "the local rule configuration closes"]
            ["malformed regular expression [" "saving the changes"
             "saving is blocked with Correct the regular expression"]}}])

(def runtime-example-relations
  [{:keys ["configuration" "completion" "stored_outcome" "editor_outcome"]
    :rows #{["page, product, and checkout" "Cancel" "the original local-41 bytes"
             "the original local-41 values after reopen"]
            ["malformed regular expression [" "Save" "the original local-41 bytes"
             "an inline configuration error"]}}])

(defn- validate-example! [mode example]
  (support/validate-mode-example!
   mode runtime-example-values model-example-values
   runtime-example-relations model-example-relations example
   "Local-rule editing example value is outside the approved domain."
   "Local-rule editing example columns describe an invalid outcome."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :local-rule-editing-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T22:11:32.767430692+02:00", :module-hash "1723984566", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1650328402"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "2140370331"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1371427864"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "-1281546331"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "48590523"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 67, :hash "-1907042657"} {:id "def/model-example-values", :kind "def", :line 69, :end-line 73, :hash "1300271512"} {:id "def/runtime-example-values", :kind "def", :line 75, :end-line 80, :hash "2028988887"} {:id "def/model-example-relations", :kind "def", :line 82, :end-line 87, :hash "-296906662"} {:id "def/runtime-example-relations", :kind "def", :line 89, :end-line 94, :hash "-1189179539"} {:id "defn-/validate-example!", :kind "defn-", :line 96, :end-line 101, :hash "-179203150"} {:id "def/handlers", :kind "def", :line 103, :end-line 106, :hash "-699662843"}]}
;; clj-mutate-manifest-end
