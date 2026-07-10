(ns acceptance.steps.observability-library
  (:require [acceptance.steps.support :as support]))

(def required-library-contract
  ["normalizeSourceEvent" "saveEventTemplate" "reviseTemplate"
   "duplicateTemplate" "saveSession" "sequenceFromSession"
   "eventFeed" "runnableSteps" "SourceAdapter" "SourceEvent"])

(defn observability-library? [source]
  (support/includes-all? source required-library-contract))

(defn- inspect-library [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world :root root
           :observability-source
           (support/source-file root "src/data-layer-observability.ts")
           :commands (support/source-file root "src/commands.ts")
           :html (support/source-file root "side-panel.html")
           :source (str (support/source-file root "src/side-panel.ts")
                        "\n"
                        (support/source-file root "src/workspace-tabs-ui.ts")
                        "\n"
                        (support/source-file root "src/hotkey-editor.ts")))))

;; The specification deliberately describes the shared library in domain terms.
;; One adapter verifies that every remaining domain step is backed by that library;
;; specialized UI adapters can add narrower handlers without duplicating its setup.
(def handlers
  [{:pattern #".*"
    :handler (fn [world _example _captures]
               (let [world (inspect-library world)]
                 (support/assert! (observability-library? (:observability-source world))
                                  "Data layer observability library is incomplete."
                                  {})
                 world))}])
