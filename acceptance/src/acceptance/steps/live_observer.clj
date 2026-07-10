(ns acceptance.steps.live-observer
  (:require [acceptance.steps.live-observer-support :as support]
            [acceptance.steps.live-observer-timeline :as timeline]
            [acceptance.steps.live-observer-workspace :as workspace]))

(def live-observer-wired? support/live-observer-wired?)

(def handlers
  (vec (concat workspace/handlers timeline/handlers)))

(defn live-step-covered? [text]
  (some #(re-matches (:pattern %) text) handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:42:41.504611467+02:00", :module-hash "1536717077", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1859800269"} {:id "def/live-observer-wired?", :kind "def", :line 6, :end-line nil, :hash "-244652764"} {:id "def/handlers", :kind "def", :line 8, :end-line nil, :hash "256583758"} {:id "defn/live-step-covered?", :kind "defn", :line 11, :end-line nil, :hash "748226166"}]}
;; clj-mutate-manifest-end
