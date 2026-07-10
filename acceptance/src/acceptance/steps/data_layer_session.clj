(ns acceptance.steps.data-layer-session
  (:require [acceptance.steps.observation-targets-support :as target-support]
            [acceptance.steps.support :as support]
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

(defn forbidden-session-scope-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-session-scope-findings files)))

(defn- inspect-session-implementation [root]
  {"src/data-layer-session.ts" (support/source-file root "src/data-layer-session.ts")
   "src/side-panel.ts" (support/source-file root "src/side-panel.ts")})

(defn- default-tab []
  {:tab-id "active-tab"
   :url "https://example.test/"})

(defn- assert-canonical-history! [world]
  (support/assert! (= "queue.history" (get-in world [:session-state :session :history-path]))
                   "Active session history path fixture is not canonical."
                   {:expected "queue.history"
                    :actual (get-in world [:session-state :session :history-path])}))

(def handlers
  [{:pattern #"^command <([A-Za-z0-9_]+)> (?:is run(?: again)? for the selected observation target|is run for the active testing session)$"
    :handler (fn [world example [command-key]]
               (target-support/validate-all-example-values! example)
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

   {:pattern #"^a data layer testing session starts for the selected target tab$"
    :handler (fn [world _example _captures]
               (support/assert! (active-session? (:session-state world))
                                "Data layer testing session did not start."
                                {:session-state (:session-state world)})
               world)}

   {:pattern #"^the session scope is the selected target tab journey$"
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
                 (support/assert! (= "queue.history" expected)
                                  "Session history path fixture is not canonical."
                                  {:expected "queue.history" :actual expected})
                 (support/assert! (= expected (get-in world [:session-state :session :history-path]))
                                  "Session does not use the configured history path."
                                  {:expected expected
                                   :actual (get-in world [:session-state :session :history-path])})
                 world))}

   {:pattern #"^a data layer testing session is active$"
    :handler (fn [world _example _captures]
               (let [tab (default-tab)]
                 (assoc world
                        :session-state (-> {}
                                           (run-start-command {:tab-id (:tab-id tab)
                                                               :url (:url tab)
                                                               :history-path (:history-path world)})))))}

   {:pattern #"^the selected target tab navigates or reloads from <([A-Za-z0-9_]+)> to <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [start-url-key next-url-key]]
               (target-support/validate-all-example-values! example)
               (let [start-url (support/require-example example start-url-key)
                     next-url (support/require-example example next-url-key)]
                 (assert-canonical-history! world)
                 (support/assert! (contains? #{["https://example.test/" "https://example.test/p/"]
                                               ["https://example.test/" "https://example.test/"]}
                                             [start-url next-url])
                                  "Navigation journey fixture is not canonical."
                                  {:start-url start-url :next-url next-url})
                 (support/assert! (= start-url (get-in world [:session-state :session :current-url]))
                                  "Navigation did not start at the active session URL."
                                  {:expected start-url
                                   :actual (get-in world [:session-state :session :current-url])})
                 (assoc world
                        :start-url start-url
                        :next-url next-url
                        :session-state (navigate-session (:session-state world) next-url))))}

   {:pattern #"^the same data layer testing session remains active$"
    :handler (fn [world _example _captures]
               (support/assert! (active-session? (:session-state world))
                                "Session did not remain active."
                                {:session-state (:session-state world)})
               (support/assert! (= (:next-url world)
                                   (get-in world [:session-state :session :current-url]))
                                "Active session did not reach the requested URL."
                                {:expected (:next-url world)
                                 :actual (get-in world [:session-state :session :current-url])})
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
               (assert-canonical-history! world)
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
               (assert-canonical-history! world)
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
               (let [findings (forbidden-session-scope-findings-of-kind
                               (:session-files world)
                               :multi-profile-session-manager)]
                 (support/assert! (empty? findings)
                                  "Multi-profile session manager was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^event replay is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-session-scope-findings-of-kind
                               (:session-files world)
                               :event-replay)]
                 (support/assert! (empty? findings)
                                  "Event replay was found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T19:22:44.671688713+02:00", :module-hash "9985672", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1086522596"} {:id "defn/active-session?", :kind "defn", :line 6, :end-line nil, :hash "-1624177319"} {:id "defn/start-session", :kind "defn", :line 9, :end-line nil, :hash "-1998652651"} {:id "defn/end-session", :kind "defn", :line 20, :end-line nil, :hash "-401170035"} {:id "defn/session-scope", :kind "defn", :line 25, :end-line nil, :hash "1378820812"} {:id "defn/capture-entry", :kind "defn", :line 29, :end-line nil, :hash "-346897820"} {:id "defn/run-start-command", :kind "defn", :line 34, :end-line nil, :hash "-411547074"} {:id "defn/navigate-session", :kind "defn", :line 41, :end-line nil, :hash "1379729372"} {:id "defn/persisted-session", :kind "defn", :line 46, :end-line nil, :hash "-1713802482"} {:id "defn/restore-session", :kind "defn", :line 49, :end-line nil, :hash "1190008"} {:id "def/forbidden-session-patterns", :kind "def", :line 54, :end-line nil, :hash "302746711"} {:id "defn/forbidden-session-scope-findings", :kind "defn", :line 60, :end-line nil, :hash "1657619078"} {:id "defn/forbidden-session-scope-findings-of-kind", :kind "defn", :line 63, :end-line nil, :hash "-1663165978"} {:id "defn-/inspect-session-implementation", :kind "defn-", :line 66, :end-line nil, :hash "-797735370"} {:id "defn-/default-tab", :kind "defn-", :line 70, :end-line nil, :hash "-1862329308"} {:id "defn-/assert-canonical-history!", :kind "defn-", :line 74, :end-line nil, :hash "-838603358"} {:id "def/handlers", :kind "def", :line 80, :end-line nil, :hash "1286201018"}]}
;; clj-mutate-manifest-end
