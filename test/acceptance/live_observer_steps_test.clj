(ns acceptance.live-observer-steps-test
  (:require [acceptance.steps.live-observer :as live-observer]
            [clojure.string :as str]
            [clojure.test :refer [deftest is testing]]))

(deftest recognizes-live-observer-wiring
  (is (live-observer/live-observer-wired?
       "data-layer-views data-layer-view-live data-layer-panel-live live-session-summary live-source-statuses live-event-feed live-event-inspector pause-capture resume-capture"
       "dataLayerViewForNavigationKey recordLiveEvent selectLiveEvent renderLiveObserver")))

(deftest pauses-and-resumes-through-semantic-handlers
  (is (live-observer/live-step-covered? "the user pauses capture"))
  (is (live-observer/live-step-covered? "subsequent source events are appended to the same session")))

(def live-features
  ["features/data-layer-observer-workspace.feature"
   "features/data-layer-event-timeline.feature"])

(def shared-background
  #{"a repository for project <project_name>"
    "the project skeleton is inspected"
    "a data layer testing session is active"})

(defn- feature-steps [path]
  (->> (str/split-lines (slurp path))
       (keep #(second (re-matches #"\s*(?:Given|When|Then|And) (.+)" %)))
       (remove shared-background)))

(deftest every-live-observer-step-has-a-specific-handler
  (doseq [path live-features
          step (feature-steps path)]
    (testing (str path ": " step)
      (is (live-observer/live-step-covered? step)))))
