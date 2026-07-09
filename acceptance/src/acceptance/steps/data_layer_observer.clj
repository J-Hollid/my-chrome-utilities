(ns acceptance.steps.data-layer-observer
  (:require [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-session :as session]
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
  (support/source-file-map root
                           ["src/data-layer-observer.ts"
                            "src/data-layer-live-observation.ts"
                            "src/side-panel.ts"]))

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
  (let [side-panel-source (get files "src/side-panel.ts" "")
        active-page-source (get files "src/active-page-observation.ts" "")
        manifest-source (get files "manifest.json" "")]
    (and (str/includes? manifest-source "\"scripting\"")
         (str/includes? side-panel-source "activePageObservation")
         (str/includes? active-page-source "activeTabPageObject")
         (str/includes? active-page-source "chrome.scripting.executeScript")
         (str/includes? active-page-source "world: \"MAIN\"")
         (str/includes? active-page-source "pageObject")
         (str/includes? active-page-source "pageAccessStatus")
         (str/includes? active-page-source page-access-unavailable))))

(defn live-history-push-capture-wired? [files]
  (let [side-panel-source (get files "src/side-panel.ts" "")
        observer-source (get files "src/data-layer-observer.ts" "")
        live-observation-source (get files "src/data-layer-live-observation.ts" "")]
    (and (str/includes? side-panel-source "activePageObservation")
         (str/includes? side-panel-source "attachHistoryArrayObserver")
         (str/includes? side-panel-source "startLiveHistoryPushCapture")
         (str/includes? side-panel-source "appendObservedHistoryEntry")
         (str/includes? observer-source "appendObservedHistoryEntry")
         (str/includes? observer-source "captureExistingHistoryEntries")
         (str/includes? live-observation-source "chrome.scripting.executeScript")
         (str/includes? live-observation-source "chrome.runtime.onMessage.addListener")
         (str/includes? live-observation-source "CustomEvent")
         (str/includes? live-observation-source ".push"))))

