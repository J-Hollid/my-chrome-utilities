(ns acceptance.steps.schema-editor-reachability
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-side-panel-schema-editor-reachability.feature"
   "features/data-layer-side-panel-schema-editor-reachability-runtime.feature"])

(def entry-modes
  {"Shop is the active project" :model
   "the built extension is running with production Schema Library and compact editor adapters" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema editor reachability model verification failed. "
   "node" "test/data-layer-installed/schema-editor-reachability-test.mjs"))

(defn- observe-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/browser-packs/side-panel-schema-editor-reachability.mjs"]
    :observation-key :schemaEditorReachability
    :runtime-error "Schema editor reachability browser verification failed."
    :missing-error "Schema editor reachability browser evidence is missing."}))

(defn- assert-runtime! [evidence]
  (let [complete? (and (= #{:rows :restoration} (set (keys evidence)))
                       (every? true? (vals evidence)))
        observed {:browser-passed complete? :acceptance-evidence-visible true}]
    (support/assert! complete?
                     "Installed Schema editor reachability evidence is incomplete."
                     evidence)
    (causal-regression/emit!
     :schema-editor-shared-session-evidence observed
     {:id "schema-editor-shared-session-evidence-v1"
      :causal-category "other:schema browser session evidence projection"
      :input {:browser-task "browser:test/browser-packs/side-panel-schema-editor-reachability.mjs"
              :acceptance-task "acceptance-session:schemas"}
      :expected-pre-repair-failure
      {:browser-passed true :acceptance-evidence-visible false}
      :expected-repair-result
      {:browser-passed true :acceptance-evidence-visible true}})))

(def authoritative-examples
  (support/authoritative-feature-examples feature-files))

(defn- validate-example! [_mode example]
  (support/validate-authoritative-example!
   authoritative-examples example
   "Schema editor reachability example is outside the approved contract."))

(defn- narrow-action-pattern [spec handler]
  (if (= "the operator activates <schema_open_action>" (:text spec))
    (assoc handler :pattern
           #"^the operator activates (<schema_open_action>|Create schema|Open Saved schema|Open project contributor)$")
    handler))

(def handlers
  (let [specs (support/feature-step-specs feature-files #{})
        generated (support/feature-scoped-stateful-handlers
                   feature-files #(contains? entry-modes %) :schema-editor-reachability-mode
                   (fn [world example _captures {:keys [text]}]
                     (support/mode-transition
                      world example text entry-modes :schema-editor-reachability-mode
                      verify-model! validate-example!
                      #(assert-runtime! (observe-browser!)))))]
    (mapv narrow-action-pattern specs generated)))
