(ns acceptance.steps.live-add-all-schema
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-live-add-all-schema.feature"
                    "features/data-layer-live-add-all-schema-runtime.feature"])
(def entry-modes {"one captured event is selected in the Live inspector" :model
                  "the built extension side panel is running with the production Live inspector and durable schema repository" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! []
  (support/cached-command-verification! model-verified? "Live Add all model failed. "
    "node" "test/data-layer-live-add-all-schema-test.mjs"))
(defn- observe! []
  (support/cached-browser-observation! browser-observation
    {:adapter-env "LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER"
     :observation-key :liveSchemaPropertyDeclaration
     :runtime-error "Live Add all browser check failed."
     :missing-error "Live Add all browser evidence is missing."}))
(defn- assert-runtime! [{:keys [actions bulk] :as observed}]
  (support/assert! (and (:addAllToSchema actions) (:reachable actions)
                        (get-in bulk [:cancel :visible]) (get-in bulk [:cancel :bothItems])
                        (get-in bulk [:cancel :destination]) (get-in bulk [:cancel :unchanged])
                        (get-in bulk [:escape :closed])
                        (get-in bulk [:confirm :keyboardFocus])
                        (= "number" (get-in bulk [:confirm :priceType]))
                        (= {:value 25 :selectionMethod "custom"} (get-in bulk [:confirm :priceExample]))
                        (= 3 (get-in bulk [:confirm :version]))
                        (get-in bulk [:confirm :workingDraft])
                        (= 1 (get-in bulk [:confirm :assignmentCount]))
                        (= 1 (get-in bulk [:confirm :ruleCount]))
                        (get-in bulk [:confirm :liveUsable]))
                   "The installed bulk review, input, durable draft, or Live return evidence is incomplete." observed)
  observed)
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :live-add-all-schema-mode
    verify-model! (fn [_ _] nil) observe! assert-runtime!))
