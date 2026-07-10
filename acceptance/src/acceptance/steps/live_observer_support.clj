(ns acceptance.steps.live-observer-support
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn live-observer-wired? [html source]
  (support/includes-all? (str html source)
                         ["data-layer-views" "data-layer-view-live"
                          "data-layer-panel-live" "live-session-summary"
                          "live-source-statuses" "live-event-feed"
                          "live-event-inspector" "pause-capture"
                          "resume-capture" "dataLayerViewForNavigationKey"
                          "recordLiveEvent" "selectLiveEvent" "renderLiveObserver"]))

(defn inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n"
                    (support/source-file root "src/data-layer-live-observer.ts") "\n"
                    (support/source-file root "src/data-layer-live-observer-ui.ts"))]
    (support/assert! (live-observer-wired? html source)
                     "Live observer UI and domain wiring is incomplete."
                     {})
    (assoc world
           :root root
           :live-html html
           :live-source source
           :commands-source (support/source-file root "src/commands.ts"))))

(defn value [example key]
  (support/require-example example key))

(defn integer-value [example key]
  (parse-long (value example key)))

(defn values [text]
  (support/split-list text #"\s*(?:,|\band\b)\s*"))

(defn assert-value! [actual expected message]
  (support/assert! (= expected actual) message {:expected expected :actual actual}))

(defn event [index name source-name]
  {:id (str "event-" index)
   :name name
   :source-id (-> source-name str/lower-case (str/replace #"[^a-z0-9]+" "-"))
   :source-kind "Data Layer"
   :source-name source-name
   :capture-time (format "10:48:%02d.100" index)
   :page-url "https://example.test/p/"
   :destination "event.history"
   :validation "Not checked"
   :payload "pageview-values"
   :raw-input "pageview-raw"
   :properties {:currency "EUR"}})

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:41:05.569837933+02:00", :module-hash "295540417", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1135847642"} {:id "defn/live-observer-wired?", :kind "defn", :line 5, :end-line nil, :hash "353379229"} {:id "defn/inspect", :kind "defn", :line 14, :end-line nil, :hash "866427177"} {:id "defn/value", :kind "defn", :line 29, :end-line nil, :hash "1659070196"} {:id "defn/integer-value", :kind "defn", :line 32, :end-line nil, :hash "-555205771"} {:id "defn/values", :kind "defn", :line 35, :end-line nil, :hash "1740732344"} {:id "defn/assert-value!", :kind "defn", :line 38, :end-line nil, :hash "-1812560737"} {:id "defn/event", :kind "defn", :line 41, :end-line nil, :hash "129805737"}]}
;; clj-mutate-manifest-end