(defn session-timeline [state]
  (get-in state [:session-state :session :timeline]))

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
  [{:pattern #"^page <([A-Za-z0-9_]+)> appends history entry <([A-Za-z0-9_]+)> with payload <([A-Za-z0-9_]+)>$"
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

   {:pattern #"^data layer testing is started from the side panel for the active website page$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     files (support/source-file-map root
                                                    ["src/side-panel.ts"
                                                     "src/data-layer-observer.ts"
                                                     "src/data-layer-live-observation.ts"])]
                 (support/assert! (live-history-push-capture-wired? files)
                                  "Live history push capture is not wired."
                                  {})
                 (start-side-panel-live-capture world)))}

   {:pattern #"^the active website page pushes history entry <([A-Za-z0-9_]+)> with payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key payload-label-key]]
               (page-push world
                          (support/require-example example event-name-key)
                          (support/require-example example payload-label-key)))}

   {:pattern #"^the side panel session timeline shows initial page entry <([A-Za-z0-9_]+)> and observed event <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key event-name-key]]
               (let [page-url (support/require-example example page-url-key)
                     event-name (support/require-example example event-name-key)]
                 (support/assert! (session-timeline-shows-page-and-observed?
                                   world
                                   page-url
                                   event-name)
                                  "Session timeline does not show the initial page and observed event."
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

   {:pattern #"^active website page <([A-Za-z0-9_]+)> defines history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key history-path-key]]
               (define-active-page-window
                world
                {:page-url (support/require-example example page-url-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^active website page <([A-Za-z0-9_]+)> defines history array path <([A-Za-z0-9_]+)> with existing entry <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key history-path-key event-name-key]]
               (define-active-page-window-with-entry
                world
                {:page-url (support/require-example example page-url-key)
                 :history-path (support/require-example example history-path-key)
                 :event-name (support/require-example example event-name-key)}))}

   {:pattern #"^active website page <([A-Za-z0-9_]+)> does not define history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key _history-path-key]]
               (define-active-page-window-without-path
                world
                {:page-url (support/require-example example page-url-key)}))}

   {:pattern #"^active website page <([A-Za-z0-9_]+)> cannot be read by the extension$"
    :handler (fn [world example [page-url-key]]
               (define-unreadable-active-page
                world
                {:page-url (support/require-example example page-url-key)}))}

   {:pattern #"^the extension reads history array path <([A-Za-z0-9_]+)> from the active website page$"
    :handler (fn [world example [history-path-key]]
               (read-active-page-history-path
                world
                (support/require-example example history-path-key)))}

   {:pattern #"^observation starts for the active website page$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     files {"src/side-panel.ts" (support/source-file root "src/side-panel.ts")
                            "src/active-page-observation.ts" (support/source-file root "src/active-page-observation.ts")
                            "manifest.json" (support/source-file root "manifest.json")}]
                 (support/assert! (active-page-window-observation-wired? files)
                                  "Active page window observation is not wired."
                                  {})
                 (start-active-page-observation world)))}

   {:pattern #"^the active page read succeeds$"
    :handler (fn [world _example _captures]
               (support/assert! (active-page-read-succeeded? world)
                                "Active page read did not succeed."
                                {:page-access-status (:page-access-status world)})
               world)}

   {:pattern #"^the active page read result includes history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [history-path (support/require-example example history-path-key)]
                 (support/assert! (active-page-read-result-includes-path?
                                   world
                                   history-path)
                                  "Active page read result does not include history path."
                                  {:history-path history-path
                                   :active-page-read-result (:active-page-read-result world)})
                 world))}

   {:pattern #"^the active page read result is not empty$"
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

   {:pattern #"^the observer resolves <([A-Za-z0-9_]+)> from the active website page window$"
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

   {:pattern #"^the active tab navigates to page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [next-url-key]]
               (let [next-url (support/require-example example next-url-key)]
                 (-> world
                     (update :session-state session/navigate-session next-url)
                     (reinstall-observer {:history-path (:history-path world)
                                          :page-url next-url}))))}

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

   {:pattern #"^data layer observer capabilities are inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :observer-files (inspect-observer-implementation root))))}

   {:pattern #"^object push events with event fields are not observed$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-observer-capability-findings-of-kind
                               (:observer-files world)
                               :object-push-events)
                     object-state (attach-observer {:page-object {:queue {:history {:push []
                                                                                    :event "signup"}}}}
                                                   {:history-path "queue.history"
                                                    :page-url "https://example.test/"})]
                 (support/assert! (empty? findings)
                                  "Object push event observation was found."
                                  {:findings (vec findings)})
                 (support/assert! (not= "ready" (get-in object-state [:observer :status]))
                                  "Object push event path was observed."
                                  {:observer (:observer object-state)})
                 world))}

   {:pattern #"^analytics beacons are not observed$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-observer-capability-findings-of-kind
                               (:observer-files world)
                               :analytics-beacons)]
                 (support/assert! (empty? findings)
                                  "Analytics beacon observation was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^object snapshots are not captured$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-observer-capability-findings-of-kind
                               (:observer-files world)
                               :object-snapshots)]
                 (support/assert! (empty? findings)
                                  "Object snapshot capture was found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-09T16:51:44.516600461+02:00", :module-hash "-1105738953", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1269664543"} {:id "def/observer-timestamp", :kind "def", :line 7, :end-line nil, :hash "-543117546"} {:id "def/page-access-available", :kind "def", :line 8, :end-line nil, :hash "1021205454"} {:id "def/page-access-unavailable", :kind "def", :line 9, :end-line nil, :hash "-159061251"} {:id "def/canonical-live-page-url", :kind "def", :line 10, :end-line nil, :hash "-1001705326"} {:id "def/canonical-live-history-path", :kind "def", :line 11, :end-line nil, :hash "430921171"} {:id "def/canonical-live-event-name", :kind "def", :line 12, :end-line nil, :hash "-278301589"} {:id "def/canonical-live-values-payload", :kind "def", :line 13, :end-line nil, :hash "-336993088"} {:id "def/canonical-live-queued-payload", :kind "def", :line 14, :end-line nil, :hash "1581810357"} {:id "defn-/path-parts", :kind "defn-", :line 16, :end-line nil, :hash "-927344887"} {:id "defn-/default-page-object", :kind "defn-", :line 22, :end-line nil, :hash "-1197766728"} {:id "defn-/path-value", :kind "defn-", :line 25, :end-line nil, :hash "-829861200"} {:id "defn-/state-page-object", :kind "defn-", :line 28, :end-line nil, :hash "-1100126754"} {:id "defn-/history-entry", :kind "defn-", :line 31, :end-line nil, :hash "998012623"} {:id "defn-/observed-entry", :kind "defn-", :line 35, :end-line nil, :hash "-1542851697"} {:id "defn-/observer-active-count", :kind "defn-", :line 44, :end-line nil, :hash "902432156"} {:id "defn-/observer-state", :kind "defn-", :line 47, :end-line nil, :hash "-82893434"} {:id "defn/attach-observer", :kind "defn", :line 53, :end-line nil, :hash "237785604"} {:id "defn/reinstall-observer", :kind "defn", :line 60, :end-line nil, :hash "1719709699"} {:id "defn-/observer-ready?", :kind "defn-", :line 63, :end-line nil, :hash "1438723476"} {:id "defn-/capture-observed-entry-in-session", :kind "defn-", :line 66, :end-line nil, :hash "1791613681"} {:id "defn-/record-observed-entry", :kind "defn-", :line 71, :end-line nil, :hash "-15442940"} {:id "defn-/observed-push-state", :kind "defn-", :line 77, :end-line nil, :hash "314008729"} {:id "defn/page-push", :kind "defn", :line 86, :end-line nil, :hash "185135583"} {:id "defn/last-observed-entry", :kind "defn", :line 93, :end-line nil, :hash "1949503151"} {:id "def/forbidden-observer-capability-patterns", :kind "def", :line 96, :end-line nil, :hash "1988294335"} {:id "defn/forbidden-observer-capability-findings", :kind "defn", :line 104, :end-line nil, :hash "-2041958460"} {:id "defn/forbidden-observer-capability-findings-of-kind", :kind "defn", :line 107, :end-line nil, :hash "-1569042742"} {:id "defn-/inspect-observer-implementation", :kind "defn-", :line 110, :end-line nil, :hash "-1647754979"} {:id "defn-/observed-entry-count-for-url", :kind "defn-", :line 116, :end-line nil, :hash "838017073"} {:id "defn-/page-object-with-history-path", :kind "defn-", :line 119, :end-line nil, :hash "1438825497"} {:id "defn/define-active-page-window", :kind "defn", :line 122, :end-line nil, :hash "722482812"} {:id "defn/define-active-page-window-with-entry", :kind "defn", :line 130, :end-line nil, :hash "248890880"} {:id "defn/define-active-page-window-without-path", :kind "defn", :line 144, :end-line nil, :hash "-2094256586"} {:id "defn/define-unreadable-active-page", :kind "defn", :line 152, :end-line nil, :hash "1997682987"} {:id "defn-/page-access-unavailable?", :kind "defn-", :line 157, :end-line nil, :hash "-574890056"} {:id "defn-/unavailable-observer-state", :kind "defn-", :line 160, :end-line nil, :hash "-730784785"} {:id "defn/read-active-page-history-path", :kind "defn", :line 166, :end-line nil, :hash "987951799"} {:id "defn/start-active-page-observation", :kind "defn", :line 184, :end-line nil, :hash "449929788"} {:id "defn-/capture-queued-history-entries", :kind "defn-", :line 187, :end-line nil, :hash "-1560026941"} {:id "defn/start-side-panel-live-capture", :kind "defn", :line 194, :end-line nil, :hash "1139164755"} {:id "defn/active-page-read-succeeded?", :kind "defn", :line 206, :end-line nil, :hash "-661864035"} {:id "defn/active-page-read-result-includes-path?", :kind "defn", :line 209, :end-line nil, :hash "220393329"} {:id "defn/active-page-read-result-not-empty?", :kind "defn", :line 213, :end-line nil, :hash "1552896192"} {:id "defn/no-empty-page-object-used-as-successful-read?", :kind "defn", :line 218, :end-line nil, :hash "-2119558816"} {:id "defn/page-owned-history-entry?", :kind "defn", :line 222, :end-line nil, :hash "-2036718304"} {:id "defn/active-page-window-observation-wired?", :kind "defn", :line 227, :end-line nil, :hash "-1966966963"} {:id "defn/live-history-push-capture-wired?", :kind "defn", :line 240, :end-line nil, :hash "-1057385612"} {:id "defn/session-timeline", :kind "defn", :line 255, :end-line nil, :hash "1127872695"} {:id "defn-/observed-event-entry?", :kind "defn-", :line 258, :end-line nil, :hash "-1210141698"} {:id "defn/session-timeline-shows-page-and-observed?", :kind "defn", :line 262, :end-line nil, :hash "176239236"} {:id "defn/observed-entry-matches?", :kind "defn", :line 268, :end-line nil, :hash "525932857"} {:id "defn-/last-observed-entry-value-matches?", :kind "defn-", :line 273, :end-line nil, :hash "52313770"} {:id "def/handlers", :kind "def", :line 276, :end-line nil, :hash "-1003096194"}]}
;; clj-mutate-manifest-end
