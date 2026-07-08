(ns acceptance.steps.data-layer-observer
  (:require [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def observer-timestamp "2026-07-08T00:00:00Z")

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

(defn attach-observer [state {:keys [history-path page-url]}]
  (let [page-object (state-page-object state)
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

(defn- observed-push-state [state observer raw-value]
  (let [parts (path-parts (:history-path observer))
        page-object (update-in (:page-object state) parts conj raw-value)
        push-return (count (get-in page-object parts))
        entry (observed-entry observer raw-value)]
    (-> state
        (assoc :page-object page-object
               :push-return push-return)
        (update :observed-entries (fnil conj []) entry)
        (capture-observed-entry-in-session entry))))

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
  {"src/data-layer-observer.ts" (support/source-file root "src/data-layer-observer.ts")
   "src/side-panel.ts" (support/source-file root "src/side-panel.ts")})

(defn- observed-entry-count-for-url [state url]
  (count (filter #(= url (:url %)) (:observed-entries state))))

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
;; {:version 1, :tested-at "2026-07-08T22:59:15.264981833+02:00", :module-hash "-1104607354", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1269664543"} {:id "def/observer-timestamp", :kind "def", :line 7, :end-line nil, :hash "-543117546"} {:id "defn-/path-parts", :kind "defn-", :line 9, :end-line nil, :hash "-927344887"} {:id "defn-/default-page-object", :kind "defn-", :line 15, :end-line nil, :hash "-1197766728"} {:id "defn-/path-value", :kind "defn-", :line 18, :end-line nil, :hash "-829861200"} {:id "defn-/state-page-object", :kind "defn-", :line 21, :end-line nil, :hash "-1100126754"} {:id "defn-/history-entry", :kind "defn-", :line 24, :end-line nil, :hash "998012623"} {:id "defn-/observed-entry", :kind "defn-", :line 28, :end-line nil, :hash "-1542851697"} {:id "defn-/observer-active-count", :kind "defn-", :line 37, :end-line nil, :hash "902432156"} {:id "defn-/observer-state", :kind "defn-", :line 40, :end-line nil, :hash "-82893434"} {:id "defn/attach-observer", :kind "defn", :line 46, :end-line nil, :hash "2100631144"} {:id "defn/reinstall-observer", :kind "defn", :line 53, :end-line nil, :hash "1719709699"} {:id "defn-/observer-ready?", :kind "defn-", :line 56, :end-line nil, :hash "1438723476"} {:id "defn-/capture-observed-entry-in-session", :kind "defn-", :line 59, :end-line nil, :hash "1791613681"} {:id "defn-/observed-push-state", :kind "defn-", :line 64, :end-line nil, :hash "841120218"} {:id "defn/page-push", :kind "defn", :line 75, :end-line nil, :hash "185135583"} {:id "defn/last-observed-entry", :kind "defn", :line 82, :end-line nil, :hash "1949503151"} {:id "def/forbidden-observer-capability-patterns", :kind "def", :line 85, :end-line nil, :hash "1988294335"} {:id "defn/forbidden-observer-capability-findings", :kind "defn", :line 93, :end-line nil, :hash "-2041958460"} {:id "defn/forbidden-observer-capability-findings-of-kind", :kind "defn", :line 96, :end-line nil, :hash "-1569042742"} {:id "defn-/inspect-observer-implementation", :kind "defn-", :line 99, :end-line nil, :hash "1403940418"} {:id "defn-/observed-entry-count-for-url", :kind "defn-", :line 103, :end-line nil, :hash "838017073"} {:id "def/handlers", :kind "def", :line 106, :end-line nil, :hash "79991701"}]}
;; clj-mutate-manifest-end
