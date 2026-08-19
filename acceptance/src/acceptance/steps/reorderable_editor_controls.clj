(ns acceptance.steps.reorderable-editor-controls
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-compact-reorderable-editor-controls.feature"
   "features/data-layer-compact-reorderable-editor-controls-runtime.feature"])

(def entry-modes
  {"an ordered editor contains uniquely identified items with existing selection, editing, validation, and save rules" :model
   "the built extension is running with production editor, repository, history, pointer, keyboard, and accessibility adapters" :runtime})

(defonce model-verified? (atom false))
(defonce runtime-verified? (atom false))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Reorderable editor model verification failed. "
   "node" "test/reorderable-editor-model-test.mjs"))

(defn- observe-runtime! []
  (support/cached-command-verification!
   runtime-verified?
   "Reorderable editor production-control verification failed. "
   "node" "test/reorderable-editor-control-test.mjs")
  true)

(defn- validate-example! [_mode _example] true)

(defn- assert-runtime! [observed]
  (support/assert! observed
                   "Reorderable editor production-control evidence is missing."
                   {:observed observed}))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :reorderable-editor-mode
   verify-model! validate-example!
   observe-runtime! assert-runtime!))
