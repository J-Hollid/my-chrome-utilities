(ns acceptance.steps.reorderable-editor-controls
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-compact-reorderable-editor-controls.feature"
   "features/data-layer-compact-reorderable-editor-controls-runtime.feature"])

(def entry-modes
  {"an ordered editor contains uniquely identified items with existing selection, editing, validation, and save rules" :model
   "the built extension is running with production editor, repository, history, pointer, keyboard, and accessibility adapters" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Reorderable editor model verification failed. "
   "node" "test/reorderable-editor-model-test.mjs"))

(defn- observe-runtime! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER"
    :observation-key :reorderableEditorControls
    :runtime-error "Reorderable editor installed-browser verification failed."
    :missing-error "Reorderable editor installed-browser evidence is missing."}))

(def authoritative-examples
  (support/authoritative-feature-examples feature-files))

(defn- validate-example! [_mode example]
  (support/validate-authoritative-example!
   authoritative-examples example
   "Reorderable editor example was outside the authoritative feature contract."))

(defn- assert-runtime! [observed]
  (let [runtime-keys #{:runtime001 :runtime002 :runtime003 :runtime004 :runtime005
                       :runtime006 :runtime007 :runtime008 :runtime009}]
    (support/assert!
     (and (= (conj runtime-keys :installedBoundary) (set (keys observed)))
          (true? (:installedBoundary observed))
          (every? #(support/all-values-true? (get observed %)) runtime-keys))
     "Reorderable editor installed production evidence is incomplete."
     {:observed observed})))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :reorderable-editor-mode
   verify-model! validate-example!
   observe-runtime! assert-runtime!))
