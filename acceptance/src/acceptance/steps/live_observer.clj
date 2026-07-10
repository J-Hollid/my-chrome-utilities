(ns acceptance.steps.live-observer
  (:require [acceptance.steps.live-observer-support :as support]
            [acceptance.steps.live-observer-timeline :as timeline]
            [acceptance.steps.live-observer-workspace :as workspace]
            [acceptance.steps.observation-targets-support :as target-support]))

(def live-observer-wired? support/live-observer-wired?)

(def handlers
  (vec (concat
        [{:pattern #"^the selected target page is shown once above the event feed$"
          :handler (fn [world example _]
                     (target-support/validate-all-example-values! example)
                     (assoc world :selected-target-page-context :shown-once))}]
        workspace/handlers timeline/handlers)))

(defn live-step-covered? [text]
  (some #(re-matches (:pattern %) text) handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T19:23:07.495567587+02:00", :module-hash "-2017437692", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1000800029"} {:id "def/live-observer-wired?", :kind "def", :line 7, :end-line nil, :hash "-244652764"} {:id "def/handlers", :kind "def", :line 9, :end-line nil, :hash "2088242981"} {:id "defn/live-step-covered?", :kind "defn", :line 17, :end-line nil, :hash "748226166"}]}
;; clj-mutate-manifest-end
