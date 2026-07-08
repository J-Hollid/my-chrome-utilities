(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.package-flow :as package-flow]
            [acceptance.steps.palette :as palette]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]))

(def handlers
  (vec (concat project-skeleton/handlers
               side-panel/handlers
               command-registry/handlers
               palette/handlers
               package-flow/handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T21:27:31.796596121+02:00", :module-hash "-1463953266", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1180779914"} {:id "def/handlers", :kind "def", :line 8, :end-line nil, :hash "628094739"}]}
;; clj-mutate-manifest-end
