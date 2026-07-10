(ns acceptance.steps.data-layer-recovery
  (:require [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.observation-targets-support :as target-support]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def recovery-timestamp "2026-07-08T00:00:00Z")

(defn capture-observed-event [state {:keys [event-name page-url history-path]}]
  (session/capture-entry state
                         {:type "observed"
                          :name event-name
                          :url page-url
                          :timestamp recovery-timestamp
                          :observer-path history-path
                          :payload (str event-name "-values")
                          :raw-value (str event-name "-raw")}))

(defn reopen-after-navigation [state next-url]
  (let [persisted (session/persisted-session (session/navigate-session state next-url))]
    (assoc (session/restore-session persisted)
           :restored-history-path (:history-path persisted))))

(defn timeline-entry [state event-name]
  (first (filter #(= event-name (:name %))
                 (get-in state [:session :timeline]))))

(defn restored-history-path [state]
  (or (:restored-history-path state)
      (get-in state [:session :history-path])))

(defn- observed-event-urls [state]
  (->> (get-in state [:session :timeline])
       (filter #(= "observed" (:type %)))
       (map :url)))

(defn- restart-observation-available? [status]
  (contains? #{"attached" "needs sync"} status))

(defn refresh-active-session [state status]
  (assoc state
         :observer-status status
         :restart-observation-available? (restart-observation-available? status)))

(defn restart-observation [state]
  (assoc state :observer-status "attached"))

(defn reopen-side-panel [state]
  (let [restored (session/restore-session (session/persisted-session state))]
    (assoc restored
           :observer-reattached? (= "active" (get-in restored [:session :status])))))

(def forbidden-recovery-capability-patterns
  [{:kind :cross-device-sync
    :pattern #"(?i)crossDeviceSync|cross-device sync|chrome\.storage\.sync"}
   {:kind :automatic-every-tab-monitoring
    :pattern #"(?i)monitorEveryTabInBackground|background monitoring of every tab|every tab monitoring"}])

(defn forbidden-recovery-capability-findings [files]
  (support/pattern-findings forbidden-recovery-capability-patterns files))

(defn forbidden-recovery-capability-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-recovery-capability-findings files)))

(defn- inspect-recovery-implementation [root]
  {"src/data-layer-session.ts" (support/source-file root "src/data-layer-session.ts")
   "src/data-layer-recovery.ts" (support/source-file root "src/data-layer-recovery.ts")
   "src/side-panel.ts" (support/source-file root "src/side-panel.ts")
   "side-panel.html" (support/source-file root "side-panel.html")})

(def handlers
  [{:pattern #"^observed event entry <([A-Za-z0-9_]+)> was captured on page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key page-url-key]]
               (let [history-path (support/require-example example "history_path")
                     session-state (assoc-in (:session-state world)
                                             [:session :history-path]
                                             history-path)]
                 (assoc world
                        :session-state
                        (capture-observed-event
                         session-state
                         {:event-name (support/require-example example event-name-key)
                          :page-url (support/require-example example page-url-key)
                          :history-path history-path}))))}

   {:pattern #"^the side panel is reopened after same-tab navigation to <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [next-url-key]]
               (assoc world
                      :session-state
                      (reopen-after-navigation
                       (:session-state world)
                       (support/require-example example next-url-key))))}

   {:pattern #"^the timeline still includes event entry <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key]]
               (let [event-name (support/require-example example event-name-key)]
                 (support/assert! (timeline-entry (:session-state world) event-name)
                                  "Timeline entry was not restored."
                                  {:event-name event-name
                                   :session-state (:session-state world)})
                 world))}

   {:pattern #"^the configured history array path <([A-Za-z0-9_]+)> is restored$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (restored-history-path (:session-state world)))
                                  "Configured history path was not restored."
                                  {:expected expected
                                   :actual (restored-history-path (:session-state world))})
                 world))}

   {:pattern #"^the event entry remains associated with page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (let [expected (support/require-example example page-url-key)]
                 (support/assert! (some #(= expected %)
                                        (observed-event-urls (:session-state world)))
                                  "Event entry page association was not restored."
                                  {:expected expected
                                   :session-state (:session-state world)})
                 world))}

   {:pattern #"^the selected target tab refreshes during a data layer testing session$"
    :handler (fn [world example _captures]
               (target-support/validate-all-example-values! example)
               (let [status (support/require-example example "status")
                     root (support/repository-root)
                     source (support/source-file root "src/side-panel.ts")
                     html (support/source-file root "side-panel.html")]
                 (-> world
                     (refresh-active-session status)
                     (assoc :recovery-source source
                            :recovery-html html))))}

   {:pattern #"^observer attachment status <([A-Za-z0-9_]+)> is shown$"
    :handler (fn [world example [status-key]]
               (let [expected (support/require-example example status-key)]
                 (support/assert! (= expected (:observer-status world))
                                  "Observer attachment status was not shown."
                                  {:expected expected
                                   :actual (:observer-status world)})
                 (support/assert! (str/includes? (:recovery-html world) "observer-status")
                                  "Observer status output is not present."
                                  {})
                 world))}

   {:pattern #"^the user can restart observation for the selected target tab$"
    :handler (fn [world _example _captures]
               (let [restarted (restart-observation world)]
                 (support/assert! (= "attached" (:observer-status restarted))
                                  "Observation could not be restarted."
                                  {:observer-status (:observer-status restarted)})
                 (support/assert! (and (str/includes? (:recovery-html world) "restart-observation")
                                       (str/includes? (:recovery-source world) "restartObservation"))
                                  "Restart observation control is not wired."
                                  {})
                 restarted))}

   {:pattern #"^a data layer testing session was intentionally ended$"
    :handler (fn [world _example _captures]
               (assoc world :session-state (session/end-session (:session-state world))))}

   {:pattern #"^the ended session remains ended$"
    :handler (fn [world _example _captures]
               (let [ended-session (or (:persisted-session world)
                                       (get-in world [:session-state :session]))]
                 (support/assert! (= "ended" (:status ended-session))
                                  "Ended session did not remain ended."
                                  {:ended-session ended-session})
                 world))}

   {:pattern #"^the observer is not reattached automatically$"
    :handler (fn [world _example _captures]
               (let [state (reopen-side-panel {:session (:persisted-session world)})]
                 (support/assert! (false? (:observer-reattached? state))
                                  "Observer was reattached automatically."
                                  {:observer-reattached? (:observer-reattached? state)})
                 world))}

   {:pattern #"^data layer session recovery features are inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :recovery-files (inspect-recovery-implementation root))))}

   {:pattern #"^cross-device sync is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-recovery-capability-findings-of-kind
                               (:recovery-files world)
                               :cross-device-sync)]
                 (support/assert! (empty? findings)
                                  "Disallowed sync behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^automatic background monitoring of every tab is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-recovery-capability-findings-of-kind
                               (:recovery-files world)
                               :automatic-every-tab-monitoring)]
                 (support/assert! (empty? findings)
                                  "Disallowed background monitoring was found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T19:22:51.080478138+02:00", :module-hash "-366222747", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1256953708"} {:id "def/recovery-timestamp", :kind "def", :line 7, :end-line nil, :hash "-829136013"} {:id "defn/capture-observed-event", :kind "defn", :line 9, :end-line nil, :hash "2002826544"} {:id "defn/reopen-after-navigation", :kind "defn", :line 19, :end-line nil, :hash "1175227345"} {:id "defn/timeline-entry", :kind "defn", :line 24, :end-line nil, :hash "-1808051897"} {:id "defn/restored-history-path", :kind "defn", :line 28, :end-line nil, :hash "1405355457"} {:id "defn-/observed-event-urls", :kind "defn-", :line 32, :end-line nil, :hash "-1284049393"} {:id "defn-/restart-observation-available?", :kind "defn-", :line 37, :end-line nil, :hash "1280026819"} {:id "defn/refresh-active-session", :kind "defn", :line 40, :end-line nil, :hash "193455126"} {:id "defn/restart-observation", :kind "defn", :line 45, :end-line nil, :hash "-1184222671"} {:id "defn/reopen-side-panel", :kind "defn", :line 48, :end-line nil, :hash "693468688"} {:id "def/forbidden-recovery-capability-patterns", :kind "def", :line 53, :end-line nil, :hash "1231321701"} {:id "defn/forbidden-recovery-capability-findings", :kind "defn", :line 59, :end-line nil, :hash "1181618589"} {:id "defn/forbidden-recovery-capability-findings-of-kind", :kind "defn", :line 62, :end-line nil, :hash "1965889639"} {:id "defn-/inspect-recovery-implementation", :kind "defn-", :line 65, :end-line nil, :hash "1472227023"} {:id "def/handlers", :kind "def", :line 71, :end-line nil, :hash "1225887256"}]}
;; clj-mutate-manifest-end
