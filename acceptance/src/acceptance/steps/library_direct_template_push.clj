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
