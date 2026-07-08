(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]))

(def handlers
  (vec (concat project-skeleton/handlers
               side-panel/handlers
               command-registry/handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T20:56:39.111937596+02:00", :module-hash "1128056340", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "863544390"} {:id "def/handlers", :kind "def", :line 6, :end-line nil, :hash "-1219293908"}]}
;; clj-mutate-manifest-end
