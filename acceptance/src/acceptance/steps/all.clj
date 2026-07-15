(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.canonical-declared-property-validation :as canonical-declared-property-validation]
            [acceptance.steps.allowed-value-expansion :as allowed-value-expansion]
            [acceptance.steps.conditional-validation-rules :as conditional-validation-rules]
            [acceptance.steps.cross-tab-reattachment :as cross-tab-reattachment]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-observer :as data-layer-observer]
            [acceptance.steps.data-layer-page-context :as data-layer-page-context]
            [acceptance.steps.data-layer-recovery :as data-layer-recovery]
            [acceptance.steps.data-layer-session :as data-layer-session]
            [acceptance.steps.data-layer-timeline :as data-layer-timeline]
            [acceptance.steps.defect-report :as defect-report]
            [acceptance.steps.defect-report-provenance-presentation :as defect-report-provenance-presentation]
            [acceptance.steps.event-occurrence-defect-report :as event-occurrence-defect-report]
            [acceptance.steps.defect-report-semantic-differences :as defect-report-semantic-differences]
            [acceptance.steps.defect-report-undeclared-property-removal :as defect-report-undeclared-property-removal]
            [acceptance.steps.required-property-defect-schema-choices :as required-property-defect-schema-choices]
            [acceptance.steps.defect-library :as defect-library]
            [acceptance.steps.event-library-editor :as event-library-editor]
            [acceptance.steps.event-feed-query :as event-feed-query]
            [acceptance.steps.fresh-live-session :as fresh-live-session]
            [acceptance.steps.guided-validation :as guided-validation]
            [acceptance.steps.guided-assignment-coverage :as guided-assignment-coverage]
            [acceptance.steps.guided-draft-continuation :as guided-draft-continuation]
            [acceptance.steps.guided-rule-parameter-integrity :as guided-rule-parameter-integrity]
            [acceptance.steps.hotkey-keymap :as hotkey-keymap]
            [acceptance.steps.information-architecture :as information-architecture]
            [acceptance.steps.live-observer :as live-observer]
            [acceptance.steps.live-event-presentation :as live-event-presentation]
            [acceptance.steps.live-guided-conditional-rules :as live-guided-conditional-rules]
            [acceptance.steps.lossless-observation-activation :as lossless-observation-activation]
            [acceptance.steps.local-rule-promotion :as local-rule-promotion]
            [acceptance.steps.local-rule-promotion-availability :as local-rule-promotion-availability]
            [acceptance.steps.missing-event-defect-report :as missing-event-defect-report]
            [acceptance.steps.missing-event-payload-hardening :as missing-event-payload-hardening]
            [acceptance.steps.missing-event-report-fidelity :as missing-event-report-fidelity]
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
            [acceptance.steps.schema-documentation :as schema-documentation]
            [acceptance.steps.schema-nested-path :as schema-nested-path]
            [acceptance.steps.schema-manual-property :as schema-manual-property]
            [acceptance.steps.schema-property-rule-picker :as schema-property-rule-picker]
            [acceptance.steps.schema-rule-property-identity :as schema-rule-property-identity]
            [acceptance.steps.schema-property-removal :as schema-property-removal]
            [acceptance.steps.schema-property-copy :as schema-property-copy]
            [acceptance.steps.schema-assignment-data-conditions :as schema-assignment-data-conditions]
            [acceptance.steps.schema-publication-refresh :as schema-publication-refresh]
            [acceptance.steps.schema-workspace-runtime :as schema-workspace-runtime]
            [acceptance.steps.session-boundaries :as session-boundaries]
            [acceptance.steps.sequence-replay :as sequence-replay]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.recursive-property-validation :as recursive-property-validation]
            [acceptance.steps.saved-event-feed-filters :as saved-event-feed-filters]
            [acceptance.steps.side-panel :as side-panel]
            [acceptance.steps.timeline-presentations :as timeline-presentations]
            [acceptance.steps.unified-defect-builder :as unified-defect-builder]
            [acceptance.steps.validation-presence-semantics :as validation-presence-semantics]
            [acceptance.steps.workspace-editor :as workspace-editor]))

(def handlers
  (vec (concat schema-assignment-data-conditions/handlers
               schema-property-copy/handlers
               event-occurrence-defect-report/handlers
               defect-report-provenance-presentation/handlers
               defect-report-semantic-differences/handlers
               required-property-defect-schema-choices/handlers
               defect-report-undeclared-property-removal/handlers
               canonical-declared-property-validation/handlers
               cross-tab-reattachment/handlers
               schema-rule-property-identity/handlers
               missing-event-report-fidelity/handlers
               missing-event-payload-hardening/handlers
               unified-defect-builder/handlers
               local-rule-promotion/handlers
               local-rule-promotion-availability/handlers
               live-guided-conditional-rules/handlers
               allowed-value-expansion/handlers
               schema-publication-refresh/handlers
               defect-library/handlers
               validation-presence-semantics/handlers
               missing-event-defect-report/handlers
               schema-documentation/handlers
               conditional-validation-rules/handlers
               guided-assignment-coverage/handlers
               fresh-live-session/handlers
               lossless-observation-activation/handlers
               recursive-property-validation/handlers
               saved-event-feed-filters/handlers
               saved-session-live-feed/handlers
               guided-draft-continuation/handlers
               guided-rule-parameter-integrity/handlers
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
               schema-property-removal/handlers
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
;; {:version 1, :tested-at "2026-07-15T11:53:02.460425089+02:00", :module-hash "1477061652", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 66, :hash "613018252"} {:id "def/handlers", :kind "def", :line 68, :end-line 135, :hash "607652789"}]}
;; clj-mutate-manifest-end
