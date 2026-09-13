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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-12T23:33:00.223475975+02:00", :module-hash "1761011794", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "616157902"} {:id "def/feature-files", :kind "def", :line 4, :end-line 5, :hash "-124119188"} {:id "def/entry-modes", :kind "def", :line 6, :end-line 7, :hash "809430760"} {:id "form/3/defonce", :kind "defonce", :line 8, :end-line 8, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 9, :end-line 9, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 10, :end-line 12, :hash "-481711486"} {:id "defn-/observe!", :kind "defn-", :line 13, :end-line 18, :hash "1016840262"} {:id "defn-/assert-runtime!", :kind "defn-", :line 19, :end-line 33, :hash "2055243988"} {:id "def/handlers", :kind "def", :line 34, :end-line 36, :hash "-1182342956"}]}
;; clj-mutate-manifest-end
