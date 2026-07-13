(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-observer :as data-layer-observer]
            [acceptance.steps.data-layer-page-context :as data-layer-page-context]
            [acceptance.steps.data-layer-recovery :as data-layer-recovery]
            [acceptance.steps.data-layer-session :as data-layer-session]
            [acceptance.steps.data-layer-timeline :as data-layer-timeline]
            [acceptance.steps.defect-report :as defect-report]
            [acceptance.steps.event-library-editor :as event-library-editor]
            [acceptance.steps.event-feed-query :as event-feed-query]
            [acceptance.steps.guided-validation :as guided-validation]
            [acceptance.steps.guided-draft-continuation :as guided-draft-continuation]
            [acceptance.steps.hotkey-keymap :as hotkey-keymap]
            [acceptance.steps.information-architecture :as information-architecture]
            [acceptance.steps.live-observer :as live-observer]
            [acceptance.steps.live-event-presentation :as live-event-presentation]
            [acceptance.steps.live-validation-visuals :as live-validation-visuals]
            [acceptance.steps.observability-library :as observability-library]
            [acceptance.steps.observation-targets :as observation-targets]
            [acceptance.steps.operator-interface :as operator-interface]
            [acceptance.steps.package-flow :as package-flow]
            [acceptance.steps.palette :as palette]
            [acceptance.steps.saved-sessions :as saved-sessions]
            [acceptance.steps.saved-session-live-feed :as saved-session-live-feed]
            [acceptance.steps.schema-verification :as schema-verification]
            [acceptance.steps.schema-revision-lifecycle :as schema-revision-lifecycle]
            [acceptance.steps.schema-nested-path :as schema-nested-path]
            [acceptance.steps.schema-manual-property :as schema-manual-property]
            [acceptance.steps.schema-property-rule-picker :as schema-property-rule-picker]
            [acceptance.steps.schema-workspace-runtime :as schema-workspace-runtime]
            [acceptance.steps.session-boundaries :as session-boundaries]
            [acceptance.steps.sequence-replay :as sequence-replay]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]
            [acceptance.steps.timeline-presentations :as timeline-presentations]
            [acceptance.steps.workspace-editor :as workspace-editor]))

(def handlers
  (vec (concat saved-session-live-feed/handlers
               guided-draft-continuation/handlers
               project-skeleton/handlers
               observation-targets/priority-handlers
               observation-targets/handlers
               side-panel/handlers
               command-registry/handlers
               information-architecture/handlers
               data-layer/handlers
               data-layer-observer/handlers
               data-layer-page-context/handlers
               data-layer-recovery/handlers
               data-layer-session/handlers
               live-observer/handlers
               live-event-presentation/handlers
               live-validation-visuals/handlers
               event-feed-query/handlers
               defect-report/handlers
               data-layer-timeline/handlers
               timeline-presentations/handlers
               event-library-editor/handlers
               guided-validation/handlers
               hotkey-keymap/handlers
               workspace-editor/handlers
               saved-sessions/handlers
               schema-nested-path/handlers
               schema-manual-property/handlers
               schema-property-rule-picker/handlers
               schema-revision-lifecycle/handlers
               schema-verification/handlers
               schema-workspace-runtime/handlers
               session-boundaries/handlers
               sequence-replay/handlers
               operator-interface/priority-handlers
               palette/handlers
               package-flow/handlers
               observability-library/handlers
               operator-interface/regular-handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T00:33:50.827214703+02:00", :module-hash "-657490589", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1726694246"} {:id "def/handlers", :kind "def", :line 35, :end-line nil, :hash "1045614645"}]}
;; clj-mutate-manifest-end
