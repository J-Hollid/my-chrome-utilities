(ns acceptance.steps.live-observer
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [acceptance.steps.live-observer-support :as support]
            [acceptance.steps.live-observer-timeline :as timeline]
            [acceptance.steps.live-observer-workspace :as workspace]))

(def live-observer-wired? support/live-observer-wired?)

(def handlers
  (vec (concat workspace/handlers timeline/handlers)))

(defn live-step-covered? [text]
  (some #(re-matches (:pattern %) text) handlers))

(def ^:private live-observer-semantics-script
  (str "const live = await import(process.argv[1]);"
       "let state = live.createLiveObserverState({pageUrl: 'https://example.test/checkout', sources: [{id: 'history', name: 'Event history', status: 'Connected'}]});"
       "state = live.recordLiveEvent(state, {id: 'one', name: 'pageview', sourceId: 'history', captureTime: '2026-07-10T10:00:00Z'});"
       "const paused = live.recordLiveEvent(live.pauseCapture(state), {id: 'two', name: 'purchase', sourceId: 'history', captureTime: '2026-07-10T10:00:01Z'});"
       "const resumed = live.recordLiveEvent(live.resumeCapture(paused), {id: 'two', name: 'purchase', sourceId: 'history', captureTime: '2026-07-10T10:00:01Z'});"
       "const stacked = live.selectLiveEvent(resumed, 'two', 'stacked');"
       "const split = live.selectLiveEvent(resumed, 'two', 'split');"
       "if (paused.status !== 'Paused' || paused.events.length !== 1 || resumed.status !== 'Live' || resumed.events.length !== 2 || stacked.listVisible || !split.listVisible) process.exit(1);"))

(defn live-observer-semantics? [root]
  (zero? (:exit (process/shell {:out :string :err :string :continue true}
                                "node" "--input-type=module" "--eval" live-observer-semantics-script
                                (str (fs/path root "dist/data-layer-live-observer.js"))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:42:41.504611467+02:00", :module-hash "1536717077", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1859800269"} {:id "def/live-observer-wired?", :kind "def", :line 6, :end-line nil, :hash "-244652764"} {:id "def/handlers", :kind "def", :line 8, :end-line nil, :hash "256583758"} {:id "defn/live-step-covered?", :kind "defn", :line 11, :end-line nil, :hash "748226166"}]}
;; clj-mutate-manifest-end
