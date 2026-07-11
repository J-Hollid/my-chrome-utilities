(ns acceptance.steps.operator-interface
  (:require [acceptance.steps.operator-interface-support :as operator-support]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-library-operator-layout.feature"
   "features/data-layer-live-operator-layout.feature"
   "features/data-layer-live-session-summary.feature"
   "features/data-layer-live-session-end-status-runtime.feature"
   "features/data-layer-target-path-status-runtime.feature"
   "features/data-layer-live-guided-workflow.feature"
   "features/data-layer-captured-event-template-workflow.feature"
   "features/data-layer-detail-view-headers.feature"
   "features/data-layer-event-property-form-layout.feature"
   "features/data-layer-live-inspector-actions.feature"
   "features/data-layer-live-inspector-layout.feature"
   "features/data-layer-live-inspector-navigation.feature"
   "features/data-layer-live-inspector-action-runtime.feature"
   "features/data-layer-live-inspector-layout-runtime.feature"
   "features/data-layer-live-inspector-navigation-runtime.feature"
   "features/data-layer-observation-target-picker-dialog.feature"
   "features/data-layer-push-destination-configuration.feature"
   "features/data-layer-same-page-session-restart-runtime.feature"
   "features/data-layer-selected-target-push-runtime.feature"
   "features/data-layer-schemas-operator-layout.feature"
   "features/data-layer-sessions-operator-layout.feature"
   "features/side-panel-hotkey-operator-layout.feature"
   "features/side-panel-inclusive-interaction.feature"
   "features/side-panel-action-hierarchy.feature"
   "features/side-panel-responsive-navigation-shell.feature"
   "features/side-panel-visual-regression-coverage.feature"
   "features/side-panel-visual-system.feature"
   "features/data-layer-event-feed-summaries.feature"
   "features/data-layer-live-pathname-visits.feature"
   "features/data-layer-authoritative-live-state.feature"
   "features/side-panel-action-feedback.feature"
   "features/data-layer-push-draft-review.feature"
   "features/data-layer-state-aware-actions.feature"])

(defn operator-shell-wired? [root]
  (let [html (support/source-file root "side-panel.html")
        css (support/source-file root "side-panel.css")
        build (support/source-file root "scripts/build.mjs")]
    (and (support/includes-all? html ["side-panel.css" "workspace-tabs" "data-layer-views"
                                      "sequence-library" "schema-list"])
         (support/includes-all? css ["prefers-reduced-motion" "focus-visible" "min-height:44px"
                                     "overflow-x:hidden" "@media (min-width:700px)" "--danger"
                                     "operator-metadata"])
         (str/includes? build "side-panel.css"))))

(def operator-step-specs
  (support/feature-step-specs
   feature-files
   #{"a repository for project <project_name>"}))

(defn- observe [world text example]
  (support/record-semantic-observation
   world :operator-action :operator-observations
   "shared operator action" text example))

(defn- transition [world example captures {:keys [keyword text]}]
  (let [example (operator-support/validate-example!
                 example
                 (support/capture-placeholder-keys captures))
        world (update world :operator-history (fnil conj []) text)]
    (case keyword
      "Given" (update world :operator-context (fnil conj []) {:text text :example example})
      "When" (assoc world :operator-action {:text text :example example})
      "Then" (observe world text example)
      "And" (observe (update world :operator-context (fnil conj [])
                             {:text text :example example})
                     text
                     example))))

(def handlers
  (support/semantic-handlers operator-step-specs transition))

(def priority-handler-texts #{"the command palette closes"})
(def priority-handlers
  (mapv #(assoc % :applies? (fn [world] (contains? world :operator-action)))
        (filter (fn [{:keys [pattern]}]
                  (some #(re-matches pattern %) priority-handler-texts))
                handlers)))
(def regular-handlers
  (filterv (fn [{:keys [pattern]}]
             (not-any? #(re-matches pattern %) priority-handler-texts))
           handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-11T11:11:19.198919378+02:00", :module-hash "-328763286", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1043150245"} {:id "def/feature-files", :kind "def", :line 6, :end-line nil, :hash "-706696352"} {:id "defn/operator-shell-wired?", :kind "defn", :line 27, :end-line nil, :hash "-2106232492"} {:id "def/operator-step-specs", :kind "def", :line 38, :end-line nil, :hash "-359605785"} {:id "defn-/observe", :kind "defn-", :line 43, :end-line nil, :hash "-943567860"} {:id "defn-/transition", :kind "defn-", :line 48, :end-line nil, :hash "908273079"} {:id "def/handlers", :kind "def", :line 62, :end-line nil, :hash "-454832"} {:id "def/priority-handler-texts", :kind "def", :line 65, :end-line nil, :hash "-1899796755"} {:id "def/priority-handlers", :kind "def", :line 66, :end-line nil, :hash "722779883"} {:id "def/regular-handlers", :kind "def", :line 71, :end-line nil, :hash "1875904922"}]}
;; clj-mutate-manifest-end
