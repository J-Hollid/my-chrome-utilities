(ns acceptance.steps.all
  (:require [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.project-skeleton :as project-skeleton]
            [acceptance.steps.side-panel :as side-panel]))

(def handlers
  (vec (concat project-skeleton/handlers
               side-panel/handlers
               command-registry/handlers)))
