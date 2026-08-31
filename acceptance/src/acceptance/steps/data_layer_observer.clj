(ns acceptance.steps.data-layer-observer
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.source-inspection.capture :as capture-wiring]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.observation-targets-support :as target-support]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def observer-timestamp "2026-07-08T00:00:00Z")
(def page-access-available "page access available")
(def page-access-unavailable "page access unavailable")
(def canonical-live-page-url "https://www.example.com/")
(def canonical-live-history-path "dataLayerHistory")
(def canonical-live-event-name "signup")
(def canonical-live-values-payload "signup-values")
(def canonical-live-queued-payload "signup-payload")
(def canonical-refresh-start-page-url "https://www.example.com/")
(def canonical-refresh-product-page-url "https://www.example.com/product")
(def canonical-refresh-history-path "event.history")
(def canonical-refresh-event-name "pageview")

(defn- path-parts [path]
  (->> (str/split path #"\.")
       (map str/trim)
       (remove str/blank?)
       (map keyword)))

(defn- default-page-object []
  data-layer/sample-page-object)

(defn- path-value [page-object path]
  (get-in page-object (path-parts path)))

(defn- state-page-object [state]
  (or (:page-object state) (default-page-object)))

(defn- history-entry [event-name payload-label]
  {:event event-name
   :payload {:label payload-label}})

(defn- observed-entry [observer raw-value]
  {:type "observed"
   :url (:page-url observer)
   :timestamp observer-timestamp
   :observer-path (:history-path observer)
   :name (:event raw-value)
   :payload (get-in raw-value [:payload :label])
   :raw-value raw-value})

(defn- observer-active-count [status]
  (if (= "ready" status) 1 0))

(defn- observer-state [status history-path page-url]
  {:status status
   :history-path history-path
   :page-url page-url
   :active-count (observer-active-count status)})

(defn attach-observer [state {:keys [history-path page-url page-object]}]
  (let [page-object (or page-object (state-page-object state))
        status (data-layer/path-status page-object history-path)]
    (assoc state
           :page-object page-object
           :observer (observer-state status history-path page-url))))

(defn reinstall-observer [state options]
  (attach-observer (assoc state :page-object (default-page-object)) options))

(defn- observer-ready? [observer]
  (= "ready" (:status observer)))

(defn- capture-observed-entry-in-session [state entry]
  (if (:session-state state)
    (update state :session-state session/capture-entry entry)
    state))

(defn- record-observed-entry [state observer raw-value]
  (let [entry (observed-entry observer raw-value)]
    (-> state
        (update :observed-entries (fnil conj []) entry)
        (capture-observed-entry-in-session entry))))

(defn- observed-push-state [state observer raw-value]
  (let [parts (path-parts (:history-path observer))
        page-object (update-in (:page-object state) parts conj raw-value)
        push-return (count (get-in page-object parts))]
    (-> state
        (assoc :page-object page-object
               :push-return push-return)
        (record-observed-entry observer raw-value))))

(defn page-push [state event-name payload-label]
  (let [raw-value (history-entry event-name payload-label)
        observer (:observer state)]
    (if (observer-ready? observer)
      (observed-push-state state observer raw-value)
      (assoc state :push-return nil))))

(defn last-observed-entry [state]
  (last (:observed-entries state)))

(def forbidden-observer-capability-patterns
  [{:kind :object-push-events
    :pattern #"(?i)objectPushEventsWithEventFields|observeObjectPush|object push events"}
   {:kind :analytics-beacons
    :pattern #"(?i)sendBeacon|analytics beacon"}
   {:kind :object-snapshots
    :pattern #"(?i)objectSnapshot|object snapshot|snapshot"}])

(defn forbidden-observer-capability-findings [files]
  (support/pattern-findings forbidden-observer-capability-patterns files))

(defn forbidden-observer-capability-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-observer-capability-findings files)))

(defn- inspect-observer-implementation [root]
  (capture-wiring/files root
                        ["src/data-layer-observer.ts"
                         "src/data-layer-observation-refresh.ts"
                         "src/data-layer-live-observation.ts"]))

(defn- observed-entry-count-for-url [state url]
  (count (filter #(= url (:url %)) (:observed-entries state))))

(defn- page-object-with-history-path [history-path]
  (assoc-in {} (path-parts history-path) []))

(defn define-active-page-window [state {:keys [page-url history-path]}]
  (let [page-object (page-object-with-history-path history-path)]
    (assoc state
           :active-page-window {:page-url page-url
                                :page-access-status page-access-available
                                :page-object page-object}
           :page-object page-object)))

(defn define-active-page-window-with-entry
  [state {:keys [page-url history-path event-name payload-label]}]
  (let [page-object (update-in (page-object-with-history-path history-path)
                               (path-parts history-path)
                               conj
                               (history-entry event-name
                                              (or payload-label
                                                  (str event-name "-payload"))))]
    (assoc state
           :active-page-window {:page-url page-url
                                :page-access-status page-access-available
                                :page-object page-object}
           :page-object page-object)))

(defn define-active-page-window-without-path [state {:keys [page-url]}]
  (let [page-object {}]
    (assoc state
           :active-page-window {:page-url page-url
                                :page-access-status page-access-available
                                :page-object page-object}
           :page-object page-object)))

(defn define-unreadable-active-page [state {:keys [page-url]}]
  (assoc state
         :active-page-window {:page-url page-url
                              :page-access-status page-access-unavailable}))

(defn- page-access-unavailable? [active-page-window]
  (= page-access-unavailable (:page-access-status active-page-window)))

(defn- unavailable-observer-state [history-path page-url]
  {:status page-access-unavailable
   :history-path history-path
   :page-url page-url
   :active-count 0})

(defn read-active-page-history-path [state history-path]
  (let [{:keys [page-url page-object] :as active-page-window} (:active-page-window state)]
    (if (page-access-unavailable? active-page-window)
      (assoc state
             :page-access-status page-access-unavailable
             :active-page-read-result nil
             :observer (unavailable-observer-state history-path page-url))
      (let [read-result {:history-path history-path
                         :page-url page-url
                         :page-object page-object}]
        (-> state
            (assoc :page-access-status page-access-available
                   :active-page-read-result read-result
                   :page-object page-object)
            (attach-observer {:history-path history-path
                              :page-url page-url
                              :page-object page-object}))))))

(defn start-active-page-observation [state]
  (read-active-page-history-path state (:history-path state)))

(defn- capture-queued-history-entries [state]
  (let [observer (:observer state)
        entries (path-value (:page-object state) (:history-path observer))]
    (if (and (observer-ready? observer) (sequential? entries))
      (reduce #(record-observed-entry %1 observer %2) state entries)
      state)))

(defn start-side-panel-live-capture [state]
  (let [active-page (:active-page-window state)]
    (-> state
        (assoc :session-state
               (session/run-start-command
                (:session-state state)
                {:tab-id "active-tab"
                 :url (:page-url active-page)
                 :history-path (:history-path state)}))
        (read-active-page-history-path (:history-path state))
        capture-queued-history-entries)))

(defn active-page-read-succeeded? [state]
  (= page-access-available (:page-access-status state)))

(defn active-page-read-result-includes-path? [state history-path]
  (some? (path-value (get-in state [:active-page-read-result :page-object])
                     history-path)))

(defn active-page-read-result-not-empty? [state]
  (let [{:keys [history-path page-object]} (:active-page-read-result state)
        value (path-value page-object history-path)]
    (and (sequential? value) (seq value) true)))

(defn no-empty-page-object-used-as-successful-read? [state]
  (not (and (= page-access-available (:page-access-status state))
            (= {} (get-in state [:active-page-read-result :page-object])))))

(defn page-owned-history-entry? [state event-name]
  (boolean
   (some #(= event-name (:event %))
         (path-value (:page-object state) (:history-path state)))))

(defn active-page-window-observation-wired? [files]
  (capture-wiring/active-page-window-observation-wired? files page-access-unavailable))

(def live-history-push-capture-wired? capture-wiring/live-history-push-capture-wired?)
(def pageload-observation-refresh-wired? capture-wiring/pageload-observation-refresh-wired?)

(defn attach-observation-on-page [state page-url]
  (-> state
      (define-active-page-window {:page-url page-url
                                  :history-path (:history-path state)})
      (read-active-page-history-path (:history-path state))
      (update :session-state session/navigate-session page-url)
      (assoc :attached-observation-page-url page-url)))

(defn- prepare-pageload-refresh [state page-url history-path]
  (-> state
      (update :session-state session/navigate-session page-url)
      (update :session-state session/capture-entry {:type "page"
                                                    :url page-url})
      (assoc :pageload-observation-refresh :automatic
             :manual-observation-restart-required? false
             :waited-for-history-path history-path)))

(defn navigate-with-delayed-history-path [state {:keys [page-url history-path]}]
  (-> state
      (prepare-pageload-refresh page-url history-path)
      (define-active-page-window-without-path {:page-url page-url})
      (read-active-page-history-path history-path)
      (define-active-page-window {:page-url page-url
                                  :history-path history-path})
      (read-active-page-history-path history-path)))

(defn reload-with-delayed-history-path [state {:keys [page-url history-path]}]
  (navigate-with-delayed-history-path state {:page-url page-url
                                             :history-path history-path}))

(defn automatic-pageload-observation-refresh? [state]
  (and (= :automatic (:pageload-observation-refresh state))
       (= "ready" (get-in state [:observer :status]))
       (= 1 (get-in state [:observer :active-count]))))

(defn page-push-after-ready [state event-name history-path]
  (let [before-count (count (:observed-entries state))
        next-state (page-push state event-name (str event-name "-payload"))
        after-count (count (:observed-entries next-state))]
    (assoc next-state
           :ready-push-history-path history-path
           :ready-push-captured-once? (= 1 (- after-count before-count)))))

(defn session-timeline [state]
  (get-in state [:session-state :session :timeline]))

(defn- page-entry-urls [state]
  (->> (session-timeline state)
       (filter #(= "page" (:type %)))
       (map :url)
       vec))

(defn- observed-event-entry? [event-name entry]
  (and (= "observed" (:type entry))
       (= event-name (:name entry))))

(defn session-timeline-shows-page-and-observed? [state page-url event-name]
  (let [timeline (session-timeline state)]
    (and (= {:type "page" :url page-url} (first timeline))
         (some #(observed-event-entry? event-name %)
               (rest timeline)))))

(defn observed-entry-matches? [entry {:keys [page-url history-path payload-label]}]
  (and (= page-url (:url entry))
       (= history-path (:observer-path entry))
       (= payload-label (:payload entry))))

(defn- last-observed-entry-value-matches? [state key expected]
  (= expected (get (last-observed-entry state) key)))

(def handlers
  [{:pattern #"^the configured history array receives object entry <([A-Za-z0-9_]+)> with event field <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [object-label-key event-name-key]]
               (target-support/validate-all-example-values! example)
               (let [object-label (support/require-example example object-label-key)
                     event-name (support/require-example example event-name-key)
                     history-path (support/require-example example "history_path")]
                 (-> world
                     (assoc :object-label object-label)
                     (attach-observer {:history-path history-path
                                       :page-url "https://example.test/"
                                       :page-object (assoc-in (state-page-object world)
                                                              (path-parts history-path)
                                                              [])})
                     (page-push event-name (str event-name "-values")))))}

   {:pattern #"^the object entry is observed$"
    :handler (fn [world _example _captures] world)}

   {:pattern #"^event <([A-Za-z0-9_]+)> is captured with object payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key payload-label-key]]
               (support/assert! (and (= (support/require-example example event-name-key)
                                       (:name (last-observed-entry world)))
                                    (= (support/require-example example payload-label-key)
                                       (:payload (last-observed-entry world))))
                                "Object event was not captured with its payload."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the complete object entry is retained as raw input$"
    :handler (fn [world _example _captures]
               (support/assert! (map? (:raw-value (last-observed-entry world)))
                                "Object raw input was not retained."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^page <([A-Za-z0-9_]+)> appends history entry <([A-Za-z0-9_]+)> with payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key event-name-key payload-label-key]]
               (let [page-url (support/require-example example page-url-key)
                     event-name (support/require-example example event-name-key)
                     payload-label (support/require-example example payload-label-key)]
                 (-> world
                     (attach-observer {:history-path (:history-path world)
                                       :page-url page-url})
                     (page-push event-name payload-label))))}

   {:pattern #"^page <([A-Za-z0-9_]+)> has no queued data layer entries at <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key history-path-key]]
               (define-active-page-window
                world
                {:page-url (support/require-example example page-url-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^before testing starts, page <([A-Za-z0-9_]+)> has queued data layer entry <([A-Za-z0-9_]+)> with payload <([A-Za-z0-9_]+)> at <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key event-name-key payload-label-key history-path-key]]
               (define-active-page-window-with-entry
                world
                {:page-url (support/require-example example page-url-key)
                 :history-path (support/require-example example history-path-key)
                 :event-name (support/require-example example event-name-key)
                 :payload-label (support/require-example example payload-label-key)}))}

   {:pattern #"^data layer testing is started from the side panel for the selected target page$"
    :handler (fn [world example _captures]
               (target-support/validate-all-example-values! example)
               (let [root (support/repository-root)
                     files (capture-wiring/files
                            root
                            ["src/data-layer-observer.ts"
                             "src/data-layer-live-observation.ts"])]
                 (support/assert! (live-history-push-capture-wired? files)
                                  "Live history push capture is not wired."
                                  {})
                 (start-side-panel-live-capture world)))}

   {:pattern #"^the selected target page pushes history entry <([A-Za-z0-9_]+)> with payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key payload-label-key]]
               (page-push world
                          (support/require-example example event-name-key)
                          (support/require-example example payload-label-key)))}

   {:pattern #"^the Live event feed shows pathname visit <([A-Za-z0-9_]+)> and observed event <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key event-name-key]]
               (let [page-url (support/require-example example page-url-key)
                     event-name (support/require-example example event-name-key)]
                 (support/assert! (session-timeline-shows-page-and-observed?
                                   world
                                   page-url
                                   event-name)
                                  "The Live event feed does not show the pathname visit and observed event."
                                  {:timeline (session-timeline world)})
                 world))}

   {:pattern #"^the observed event entry matches page URL <([A-Za-z0-9_]+)>, observer path <([A-Za-z0-9_]+)>, and payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key history-path-key payload-label-key]]
               (let [expected {:page-url (support/require-example example page-url-key)
                               :history-path (support/require-example example history-path-key)
                               :payload-label (support/require-example example payload-label-key)}
                     entry (last-observed-entry world)]
                 (support/assert! (observed-entry-matches? entry expected)
                                  "Observed event entry does not match."
                                  {:expected expected
                                   :entry entry})
                 world))}

   {:pattern #"^the live capture entry uses the canonical page URL$"
    :handler (fn [world _example _captures]
               (support/assert! (last-observed-entry-value-matches?
                                 world
                                 :url
                                 canonical-live-page-url)
                                "Live capture entry URL does not match the canonical page."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the live capture entry uses the canonical history path$"
    :handler (fn [world _example _captures]
               (support/assert! (last-observed-entry-value-matches?
                                 world
                                 :observer-path
                                 canonical-live-history-path)
                                "Live capture entry path does not match the canonical history path."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the live capture entry records signup event$"
    :handler (fn [world _example _captures]
               (support/assert! (last-observed-entry-value-matches?
                                 world
                                 :name
                                 canonical-live-event-name)
                                "Live capture entry event does not match signup."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the live capture entry records signup values payload$"
    :handler (fn [world _example _captures]
               (support/assert! (last-observed-entry-value-matches?
                                 world
                                 :payload
                                 canonical-live-values-payload)
                                "Live capture entry payload does not match signup values."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the live capture entry records queued signup payload$"
    :handler (fn [world _example _captures]
               (support/assert! (last-observed-entry-value-matches?
                                 world
                                 :payload
                                 canonical-live-queued-payload)
                                "Live capture entry payload does not match queued signup."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^selected target page <([A-Za-z0-9_]+)> defines history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key history-path-key]]
               (target-support/validate-all-example-values! example)
               (define-active-page-window
                world
                {:page-url (support/require-example example page-url-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^selected target page <([A-Za-z0-9_]+)> defines history array path <([A-Za-z0-9_]+)> with existing entry <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key history-path-key event-name-key]]
               (target-support/validate-all-example-values! example)
               (let [observation {:page-url (support/require-example example page-url-key)
                                  :history-path (support/require-example example history-path-key)
                                  :event-name (support/require-example example event-name-key)}]
                 (support/assert! (= {:page-url "https://example.test/p/"
                                      :history-path "test_obj.history"
                                      :event-name "signup"}
                                     observation)
                                  "Active target read fixture is not canonical."
                                  {:observation observation})
                 (define-active-page-window-with-entry world observation)))}

   {:pattern #"^selected target page <([A-Za-z0-9_]+)> does not define history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key _history-path-key]]
               (target-support/validate-all-example-values! example)
               (define-active-page-window-without-path
                world
                {:page-url (support/require-example example page-url-key)}))}

   {:pattern #"^selected target page <([A-Za-z0-9_]+)> cannot be read by the extension$"
    :handler (fn [world example [page-url-key]]
               (target-support/validate-all-example-values! example)
               (let [page-url (support/require-example example page-url-key)]
                 (support/assert! (= ["test_obj.history" "https://example.test/p/"]
                                     [(:history-path world) page-url])
                                  "Unreadable target fixture is not canonical."
                                  {:history-path (:history-path world)
                                   :page-url page-url})
                 (define-unreadable-active-page world {:page-url page-url})))}

   {:pattern #"^the extension reads history array path <([A-Za-z0-9_]+)> from the selected target page$"
    :handler (fn [world example [history-path-key]]
               (read-active-page-history-path
                world
                (support/require-example example history-path-key)))}

   {:pattern #"^observation starts for the selected target page$"
    :applies? (fn [world] (contains? world :active-page-window))
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     files (capture-wiring/files
                            root
                            ["src/active-page-observation.ts" "manifest.json"])]
                 (support/assert! (active-page-window-observation-wired? files)
                                  "Active page window observation is not wired."
                                  {})
                 (causal-regression/emit!
                  :capture
                  {:capture-owner-inspected true
                   :runtime-owner-inspected true
                   :capture-wiring-recognized true})
                 (start-active-page-observation world)))}

   {:pattern #"^the target page read succeeds$"
    :handler (fn [world _example _captures]
               (support/assert! (active-page-read-succeeded? world)
                                "Active page read did not succeed."
                                {:page-access-status (:page-access-status world)})
               world)}

   {:pattern #"^the target page read result includes history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [history-path (support/require-example example history-path-key)]
                 (support/assert! (active-page-read-result-includes-path?
                                   world
                                   history-path)
                                  "Active page read result does not include history path."
                                  {:history-path history-path
                                   :active-page-read-result (:active-page-read-result world)})
                 world))}

   {:pattern #"^the target page read result is not empty$"
    :handler (fn [world _example _captures]
               (support/assert! (active-page-read-result-not-empty? world)
                                "Active page read result was empty."
                                {:active-page-read-result (:active-page-read-result world)})
               world)}

   {:pattern #"^page access status <([A-Za-z0-9_]+)> is shown$"
    :handler (fn [world example [page-access-status-key]]
               (let [expected (support/require-example example page-access-status-key)]
                 (support/assert! (= expected (:page-access-status world))
                                  "Page access status does not match."
                                  {:expected expected
                                   :actual (:page-access-status world)})
                 world))}

   {:pattern #"^observer status is not <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [path-status-key]]
               (let [unexpected (support/require-example example path-status-key)]
                 (support/assert! (= "path missing" unexpected)
                                  "Unavailable target path status fixture is not canonical."
                                  {:path-status unexpected})
                 (support/assert! (not= unexpected (get-in world [:observer :status]))
                                  "Observer reported the wrong path status for page access failure."
                                  {:unexpected unexpected
                                   :observer (:observer world)})
                 world))}

   {:pattern #"^no empty page object is used as a successful page read$"
    :handler (fn [world _example _captures]
               (support/assert! (no-empty-page-object-used-as-successful-read?
                                 world)
                                "Empty page object was treated as a successful page read."
                                {:page-access-status (:page-access-status world)
                                 :active-page-read-result (:active-page-read-result world)})
               world)}

   {:pattern #"^observer status <([A-Za-z0-9_]+)> is shown for history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [status-key history-path-key]]
               (let [expected-status (support/require-example example status-key)
                     expected-path (support/require-example example history-path-key)]
                 (support/assert! (and (= expected-status (get-in world [:observer :status]))
                                       (= expected-path (get-in world [:observer :history-path])))
                                  "Observer status or path does not match."
                                  {:expected-status expected-status
                                   :expected-path expected-path
                                   :observer (:observer world)})
                 world))}

   {:pattern #"^the observer resolves <([A-Za-z0-9_]+)> from the selected target page window$"
    :handler (fn [world example [history-path-key]]
               (let [expected-path (support/require-example example history-path-key)]
                 (support/assert! (and (= "ready" (get-in world [:observer :status]))
                                       (= expected-path (get-in world [:observer :history-path]))
                                       (= (get-in world [:active-page-window :page-object])
                                          (:page-object world)))
                                  "Observer did not resolve from the active page window."
                                  {:observer (:observer world)
                                   :active-page-window (:active-page-window world)})
                 world))}

   {:pattern #"^no observer is active for history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected-path (support/require-example example history-path-key)]
                 (support/assert! (and (= expected-path (get-in world [:observer :history-path]))
                                       (zero? (get-in world [:observer :active-count])))
                                  "Observer is active for an unobservable page path."
                                  {:expected-path expected-path
                                   :observer (:observer world)})
                 world))}

   {:pattern #"^the page-owned history array contains entry <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key]]
               (let [event-name (support/require-example example event-name-key)]
                 (support/assert! (page-owned-history-entry? world event-name)
                                  "Page-owned history array does not contain entry."
                                  {:event-name event-name
                                   :page-object (:page-object world)})
                 world))}

   {:pattern #"^the extension records a new observed event entry$"
    :handler (fn [world _example _captures]
               (support/assert! (= "observed" (:type (last-observed-entry world)))
                                "Observed event entry was not recorded."
                                {:observed-entries (:observed-entries world)})
               world)}

   {:pattern #"^the observed event entry URL is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (let [expected (support/require-example example page-url-key)]
                 (support/assert! (= expected (:url (last-observed-entry world)))
                                  "Observed event URL does not match."
                                  {:expected expected
                                   :entry (last-observed-entry world)})
                 world))}

   {:pattern #"^the observed event entry timestamp is recorded$"
    :handler (fn [world _example _captures]
               (support/assert! (string? (:timestamp (last-observed-entry world)))
                                "Observed event timestamp was not recorded."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the observed event entry observer path is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (:observer-path (last-observed-entry world)))
                                  "Observed event path does not match."
                                  {:expected expected
                                   :entry (last-observed-entry world)})
                 world))}

   {:pattern #"^the observed event entry name is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key]]
               (let [expected (support/require-example example event-name-key)]
                 (support/assert! (= expected (:name (last-observed-entry world)))
                                  "Observed event name does not match."
                                  {:expected expected
                                   :entry (last-observed-entry world)})
                 world))}

   {:pattern #"^the observed event entry payload is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [payload-label-key]]
               (let [expected (support/require-example example payload-label-key)]
                 (support/assert! (= expected (:payload (last-observed-entry world)))
                                  "Observed event payload does not match."
                                  {:expected expected
                                   :entry (last-observed-entry world)})
                 world))}

   {:pattern #"^the observed event entry raw value is retained$"
    :handler (fn [world _example _captures]
               (support/assert! (contains? (last-observed-entry world) :raw-value)
                                "Observed event raw value was not retained."
                                {:entry (last-observed-entry world)})
               world)}

   {:pattern #"^the page calls push on the configured history array with entry <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key]]
               (let [event-name (support/require-example example event-name-key)
                     payload-label (str event-name "-payload")]
                 (-> world
                     (attach-observer {:history-path (:history-path world)
                                       :page-url "https://example.test/"})
                     (page-push event-name payload-label))))}

   {:pattern #"^the page push return value is preserved$"
    :handler (fn [world _example _captures]
               (support/assert! (= (count (path-value (:page-object world)
                                                      (get-in world [:observer :history-path])))
                                   (:push-return world))
                                "Page push return value was not preserved."
                                {:push-return (:push-return world)})
               world)}

   {:pattern #"^the original page push behavior is preserved$"
    :handler (fn [world _example _captures]
               (support/assert! (seq (path-value (:page-object world)
                                                 (get-in world [:observer :history-path])))
                                "Original page push behavior was not preserved."
                                {:page-object (:page-object world)})
               world)}

   {:pattern #"^the page-owned history array remains readable by page scripts$"
    :handler (fn [world _example _captures]
               (support/assert! (vector? (path-value (:page-object world)
                                                     (get-in world [:observer :history-path])))
                                "Page-owned history array is not readable."
                                {:page-object (:page-object world)})
               world)}

   {:pattern #"^the extension records entry <([A-Za-z0-9_]+)> without causing a page script error$"
    :handler (fn [world example [event-name-key]]
               (let [expected (support/require-example example event-name-key)]
                 (support/assert! (nil? (:page-error world))
                                  "Page script error was caused by observer."
                                  {:page-error (:page-error world)})
                 (support/assert! (= expected (:name (last-observed-entry world)))
                                  "Observed event name does not match."
                                  {:expected expected
                                   :entry (last-observed-entry world)})
                 world))}

   {:pattern #"^the observer is attached on page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [start-url-key]]
               (attach-observer world
                                {:history-path (:history-path world)
                                 :page-url (support/require-example example start-url-key)}))}

   {:pattern #"^observation is attached on page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (attach-observation-on-page
                world
                (support/require-example example page-url-key)))}

   {:pattern #"^the selected target tab navigates to page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [next-url-key]]
               (target-support/validate-all-example-values! example)
               (let [next-url (support/require-example example next-url-key)]
                 (-> world
                     (update :session-state session/navigate-session next-url)
                     (reinstall-observer {:history-path (:history-path world)
                                          :page-url next-url}))))}

   {:pattern #"^the selected target tab navigates to page <([A-Za-z0-9_]+)> where history array path <([A-Za-z0-9_]+)> becomes ready after pageload$"
    :handler (fn [world example [next-url-key history-path-key]]
               (target-support/validate-all-example-values! example)
               (navigate-with-delayed-history-path
                world
                {:page-url (support/require-example example next-url-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^page <([A-Za-z0-9_]+)> reloads and history array path <([A-Za-z0-9_]+)> is missing until after pageload$"
    :handler (fn [world example [page-url-key history-path-key]]
               (reload-with-delayed-history-path
                world
                {:page-url (support/require-example example page-url-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^observation refreshes automatically for page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (let [expected-page-url (support/require-example example page-url-key)
                     root (support/repository-root)
                     files (capture-wiring/files
                            root
                            ["src/active-page-observation.ts"
                             "src/data-layer-observation-refresh.ts"
                             "src/data-layer-live-observation.ts"])]
                 (support/assert! (pageload-observation-refresh-wired? files)
                                  "Pageload observation refresh is not wired."
                                  {})
                 (support/assert! (and (automatic-pageload-observation-refresh? world)
                                       (= expected-page-url (get-in world [:observer :page-url])))
                                  "Observation did not refresh automatically for the pageload."
                                  {:observer (:observer world)
                                  :expected-page-url expected-page-url})
                 world))}

   {:pattern #"^the pageload refresh starts from the canonical page URL$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-refresh-start-page-url
                                   (:attached-observation-page-url world))
                                "Pageload refresh did not start from the canonical page URL."
                                {:expected canonical-refresh-start-page-url
                                 :attached-page-url
                                 (:attached-observation-page-url world)})
               world)}

   {:pattern #"^the pageload refresh uses the canonical product page URL$"
    :handler (fn [world _example _captures]
               (support/assert! (and (= canonical-refresh-product-page-url
                                      (get-in world [:observer :page-url]))
                                     (some #{canonical-refresh-product-page-url}
                                           (page-entry-urls world)))
                                "Pageload refresh did not use the canonical product page URL."
                                {:expected canonical-refresh-product-page-url
                                 :observer (:observer world)
                                 :page-entry-urls (page-entry-urls world)})
               world)}

   {:pattern #"^the pageload refresh uses the canonical reload page URL$"
    :handler (fn [world _example _captures]
               (support/assert! (and (= canonical-refresh-start-page-url
                                      (get-in world [:observer :page-url]))
                                     (some #{canonical-refresh-start-page-url}
                                           (page-entry-urls world)))
                                "Pageload refresh did not use the canonical reload page URL."
                                {:expected canonical-refresh-start-page-url
                                 :observer (:observer world)
                                 :page-entry-urls (page-entry-urls world)})
               world)}

   {:pattern #"^no manual observation restart is required$"
    :handler (fn [world _example _captures]
               (support/assert! (false? (:manual-observation-restart-required? world))
                                "Manual observation restart was required."
                                {:manual-observation-restart-required?
                                 (:manual-observation-restart-required? world)})
               world)}

   {:pattern #"^observation waits for history array path <([A-Za-z0-9_]+)> to become ready$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (:waited-for-history-path world))
                                  "Observation did not wait for the history path."
                                  {:expected expected
                                   :waited-for-history-path
                                   (:waited-for-history-path world)})
                 world))}

   {:pattern #"^the pageload refresh uses the canonical history path$"
    :handler (fn [world _example _captures]
               (support/assert! (and (= canonical-refresh-history-path
                                      (:waited-for-history-path world))
                                     (= canonical-refresh-history-path
                                        (:ready-push-history-path world)))
                                "Pageload refresh did not use the canonical history path."
                                {:expected canonical-refresh-history-path
                                 :waited-for-history-path
                                 (:waited-for-history-path world)
                                 :ready-push-history-path
                                 (:ready-push-history-path world)})
               world)}

   {:pattern #"^the pageload refresh captures the canonical event$"
    :handler (fn [world _example _captures]
               (support/assert! (last-observed-entry-value-matches?
                                 world
                                 :name
                                 canonical-refresh-event-name)
                                "Pageload refresh did not capture the canonical event."
                                {:expected canonical-refresh-event-name
                                 :entry (last-observed-entry world)})
               world)}

   {:pattern #"^entry <([A-Za-z0-9_]+)> pushed after history array path <([A-Za-z0-9_]+)> is ready is captured once with URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key history-path-key page-url-key]]
               (let [event-name (support/require-example example event-name-key)
                     history-path (support/require-example example history-path-key)
                     page-url (support/require-example example page-url-key)
                     after-push (page-push-after-ready world event-name history-path)
                     matching-entries (filter #(and (= event-name (:name %))
                                                    (= history-path (:observer-path %))
                                                    (= page-url (:url %)))
                                              (:observed-entries after-push))]
                 (support/assert! (and (:ready-push-captured-once? after-push)
                                       (= 1 (count matching-entries)))
                                  "Entry pushed after pageload readiness was not captured exactly once."
                                  {:observed-entries (:observed-entries after-push)
                                   :event-name event-name
                                   :history-path history-path
                                   :page-url page-url})
                 after-push))}

   {:pattern #"^the observer is reinstalled for history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (and (= "ready" (get-in world [:observer :status]))
                                       (= expected (get-in world [:observer :history-path])))
                                  "Observer was not reinstalled for history path."
                                  {:observer (:observer world)
                                   :expected expected})
                 world))}

   {:pattern #"^exactly one observer is active for the page$"
    :handler (fn [world _example _captures]
               (support/assert! (= 1 (get-in world [:observer :active-count]))
                                "Observer active count is incorrect."
                                {:observer (:observer world)})
               world)}

   {:pattern #"^entries added after navigation are captured once with URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [next-url-key]]
               (let [next-url (support/require-example example next-url-key)
                     after-push (page-push world "after-navigation" "after-navigation-payload")]
                 (support/assert! (= 1 (observed-entry-count-for-url after-push next-url))
                                  "Entry after navigation was not captured exactly once."
                                  {:observed-entries (:observed-entries after-push)
                                   :next-url next-url})
                 after-push))}

   {:pattern #"^the configured history array path cannot be observed$"
    :handler (fn [world _example _captures]
               (attach-observer world
                                {:history-path (:history-path world)
                                 :page-url "https://example.test/"}))}

   {:pattern #"^the observer reports status <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [status-key]]
               (let [expected (support/require-example example status-key)]
                 (support/assert! (= expected (get-in world [:observer :status]))
                                  "Observer status does not match."
                                  {:expected expected
                                   :observer (:observer world)})
                 world))}

   {:pattern #"^the observer does not break the page$"
    :handler (fn [world _example _captures]
               (support/assert! (nil? (:page-error world))
                                "Observer broke the page."
                                {:page-error (:page-error world)})
               world)}

   ])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-30T19:51:19.920415764+02:00", :module-hash "-587599785", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 8, :hash "-1450000498"} {:id "def/observer-timestamp", :kind "def", :line 10, :end-line 10, :hash "-543117546"} {:id "def/page-access-available", :kind "def", :line 11, :end-line 11, :hash "1021205454"} {:id "def/page-access-unavailable", :kind "def", :line 12, :end-line 12, :hash "-159061251"} {:id "def/canonical-live-page-url", :kind "def", :line 13, :end-line 13, :hash "-1001705326"} {:id "def/canonical-live-history-path", :kind "def", :line 14, :end-line 14, :hash "430921171"} {:id "def/canonical-live-event-name", :kind "def", :line 15, :end-line 15, :hash "-278301589"} {:id "def/canonical-live-values-payload", :kind "def", :line 16, :end-line 16, :hash "-336993088"} {:id "def/canonical-live-queued-payload", :kind "def", :line 17, :end-line 17, :hash "1581810357"} {:id "def/canonical-refresh-start-page-url", :kind "def", :line 18, :end-line 18, :hash "581984419"} {:id "def/canonical-refresh-product-page-url", :kind "def", :line 19, :end-line 19, :hash "-893289465"} {:id "def/canonical-refresh-history-path", :kind "def", :line 20, :end-line 20, :hash "1227914912"} {:id "def/canonical-refresh-event-name", :kind "def", :line 21, :end-line 21, :hash "-1241735273"} {:id "defn-/path-parts", :kind "defn-", :line 23, :end-line 27, :hash "-927344887"} {:id "defn-/default-page-object", :kind "defn-", :line 29, :end-line 30, :hash "-1197766728"} {:id "defn-/path-value", :kind "defn-", :line 32, :end-line 33, :hash "-829861200"} {:id "defn-/state-page-object", :kind "defn-", :line 35, :end-line 36, :hash "-1100126754"} {:id "defn-/history-entry", :kind "defn-", :line 38, :end-line 40, :hash "998012623"} {:id "defn-/observed-entry", :kind "defn-", :line 42, :end-line 49, :hash "-1542851697"} {:id "defn-/observer-active-count", :kind "defn-", :line 51, :end-line 52, :hash "902432156"} {:id "defn-/observer-state", :kind "defn-", :line 54, :end-line 58, :hash "-82893434"} {:id "defn/attach-observer", :kind "defn", :line 60, :end-line 65, :hash "237785604"} {:id "defn/reinstall-observer", :kind "defn", :line 67, :end-line 68, :hash "1719709699"} {:id "defn-/observer-ready?", :kind "defn-", :line 70, :end-line 71, :hash "1438723476"} {:id "defn-/capture-observed-entry-in-session", :kind "defn-", :line 73, :end-line 76, :hash "1791613681"} {:id "defn-/record-observed-entry", :kind "defn-", :line 78, :end-line 82, :hash "-15442940"} {:id "defn-/observed-push-state", :kind "defn-", :line 84, :end-line 91, :hash "314008729"} {:id "defn/page-push", :kind "defn", :line 93, :end-line 98, :hash "185135583"} {:id "defn/last-observed-entry", :kind "defn", :line 100, :end-line 101, :hash "1949503151"} {:id "def/forbidden-observer-capability-patterns", :kind "def", :line 103, :end-line 109, :hash "1988294335"} {:id "defn/forbidden-observer-capability-findings", :kind "defn", :line 111, :end-line 112, :hash "-2041958460"} {:id "defn/forbidden-observer-capability-findings-of-kind", :kind "defn", :line 114, :end-line 115, :hash "-2013104862"} {:id "defn-/inspect-observer-implementation", :kind "defn-", :line 117, :end-line 121, :hash "481674850"} {:id "defn-/observed-entry-count-for-url", :kind "defn-", :line 123, :end-line 124, :hash "1622256758"} {:id "defn-/page-object-with-history-path", :kind "defn-", :line 126, :end-line 127, :hash "1438825497"} {:id "defn/define-active-page-window", :kind "defn", :line 129, :end-line 135, :hash "722482812"} {:id "defn/define-active-page-window-with-entry", :kind "defn", :line 137, :end-line 149, :hash "248890880"} {:id "defn/define-active-page-window-without-path", :kind "defn", :line 151, :end-line 157, :hash "-2094256586"} {:id "defn/define-unreadable-active-page", :kind "defn", :line 159, :end-line 162, :hash "1997682987"} {:id "defn-/page-access-unavailable?", :kind "defn-", :line 164, :end-line 165, :hash "-574890056"} {:id "defn-/unavailable-observer-state", :kind "defn-", :line 167, :end-line 171, :hash "-730784785"} {:id "defn/read-active-page-history-path", :kind "defn", :line 173, :end-line 189, :hash "987951799"} {:id "defn/start-active-page-observation", :kind "defn", :line 191, :end-line 192, :hash "449929788"} {:id "defn-/capture-queued-history-entries", :kind "defn-", :line 194, :end-line 199, :hash "-927592513"} {:id "defn/start-side-panel-live-capture", :kind "defn", :line 201, :end-line 211, :hash "1139164755"} {:id "defn/active-page-read-succeeded?", :kind "defn", :line 213, :end-line 214, :hash "-661864035"} {:id "defn/active-page-read-result-includes-path?", :kind "defn", :line 216, :end-line 218, :hash "220393329"} {:id "defn/active-page-read-result-not-empty?", :kind "defn", :line 220, :end-line 223, :hash "1552896192"} {:id "defn/no-empty-page-object-used-as-successful-read?", :kind "defn", :line 225, :end-line 227, :hash "-2119558816"} {:id "defn/page-owned-history-entry?", :kind "defn", :line 229, :end-line 232, :hash "-71693891"} {:id "defn/active-page-window-observation-wired?", :kind "defn", :line 234, :end-line 235, :hash "182848241"} {:id "def/live-history-push-capture-wired?", :kind "def", :line 237, :end-line 237, :hash "2035039923"} {:id "def/pageload-observation-refresh-wired?", :kind "def", :line 238, :end-line 238, :hash "1980314472"} {:id "defn/attach-observation-on-page", :kind "defn", :line 240, :end-line 246, :hash "334655874"} {:id "defn-/prepare-pageload-refresh", :kind "defn-", :line 248, :end-line 255, :hash "1821917368"} {:id "defn/navigate-with-delayed-history-path", :kind "defn", :line 257, :end-line 264, :hash "-969005441"} {:id "defn/reload-with-delayed-history-path", :kind "defn", :line 266, :end-line 268, :hash "-1139006143"} {:id "defn/automatic-pageload-observation-refresh?", :kind "defn", :line 270, :end-line 273, :hash "1316548139"} {:id "defn/page-push-after-ready", :kind "defn", :line 275, :end-line 281, :hash "-1956911468"} {:id "defn/session-timeline", :kind "defn", :line 283, :end-line 284, :hash "1127872695"} {:id "defn-/page-entry-urls", :kind "defn-", :line 286, :end-line 290, :hash "140327519"} {:id "defn-/observed-event-entry?", :kind "defn-", :line 292, :end-line 294, :hash "-1210141698"} {:id "defn/session-timeline-shows-page-and-observed?", :kind "defn", :line 296, :end-line 300, :hash "-767572741"} {:id "defn/observed-entry-matches?", :kind "defn", :line 302, :end-line 305, :hash "525932857"} {:id "defn-/last-observed-entry-value-matches?", :kind "defn-", :line 307, :end-line 308, :hash "52313770"} {:id "def/handlers", :kind "def", :line 310, :end-line 929, :hash "-691094102"}]}
;; clj-mutate-manifest-end
