(ns acceptance.steps.data-layer-page-context
  (:require [acceptance.source-inspection.capture :as capture-wiring]
            [acceptance.steps.data-layer-observer :as observer]
            [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.observation-targets-support :as target-support]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn open-side-panel [state side-panel-url]
  (assoc state :side-panel-url side-panel-url))

(defn set-active-tab-url [state page-url]
  (assoc state :active-tab {:tab-id "active-tab" :url page-url}))

(defn start-active-session [state history-path]
  (let [active-tab (or (:active-tab state)
                       {:tab-id "active-tab" :url "https://example.test/"})]
    (assoc state
           :history-path history-path
           :session-state (session/run-start-command
                           (:session-state state)
                           {:tab-id (:tab-id active-tab)
                            :url (:url active-tab)
                            :history-path history-path}))))

(defn start-testing-command [state]
  (start-active-session state (:history-path state)))

(defn end-testing-command [state]
  (assoc state
         :session-state
         (session/end-session (:session-state state))))

(def side-panel-command-handlers
  {"data-layer.start-testing" start-testing-command
   "data-layer.end-testing" end-testing-command})

(defn side-panel-command-handler [command-id]
  (or (get side-panel-command-handlers command-id)
      (throw (ex-info (str "Unsupported side panel command: " command-id)
                      {:command-id command-id}))))

(defn run-side-panel-command [state command-id]
  ((side-panel-command-handler command-id) state))

(defn page-appends-history-entry
  [state {:keys [page-url event-name payload-label]}]
  (-> state
      (observer/attach-observer {:history-path (:history-path state)
                                 :page-url page-url})
      (observer/page-push event-name payload-label)))

(defn navigate-active-tab [state {:keys [start-url page-url]}]
  (-> state
      (assoc :start-url start-url)
      (set-active-tab-url page-url)
      (update :session-state session/navigate-session page-url)
      (observer/reinstall-observer {:history-path (:history-path state)
                                    :page-url page-url})))

(defn timeline-entries [state]
  (or (get-in state [:session-state :session :timeline])
      (:observed-entries state)
      []))

(defn timeline-uses-url? [state url]
  (boolean (some #(= url (:url %)) (timeline-entries state))))

(defn timeline-entry [state event-name]
  (first (filter #(= event-name (:name %)) (timeline-entries state))))

(def side-panel-uses-active-tab-page-context?
  capture-wiring/side-panel-uses-active-tab-page-context?)

(def handlers
  [{:pattern #"^the side panel is open at <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [side-panel-url-key]]
               (open-side-panel world
                                (support/require-example example side-panel-url-key)))}

   {:pattern #"^the selected observation target URL is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (target-support/validate-all-example-values! example)
               (set-active-tab-url world
                                   (support/require-example example page-url-key)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is run from the side panel$"
    :handler (fn [world example [command-key]]
               (let [root (support/repository-root)
                     files (capture-wiring/files root ["src/active-page-observation.ts"])
                     command-id (support/require-example example command-key)]
                 (support/assert! (side-panel-uses-active-tab-page-context? files)
                                  "Side panel does not use active tab page context."
                                  {})
                 (run-side-panel-command world command-id)))}

   {:pattern #"^the data layer testing session current URL is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (let [expected (support/require-example example page-url-key)]
                 (support/assert! (= expected (get-in world [:session-state :session :current-url]))
                                  "Session current URL does not use active tab URL."
                                  {:expected expected
                                   :session-state (:session-state world)})
                 world))}

   {:pattern #"^no timeline entry uses URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [url-key]]
               (let [forbidden-url (support/require-example example url-key)]
                 (support/assert! (not (timeline-uses-url? world forbidden-url))
                                  "Timeline entry uses forbidden URL."
                                  {:forbidden-url forbidden-url
                                   :timeline (timeline-entries world)})
                 world))}

   {:pattern #"^the timeline entry for <([A-Za-z0-9_]+)> shows page URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key page-url-key]]
               (let [event-name (support/require-example example event-name-key)
                     expected (support/require-example example page-url-key)]
                 (support/assert! (= expected (:url (timeline-entry world event-name)))
                                  "Timeline entry URL does not match active page URL."
                                  {:event-name event-name
                                   :expected expected
                                   :timeline (timeline-entries world)})
                 world))}

   {:pattern #"^the selected target tab navigates from <([A-Za-z0-9_]+)> to page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [start-url-key page-url-key]]
               (target-support/validate-all-example-values! example)
               (navigate-active-tab
                world
                {:start-url (support/require-example example start-url-key)
                 :page-url (support/require-example example page-url-key)}))}

   {:pattern #"^the extension records entry <([A-Za-z0-9_]+)> with URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key page-url-key]]
               (let [event-name (support/require-example example event-name-key)
                     expected (support/require-example example page-url-key)]
                 (support/assert! (= expected (:url (timeline-entry world event-name)))
                                  "Observed entry URL does not match active page URL."
                                  {:event-name event-name
                                   :expected expected
                                   :timeline (timeline-entries world)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-30T19:51:21.275242302+02:00", :module-hash "472685673", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 7, :hash "-634122146"} {:id "defn/open-side-panel", :kind "defn", :line 9, :end-line 10, :hash "770252801"} {:id "defn/set-active-tab-url", :kind "defn", :line 12, :end-line 13, :hash "-1106585838"} {:id "defn/start-active-session", :kind "defn", :line 15, :end-line 24, :hash "-1655015583"} {:id "defn/start-testing-command", :kind "defn", :line 26, :end-line 27, :hash "460618291"} {:id "defn/end-testing-command", :kind "defn", :line 29, :end-line 32, :hash "-1039612487"} {:id "def/side-panel-command-handlers", :kind "def", :line 34, :end-line 36, :hash "918819193"} {:id "defn/side-panel-command-handler", :kind "defn", :line 38, :end-line 41, :hash "-1752308635"} {:id "defn/run-side-panel-command", :kind "defn", :line 43, :end-line 44, :hash "1262593567"} {:id "defn/page-appends-history-entry", :kind "defn", :line 46, :end-line 51, :hash "1271255599"} {:id "defn/navigate-active-tab", :kind "defn", :line 53, :end-line 59, :hash "-492110070"} {:id "defn/timeline-entries", :kind "defn", :line 61, :end-line 64, :hash "-149698137"} {:id "defn/timeline-uses-url?", :kind "defn", :line 66, :end-line 67, :hash "1930896913"} {:id "defn/timeline-entry", :kind "defn", :line 69, :end-line 70, :hash "-452779023"} {:id "def/side-panel-uses-active-tab-page-context?", :kind "def", :line 72, :end-line 73, :hash "1176528300"} {:id "def/handlers", :kind "def", :line 75, :end-line 143, :hash "-1672767878"}]}
;; clj-mutate-manifest-end
