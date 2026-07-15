(ns acceptance.steps.library-direct-template-push
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-library-direct-template-push.feature"
   "features/data-layer-library-direct-template-push-runtime.feature"])

(def entry-modes
  {"the Library contains Purchase confirmation version 3 with event purchase and destination dataLayer" :model
   "the built extension side panel is running with the production Event Library, editor, selected-target push, and feedback controls" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Library direct-template-push model verification failed. "
   "npm" "run" "test:unit:event-library-editor"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER"
    :observation-key :libraryDirectTemplatePush
    :runtime-error "Library direct-template-push browser runtime failed."
    :missing-error "Library direct-template-push browser evidence is missing."}))

(defn- assert-runtime! [{:keys [closed productDraft purchaseDraft failures persistedUnchanged] :as observed}]
  (support/assert!
   (and (= ["dataLayer" "purchase" {:transaction_id "test-123"}] (:execution closed))
        (:editorHidden closed)
        (str/includes? (:feedback closed) "Purchase confirmation v3")
        (str/includes? (:feedback closed) "Signal Shop")
        (str/includes? (:feedback closed) "dataLayer"))
   "Library row Push did not execute the saved template with visible feedback." observed)
  (support/assert!
   (and (= ["dataLayer" "purchase" {:transaction_id "test-123"}] (:execution productDraft))
        (str/includes? (:title productDraft) "Product detail")
        (str/includes? (:json productDraft) "unsaved-sku"))
   "Direct push replaced the open Product detail draft." productDraft)
  (support/assert!
   (and (= ["dataLayer" "purchase" {:transaction_id "test-123"}] (:execution purchaseDraft))
        (str/includes? (:json purchaseDraft) "test-456")
        (get-in purchaseDraft [:review :open])
        (str/includes? (get-in purchaseDraft [:review :text]) "test-456"))
   "Saved push and Push draft no longer have separate payload boundaries." purchaseDraft)
  (support/assert!
   (and (= ["Select a target before pushing"
            "Request access for Signal Shop"
            "Push to Signal Shop failed"] failures)
        persistedUnchanged)
   "A blocked direct push mutated the template or lost actionable feedback." observed)
  observed)

(def model-example-values
  {"blocking_condition" #{"no selected target" "target permission is unavailable"
                           "destination is dataLayer[0]" "selected-page execution fails"}
   "failure_feedback" #{"Select a target before pushing" "Request access for Signal Shop"
                        "Invalid push destination path dataLayer[0]" "Push to Signal Shop failed"}})

(def runtime-example-values
  {"runtime_condition" #{"no selected target" "target access unavailable" "page injection failure"}
   "result" #{"Select a target before pushing" "Request access for Signal Shop" "Push to Signal Shop failed"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Library direct-template-push example was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :library-direct-template-push-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T20:03:10.087261523+02:00", :module-hash "-2058324604", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-532637742"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "435406357"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-994066123"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "-1308621383"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "-1953680931"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 54, :hash "574403304"} {:id "def/model-example-values", :kind "def", :line 56, :end-line 60, :hash "-976702252"} {:id "def/runtime-example-values", :kind "def", :line 62, :end-line 64, :hash "1849038551"} {:id "defn-/validate-example!", :kind "defn-", :line 66, :end-line 69, :hash "-1808099946"} {:id "def/handlers", :kind "def", :line 71, :end-line 74, :hash "-1736765218"}]}
;; clj-mutate-manifest-end
