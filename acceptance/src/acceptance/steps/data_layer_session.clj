(ns acceptance.steps.data-layer-session
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn active-session? [state]
  (= "active" (get-in state [:session :status])))

(defn start-session [state {:keys [tab-id url history-path]}]
  (if (active-session? state)
    (assoc state :warning "active session already exists")
    {:session {:id (str "tab-" tab-id)
               :status "active"
               :tab-id tab-id
               :history-path history-path
               :start-url url
               :current-url url
               :timeline []}}))

(defn end-session [state]
  (if-let [session (:session state)]
    (assoc state :session (assoc session :status "ended") :warning nil)
    state))

(defn session-scope [state]
  (when (:session state)
    "active-tab journey"))

(defn capture-entry [state entry]
  (if (active-session? state)
    (update-in state [:session :timeline] conj entry)
    state))

(defn run-start-command [state options]
  (let [was-active (active-session? state)
        next-state (start-session state options)]
    (if was-active
      next-state
      (capture-entry next-state {:type "page" :url (:url options)}))))

(defn navigate-session [state next-url]
  (if (active-session? state)
    (assoc-in state [:session :current-url] next-url)
    state))

(defn persisted-session [state]
  (:session state))

(defn restore-session [session]
  (if session
    {:session session}
    {}))

(def forbidden-session-patterns
  [{:kind :multi-profile-session-manager
    :pattern #"(?i)multiProfileSessionManager|multi-profile session"}
   {:kind :event-replay
    :pattern #"(?i)eventReplay|event replay|replayEvent"}])

(defn forbidden-session-scope-findings [files]
  (support/pattern-findings forbidden-session-patterns files))

(defn- inspect-session-implementation [root]
  {"src/data-layer-session.ts" (support/source-file root "src/data-layer-session.ts")
   "src/side-panel.ts" (support/source-file root "src/side-panel.ts")})

(defn- default-tab []
  {:tab-id 1
   :url "https://example.test/"})

(def handlers
  [{:pattern #"^command <([A-Za-z0-9_]+)> is run for the active tab$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)
                     history-path (:history-path world)
                     tab (or (:active-tab world) (default-tab))]
                 (case command-id
                   "data-layer.start-testing"
                   (assoc world
                          :session-command command-id
                          :session-state (run-start-command (:session-state world)
                                                            {:tab-id (:tab-id tab)
                                                             :url (:url tab)
                                                             :history-path history-path}))

                   "data-layer.end-testing"
                   (assoc world
                          :session-command command-id
                          :session-state (end-session (:session-state world)))

                   (throw (ex-info (str "Unsupported session command: " command-id)
                                   {:command-id command-id})))))}

   {:pattern #"^a data layer testing session starts for the active tab$"
    :handler (fn [world _example _captures]
               (support/assert! (active-session? (:session-state world))
                                "Data layer testing session did not start."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^the session scope is the active tab journey$"
    :handler (fn [world _example _captures]
               (support/assert! (= "active-tab journey"
                                   (session-scope (:session-state world)))
                                "Session scope is incorrect."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^the side panel shows the session as active$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     html (support/source-file root "side-panel.html")
                     source (support/source-file root "src/side-panel.ts")]
                 (support/assert! (and (str/includes? html "session-status")
                                       (str/includes? source "renderSessionState"))
                                  "Side panel does not show active session state."
                                  {})
                 world))}

   {:pattern #"^the active session uses history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (get-in world [:session-state :session :history-path]))
                                  "Session does not use the configured history path."
                                  {:expected expected
                                   :actual (get-in world [:session-state :session :history-path])})
                 world))}

   {:pattern #"^a data layer testing session is active$"
    :handler (fn [world _example _captures]
               (assoc world
                      :session-state (-> {}
                                         (run-start-command {:tab-id 1
                                                             :url "https://example.test/"
                                                             :history-path (:history-path world)}))))}

   {:pattern #"^the active tab navigates or reloads from <([A-Za-z0-9_]+)> to <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [start-url-key next-url-key]]
               (let [start-url (support/require-example example start-url-key)
                     next-url (support/require-example example next-url-key)]
                 (assoc world
                        :start-url start-url
                        :next-url next-url
                        :session-state (navigate-session (:session-state world) next-url))))}

   {:pattern #"^the same data layer testing session remains active$"
    :handler (fn [world _example _captures]
               (support/assert! (active-session? (:session-state world))
                                "Session did not remain active."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^captured event entries remain part of the same session timeline$"
    :handler (fn [world _example _captures]
               (support/assert! (seq (get-in world [:session-state :session :timeline]))
                                "Captured entries are not in the session timeline."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^the side panel is reopened$"
    :handler (fn [world _example _captures]
               (assoc world :persisted-session (persisted-session (:session-state world))))}

   {:pattern #"^the active session is restored from local persistence$"
    :handler (fn [world _example _captures]
               (let [restored (restore-session (:persisted-session world))]
                 (support/assert! (active-session? restored)
                                  "Active session was not restored."
                                  {:restored restored})
                 (assoc world :session-state restored)))}

   {:pattern #"^captured event entries remain visible$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     html (support/source-file root "side-panel.html")]
                 (support/assert! (and (str/includes? html "session-timeline")
                                       (seq (get-in world [:session-state :session :timeline])))
                                  "Captured event entries are not visible."
                                  {:session-state (:session-state world)})
                 world))}

   {:pattern #"^an active session warning is shown$"
    :handler (fn [world _example _captures]
               (support/assert! (= "active session already exists"
                                   (get-in world [:session-state :warning]))
                                "Active session warning was not shown."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^the existing data layer testing session remains unchanged$"
    :handler (fn [world _example _captures]
               (support/assert! (= "queue.history"
                                   (get-in world [:session-state :session :history-path]))
                                "Existing session changed unexpectedly."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^the data layer testing session ends intentionally$"
    :handler (fn [world _example _captures]
               (support/assert! (= "ended"
                                   (get-in world [:session-state :session :status]))
                                "Session did not end intentionally."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^no new page entries are captured for that ended session$"
    :handler (fn [world _example _captures]
               (let [after-capture (capture-entry (:session-state world)
                                                  {:type "page"
                                                   :url "https://example.test/after-ended"})]
                 (support/assert! (= (get-in world [:session-state :session :timeline])
                                     (get-in after-capture [:session :timeline]))
                                  "Ended session captured new page entries."
                                  {:before (:session-state world)
                                   :after after-capture})
                 world))}

   {:pattern #"^data layer testing session features are inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :session-files (inspect-session-implementation root))))}

   {:pattern #"^a multi-profile session manager is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :multi-profile-session-manager (:kind %))
                                      (forbidden-session-scope-findings
                                       (:session-files world)))]
                 (support/assert! (empty? findings)
                                  "Multi-profile session manager was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^event replay is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :event-replay (:kind %))
                                      (forbidden-session-scope-findings
                                       (:session-files world)))]
                 (support/assert! (empty? findings)
                                  "Event replay was found."
                                  {:findings (vec findings)})
                 world))}])
