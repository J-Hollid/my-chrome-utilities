(ns acceptance.steps.data-layer-page-context
  (:require [acceptance.steps.data-layer-observer :as observer]
            [acceptance.steps.data-layer-session :as session]
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

(defn side-panel-uses-active-tab-page-context? [source]
  (and (str/includes? source "activeTabPageUrl")
       (str/includes? source "chrome.tabs.query")
       (not (str/includes? source "url: globalThis.location.href"))))

(def handlers
  [{:pattern #"^the side panel is open at <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [side-panel-url-key]]
               (open-side-panel world
                                (support/require-example example side-panel-url-key)))}

   {:pattern #"^the active browser tab URL is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (set-active-tab-url world
                                   (support/require-example example page-url-key)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is run from the side panel$"
    :handler (fn [world example [command-key]]
               (let [root (support/repository-root)
                     source (support/source-file root "src/side-panel.ts")
                     command-id (support/require-example example command-key)]
                 (support/assert! (side-panel-uses-active-tab-page-context? source)
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

   {:pattern #"^the active tab navigates from <([A-Za-z0-9_]+)> to page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [start-url-key page-url-key]]
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
