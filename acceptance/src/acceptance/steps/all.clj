(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-observer :as data-layer-observer]
            [acceptance.steps.data-layer-page-context :as data-layer-page-context]
            [acceptance.steps.data-layer-recovery :as data-layer-recovery]
            [acceptance.steps.data-layer-session :as data-layer-session]
            [acceptance.steps.data-layer-timeline :as data-layer-timeline]
            [acceptance.steps.hotkey-keymap :as hotkey-keymap]
            [acceptance.steps.package-flow :as package-flow]
            [acceptance.steps.palette :as palette]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]
            [acceptance.steps.workspace-editor :as workspace-editor]))

(def handlers
  (vec (concat project-skeleton/handlers
               side-panel/handlers
               command-registry/handlers
               data-layer/handlers
               data-layer-observer/handlers
               data-layer-page-context/handlers
               data-layer-recovery/handlers
               data-layer-session/handlers
               data-layer-timeline/handlers
               hotkey-keymap/handlers
               workspace-editor/handlers
               palette/handlers
               package-flow/handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T12:29:53.943126754+02:00", :module-hash "330337676", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1980205214"} {:id "def/handlers", :kind "def", :line 16, :end-line nil, :hash "1405333538"}]}
;; clj-mutate-manifest-end
