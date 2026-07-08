(ns acceptance.steps.all
  (:require [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]))

(def handlers
  (vec (concat project-skeleton/handlers
               side-panel/handlers)))
