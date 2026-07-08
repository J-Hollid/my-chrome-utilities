(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-session :as data-layer-session]
            [acceptance.steps.package-flow :as package-flow]
            [acceptance.steps.palette :as palette]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]))

(def handlers
  (vec (concat project-skeleton/handlers
               side-panel/handlers
               command-registry/handlers
               data-layer/handlers
               data-layer-session/handlers
               palette/handlers
               package-flow/handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T22:47:15.756122576+02:00", :module-hash "-409437904", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "63114136"} {:id "def/handlers", :kind "def", :line 10, :end-line nil, :hash "-1961368094"}]}
;; clj-mutate-manifest-end
