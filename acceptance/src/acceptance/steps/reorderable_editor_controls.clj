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
                       :runtime006 :runtime007 :runtime008 :runtime009 :runtime010
                       :runtime011 :runtime012 :runtime013 :runtime014}]
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-20T22:16:04.68365407+02:00", :module-hash "-815749190", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "167272639"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-1102333271"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "-196712554"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "-1298017839"} {:id "defn-/observe-runtime!", :kind "defn-", :line 21, :end-line 27, :hash "-583642952"} {:id "def/authoritative-examples", :kind "def", :line 29, :end-line 30, :hash "1598887325"} {:id "defn-/validate-example!", :kind "defn-", :line 32, :end-line 35, :hash "-744296176"} {:id "defn-/assert-runtime!", :kind "defn-", :line 37, :end-line 45, :hash "373503095"} {:id "def/handlers", :kind "def", :line 47, :end-line 51, :hash "-1118891358"}]}
;; clj-mutate-manifest-end
