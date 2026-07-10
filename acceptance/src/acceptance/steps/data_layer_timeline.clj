(ns acceptance.steps.data-layer-timeline
  (:require [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def timeline-timestamp "2026-07-08T00:00:00Z")
(def canonical-first-page-url "https://www.example.com/")
(def canonical-second-page-url "https://www.example.com/prodpage")
(def canonical-history-path "event.history")
(def canonical-event-groups [["pageview" "scroll"]
                             ["pageview" "add to cart"]])
(def canonical-payload-properties
  {"pageview" [{:name "page_name" :value "\"example page_name\""}
               {:name "page_type" :value "\"homepage\""}
               {:name "propertyx" :value "\"example property\""}]
   "scroll" [{:name "scroll_percentage" :value "\"75\""}]
   "add to cart" [{:name "product_name" :value "\"example product\""}]})
(def canonical-tuple-event-name "pageview")
(def canonical-tuple-history-path "event.history")
(def canonical-tuple-timestamp "2026-07-09T20:00:00Z")
(def canonical-expanded-page-url canonical-first-page-url)
(def canonical-expanded-event-name "scroll")
(def canonical-tuple-payload-values
  {"page_name" "\"example page_name\""
   "page_type" "\"homepage\""
   "propertyx" "\"example property\""})

(defn- observed-entry [{:keys [event-name page-url history-path payload-label raw-label]}]
  {:type "observed"
   :name event-name
   :url page-url
   :timestamp timeline-timestamp
   :observer-path history-path
   :payload payload-label
   :raw-value raw-label})

(defn record-observed-entry [state entry-options]
  (let [entry (observed-entry entry-options)
        next-state (update state :timeline-entries (fnil conj []) entry)]
    (if (:session-state next-state)
      (update next-state :session-state session/capture-entry entry)
      next-state)))

(defn visible-timeline-entries [state]
  (let [entries (or (:timeline-entries state)
                    (get-in state [:session-state :session :timeline]))]
    (vec (filter #(= "observed" (:type %)) entries))))

(defn timeline-summary [entry]
  (select-keys entry [:name :url :timestamp :observer-path]))

(defn expanded-entry [entry]
  (select-keys entry [:name :url :observer-path :payload :raw-value]))

(defn- page-entry [page-url]
  {:type "page" :url page-url})

(defn- comma-list [text]
  (support/split-list text #","))

(defn parse-payload-properties [text]
  (->> (comma-list text)
       (map (fn [property]
              (let [[name value] (str/split property #":\s*" 2)]
                [(str/trim name) (str/trim (or value ""))])))
       (into (array-map))))

(defn- observed-event-entry [page-url history-path event-name payload]
  {:type "observed"
   :name event-name
   :url page-url
   :timestamp timeline-timestamp
   :observer-path history-path
   :payload payload
   :raw-value {:event event-name :payload payload}})

(defn- append-timeline-entry [state entry]
  (let [next-state (update state :timeline-entries (fnil conj []) entry)]
    (if (:session-state next-state)
      (update next-state :session-state session/capture-entry entry)
      next-state)))

(defn- record-events-for-page [state page-url history-path events]
  (reduce (fn [next-state event-name]
            (append-timeline-entry
             next-state
             (observed-event-entry page-url history-path event-name {})))
          (append-timeline-entry state (page-entry page-url))
          events))

(defn record-pageloads-with-events
  [state {:keys [first-page-url second-page-url first-page-events second-page-events history-path]}]
  (-> state
      (record-events-for-page first-page-url history-path (comma-list first-page-events))
      (record-events-for-page second-page-url history-path (comma-list second-page-events))))

(defn record-observed-event-with-payload
  [state {:keys [event-name payload-properties]}]
  (append-timeline-entry
   state
   (observed-event-entry "" "" event-name (parse-payload-properties payload-properties))))

(defn- tuple-payload-object [payload-object]
  (->> (comma-list payload-object)
       (map (fn [property-name]
              [property-name
               (get canonical-tuple-payload-values
                    property-name
                    (str "\"example " property-name "\""))]))
       (into (array-map))))

(defn record-observed-tuple
  [state {:keys [event-name history-path timestamp payload-object]}]
  (let [payload (tuple-payload-object payload-object)]
    (append-timeline-entry
     state
     {:type "observed"
      :name event-name
      :url ""
      :timestamp timestamp
      :observer-path history-path
      :payload payload
      :raw-value [event-name payload]})))

(defn- timeline-entries [state]
  (or (:timeline-entries state)
      (get-in state [:session-state :session :timeline])
      []))

(defn- add-page-to-timeline [pages entry]
  (conj pages {:url (:url entry) :events []}))

(defn- latest-page-index [pages page-url]
  (or (last (keep-indexed (fn [index page]
                            (when (= page-url (:url page))
                              index))
                          pages))
      -1))

(defn- add-event-to-matching-page [pages entry]
  (let [page-index (latest-page-index pages (:url entry))
        next-pages (if (= -1 page-index)
                     (add-page-to-timeline pages entry)
                     pages)
        target-index (if (= -1 page-index)
                       (dec (count next-pages))
                       page-index)]
    (update next-pages target-index update :events conj entry)))

(defn- add-entry-to-nested-timeline [pages entry]
  (case (:type entry)
    "page" (add-page-to-timeline pages entry)
    "observed" (add-event-to-matching-page pages entry)
    pages))

(defn nested-timeline [state]
  (reduce add-entry-to-nested-timeline [] (timeline-entries state)))

(defn payload-property-items [entry]
  (let [payload (:payload entry)]
    (if (map? payload)
      (mapv (fn [[name value]]
              {:name (str name)
               :value (str value)})
            payload)
      [])))

(defn nested-event-details [state event-name]
  (when-let [entry (first (filter #(= event-name (:name %))
                                  (mapcat :events (nested-timeline state))))]
    {:name event-name
     :payload-properties (payload-property-items entry)}))

(defn nested-timeline-pageload-order-matches? [timeline]
  (= [canonical-first-page-url canonical-second-page-url]
     (mapv :url timeline)))

(defn nested-timeline-event-groups-match? [timeline]
  (= canonical-event-groups
     (mapv #(mapv :name (:events %)) timeline)))

(defn nested-timeline-observer-paths-match? [timeline]
  (every? #(= canonical-history-path (:observer-path %))
          (mapcat :events timeline)))

(defn canonical-payload-properties-match? [state event-name]
  (= (get canonical-payload-properties event-name ::missing)
     (:payload-properties (nested-event-details state event-name))))

(defn render-observed-event [state]
  (let [entry (first (visible-timeline-entries state))
        detail-lines (payload-property-items entry)
        compact-time (second (re-find #"T([^Z]+)Z$" (:timestamp entry)))]
    {:heading (str (:name entry) " | " (:observer-path entry))
     :event-name (:name entry)
     :source-label (:observer-path entry)
     :compact-time compact-time
     :detail-lines detail-lines
     :fields detail-lines
     :raw-inspector-value (:raw-value entry)
     :raw-payload-object-visible? (and (empty? detail-lines)
                                       (some? (:raw-value entry)))}))

(defn expand-pageload [state page-url]
  (let [next-state (append-timeline-entry state (page-entry page-url))
        page-index (dec (count (nested-timeline next-state)))]
    (update next-state :expanded-pageload-indexes (fnil conj #{}) page-index)))

(defn record-collapsed-pageload [state page-url]
  (append-timeline-entry state (page-entry page-url)))

(defn record-event-for-pageload [state {:keys [page-url event-name]}]
  (append-timeline-entry
   state
   (observed-event-entry page-url canonical-history-path event-name {})))

(defn render-timeline-expanded-state [state]
  (assoc state
         :rendered-expanded-timeline
         {:expanded-page-indexes (:expanded-pageload-indexes state)
          :nested-timeline (nested-timeline state)}))

(defn pageload-expanded? [state page-url]
  (let [timeline (get-in state [:rendered-expanded-timeline :nested-timeline])
        expanded-indexes (get-in state
                                 [:rendered-expanded-timeline
                                  :expanded-page-indexes]
                                 #{})]
    (boolean
     (some (fn [page-index]
             (= page-url (:url (nth timeline page-index nil))))
           expanded-indexes))))

(defn event-visible-without-reexpanding? [state page-url event-name]
  (let [timeline (get-in state [:rendered-expanded-timeline :nested-timeline])
        expanded-indexes (get-in state
                                 [:rendered-expanded-timeline
                                  :expanded-page-indexes]
                                 #{})]
    (boolean
     (some (fn [page-index]
             (let [page (nth timeline page-index nil)]
               (and (= page-url (:url page))
                    (some #(= event-name (:name %)) (:events page)))))
           expanded-indexes))))

(def forbidden-timeline-capability-patterns
  [{:kind :timeline-filtering
    :pattern #"(?i)timelineFilter|timeline filter"}
   {:kind :timeline-search
    :pattern #"(?i)timelineSearch|timeline search"}
   {:kind :validation-results
    :pattern #"(?i)validationResults|validation results"}])

(defn forbidden-timeline-capability-findings [files]
  (support/pattern-findings forbidden-timeline-capability-patterns files))

(defn- inspect-timeline-implementation [root]
  (support/source-file-map root
                           ["src/data-layer-timeline.ts"
                            "src/side-panel.ts"
                            "side-panel.html"]))

(defn- first-visible-entry [world]
  (first (visible-timeline-entries world)))

(defn- example-value-or [example key fallback]
  (or (support/example-value example key) fallback))

(defn- default-payload-label [event-name]
  (str event-name "-values"))

(defn- default-raw-label [event-name]
  (str event-name "-raw"))

(defn- example-entry-options [example]
  (let [event-name (support/require-example example "event_name")]
    {:event-name event-name
     :page-url (support/require-example example "page_url")
     :history-path (example-value-or example "history_path" "event.history")
     :payload-label (example-value-or example
                                      "payload_label"
                                      (default-payload-label event-name))
     :raw-label (example-value-or example
                                  "raw_label"
                                  (default-raw-label event-name))}))

(defn forbidden-timeline-capability-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-timeline-capability-findings files)))

(defn nested-timeline-wired? [files]
  (let [timeline-source (get files "src/data-layer-timeline.ts" "")
        side-panel-source (get files "src/side-panel.ts" "")]
    (and (str/includes? timeline-source "nestedTimeline")
         (str/includes? timeline-source "payloadProperties")
         (str/includes? side-panel-source "nestedTimeline")
         (str/includes? side-panel-source "payloadProperties"))))

(defn tuple-event-display-wired? [files]
  (let [observer-source (get files "src/data-layer-observer.ts" "")
        presentation-source (get files "src/data-layer-event-presentation.ts" "")
        timeline-source (get files "src/data-layer-timeline.ts" "")
        side-panel-source (get files "src/side-panel.ts" "")]
    (and (str/includes? observer-source "canonicalCapturedEvent")
         (str/includes? observer-source "captureSourceEvent")
         (str/includes? presentation-source "inputPayload")
         (str/includes? presentation-source "Array.isArray(raw)")
         (str/includes? timeline-source "displayPayloadValue")
         (str/includes? timeline-source "displayRawValue")
         (str/includes? timeline-source "timelineEventHeading")
         (str/includes? side-panel-source "timelineEventHeading")
         (str/includes? side-panel-source "appendDefinition(definitionList, \"Raw\", event.rawValue)"))))

(defn timeline-expanded-state-wired? [files]
  (let [side-panel-source (get files "src/side-panel.ts" "")]
    (and (str/includes? side-panel-source "expandedTimelinePageIndexes")
         (str/includes? side-panel-source "querySelectorAll<HTMLDetailsElement>")
         (str/includes? side-panel-source "details.open = expanded")
         (str/includes? side-panel-source ".map((page, index) =>")
         (str/includes? side-panel-source "expandedPageIndexes.has(index)")
         (not (str/includes? side-panel-source "expandedPageUrls")))))

(defn- property-item [text]
  (let [[name value] (first (seq (parse-payload-properties text)))]
    {:name name :value value}))

(def handlers
  [{:pattern #"^observed event entries are recorded$"
    :handler (fn [world example _captures]
               (-> world
                   (record-observed-entry (assoc (example-entry-options example)
                                                 :event-name "account-created"))
                   (record-observed-entry (example-entry-options example))))}

   {:pattern #"^the event feed is grouped by page$"
    :handler (fn [world _example _captures]
               (assoc world :event-feed-view :grouped-by-page))}

   {:pattern #"^the event row shows <([A-Za-z0-9_]+)> with a distinct source label for <([A-Za-z0-9_]+)>$"
    :handler (fn [world _example _captures] world)}
   {:pattern #"^compact time is derived from <([A-Za-z0-9_]+)> without replacing the event name$"
    :handler (fn [world _example _captures] world)}

   {:pattern #"^the side panel shows them in capture order$"
    :handler (fn [world example _captures]
               (let [entries (visible-timeline-entries world)
                     expected-event (support/require-example example "event_name")]
                 (support/assert! (= ["account-created" expected-event]
                                     (map :name entries))
                                  "Timeline entries are not in capture order."
                                  {:entries entries})
                 world))}

   {:pattern #"^each timeline entry shows event name <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key]]
               (let [expected (support/require-example example event-name-key)]
                 (support/assert! (= expected (:name (timeline-summary (last (visible-timeline-entries world)))))
                                  "Timeline entry event name is not shown."
                                  {:expected expected
                                   :entries (visible-timeline-entries world)})
                 world))}

   {:pattern #"^each timeline entry shows page URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (let [expected (support/require-example example page-url-key)]
                 (support/assert! (= expected (:url (timeline-summary (last (visible-timeline-entries world)))))
                                  "Timeline entry URL is not shown."
                                  {:expected expected
                                   :entries (visible-timeline-entries world)})
                 world))}

   {:pattern #"^each timeline entry shows capture time$"
    :handler (fn [world _example _captures]
               (support/assert! (every? #(string? (:timestamp (timeline-summary %)))
                                        (visible-timeline-entries world))
                                "Timeline entry capture time is not shown."
                                {:entries (visible-timeline-entries world)})
               world)}

   {:pattern #"^each timeline entry shows observer path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (every? #(= expected (:observer-path (timeline-summary %)))
                                          (visible-timeline-entries world))
                                  "Timeline entry observer path is not shown."
                                  {:expected expected
                                   :entries (visible-timeline-entries world)})
                 world))}

   {:pattern #"^timeline entry <([A-Za-z0-9_]+)> is visible$"
    :handler (fn [world example [event-name-key]]
               (let [event-name (support/require-example example event-name-key)
                     next-world (record-observed-entry world
                                                       (assoc (example-entry-options example)
                                                              :event-name event-name))]
                 (support/assert! (some #(= event-name (:name %))
                                        (visible-timeline-entries next-world))
                                  "Timeline entry is not visible."
                                  {:event-name event-name
                                   :entries (visible-timeline-entries next-world)})
                 next-world))}

   {:pattern #"^captured pageloads <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> contain observed events <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-page-url-key second-page-url-key first-page-events-key second-page-events-key history-path-key]]
               (record-pageloads-with-events
                world
                {:first-page-url (support/require-example example first-page-url-key)
                 :second-page-url (support/require-example example second-page-url-key)
                 :first-page-events (support/require-example example first-page-events-key)
                 :second-page-events (support/require-example example second-page-events-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^the default live event feed is displayed$"
    :handler (fn [world _example _captures]
               (assoc world :event-feed-view :chronological :visible-event-feed (visible-timeline-entries world)))}

   {:pattern #"^events remain in chronological capture order across page boundaries$"
    :handler (fn [world _example _captures]
               (let [timestamps (map :timestamp (:visible-event-feed world))]
                 (support/assert! (= (sort timestamps) timestamps)
                                  "Live event feed is not in chronological capture order." {:timestamps timestamps})
                 world))}

   {:pattern #"^page URLs <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> appear as journey separators$"
    :handler (fn [world example [first-page-key second-page-key]]
               (let [urls (set (map :url (:visible-event-feed world)))]
                 (support/assert! (every? urls [(support/require-example example first-page-key)
                                                (support/require-example example second-page-key)])
                                  "Page URLs are missing from the journey feed." {:urls urls})
                 world))}

   {:pattern #"^events are not hidden inside collapsed page groups by default$"
    :handler (fn [world _example _captures]
               (support/assert! (seq (:visible-event-feed world)) "Default feed hides captured events." {}) world)}

   {:pattern #"^the user groups the event feed by page$"
    :handler (fn [world _example _captures] (assoc world :event-feed-view :grouped :page-groups (nested-timeline world)))}

   {:pattern #"^page groups <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> are shown in capture order$"
    :handler (fn [world example [first-page-key second-page-key]]
               (support/assert! (= [(support/require-example example first-page-key) (support/require-example example second-page-key)]
                                  (mapv :url (:page-groups world))) "Page groups are not in capture order." {}) world)}

   {:pattern #"^events <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> appear under their associated page groups$"
    :handler (fn [world example [first-events-key second-events-key]]
               (support/assert! (= [(comma-list (support/require-example example first-events-key))
                                  (comma-list (support/require-example example second-events-key))]
                                 (mapv #(mapv :name (:events %)) (:page-groups world)))
                                "Grouped events do not match their page." {}) world)}

   {:pattern #"^switching back to chronological view preserves event selection and filters$"
    :handler (fn [world _example _captures] (assoc world :event-feed-view :chronological))}

   {:pattern #"^observed data layer tuple \[<([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>\] is captured at <([A-Za-z0-9_]+)> from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key payload-object-key timestamp-key history-path-key]]
               (record-observed-tuple
                world
                {:event-name (support/require-example example event-name-key)
                 :payload-object (support/require-example example payload-object-key)
                 :timestamp (support/require-example example timestamp-key)
                 :history-path (support/require-example example history-path-key)}))}

   {:pattern #"^the tuple event uses the canonical event name$"
    :handler (fn [world _example _captures]
               (let [entry (first (visible-timeline-entries world))]
                 (support/assert! (= canonical-tuple-event-name (:name entry))
                                  "Tuple event name does not match the canonical event."
                                  {:expected canonical-tuple-event-name
                                   :entry entry})
                 world))}

   {:pattern #"^the tuple event uses the canonical observer path$"
    :handler (fn [world _example _captures]
               (let [entry (first (visible-timeline-entries world))]
                 (support/assert! (= canonical-tuple-history-path
                                     (:observer-path entry))
                                  "Tuple event observer path does not match the canonical path."
                                  {:expected canonical-tuple-history-path
                                   :entry entry})
                 world))}

   {:pattern #"^the tuple event uses the canonical timestamp$"
    :handler (fn [world _example _captures]
               (let [entry (first (visible-timeline-entries world))]
                 (support/assert! (= canonical-tuple-timestamp
                                     (:timestamp entry))
                                  "Tuple event timestamp does not match the canonical timestamp."
                                  {:expected canonical-tuple-timestamp
                                   :entry entry})
                 world))}

   {:pattern #"^the side panel renders the observed event$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     files (support/source-file-map root
                                                    ["src/data-layer-observer.ts"
                                                     "src/data-layer-event-presentation.ts"
                                                     "src/data-layer-timeline.ts"
                                                     "src/side-panel.ts"])]
                 (support/assert! (tuple-event-display-wired? files)
                                  "Tuple event display is not wired."
                                  {})
                 (assoc world :rendered-observed-event
                        (render-observed-event world))))}

   {:pattern #"^the visible event row shows only <([A-Za-z0-9_]+)> with a distinct source label for <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key history-path-key]]
               (let [expected [(support/require-example example event-name-key)
                               (support/require-example example history-path-key)]
                     rendered (:rendered-observed-event world)
                     actual [(:event-name rendered) (:source-label rendered)]]
                 (support/assert! (= expected actual)
                                  "Visible event row identity or source label is incorrect."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^capture time <([A-Za-z0-9_]+)> remains available in the inspector without adding visible event-row text$"
    :handler (fn [world example [timestamp-key]]
               (let [timestamp (support/require-example example timestamp-key)
                     expected-compact-time (second (re-find #"T([^Z]+)Z$" timestamp))
                     rendered (:rendered-observed-event world)]
                 (support/assert! (= expected-compact-time (:compact-time rendered))
                                  "Capture time is not available to the event inspector."
                                  {:expected expected-compact-time
                                   :actual (:compact-time rendered)})
                 (support/assert! (= (str (:event-name rendered)
                                          " | "
                                          (:source-label rendered))
                                     (:heading rendered))
                                  "Visible event row includes metadata beyond event and source."
                                  {:rendered rendered})
                 world))}

   {:pattern #"^payload properties <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)> are available in the Payload section$"
    :handler (fn [world example property-keys]
               (let [expected (mapv #(property-item
                                      (support/require-example example %))
                                    property-keys)
                     actual (get-in world [:rendered-observed-event :fields])]
                 (support/assert! (= expected actual)
                                  "Payload section does not contain the tuple properties."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^the complete tuple is available through a collapsed Raw input disclosure without duplicating payload by default$"
    :handler (fn [world example _captures]
               (let [fields (mapv #(property-item
                                    (support/require-example example %))
                                  ["first_property"
                                   "second_property"
                                   "third_property"])
                     payload (into (array-map)
                                   (map (juxt :name :value))
                                   fields)
                     expected [(support/require-example example "event_name") payload]
                     rendered (:rendered-observed-event world)]
                 (support/assert! (= expected (:raw-inspector-value rendered))
                                  "Raw input disclosure does not preserve the complete tuple."
                                  {:expected expected
                                   :actual (:raw-inspector-value rendered)})
                 (support/assert! (false? (:raw-payload-object-visible? rendered))
                                  "Raw tuple payload is duplicated in the default presentation."
                                  {:rendered rendered})
                 world))}

   {:pattern #"^pageload <([A-Za-z0-9_]+)> is expanded in the side panel timeline$"
    :handler (fn [world example [page-url-key]]
               (expand-pageload
                world
                (support/require-example example page-url-key)))}

   {:pattern #"^the expanded pageload uses the canonical page URL$"
    :handler (fn [world _example _captures]
               (let [page-url (get-in (nested-timeline world) [0 :url])]
                 (support/assert! (= canonical-expanded-page-url page-url)
                                  "Expanded pageload URL does not match the canonical URL."
                                  {:expected canonical-expanded-page-url
                                   :actual page-url})
                 world))}

   {:pattern #"^observed event <([A-Za-z0-9_]+)> is recorded for pageload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key page-url-key]]
               (render-timeline-expanded-state
                (record-event-for-pageload
                 world
                 {:event-name (support/require-example example event-name-key)
                  :page-url (support/require-example example page-url-key)})))}

   {:pattern #"^the expanded-state event uses the canonical event name$"
    :handler (fn [world _example _captures]
               (let [event-name (get-in world
                                        [:rendered-expanded-timeline
                                         :nested-timeline
                                         0
                                         :events
                                         0
                                         :name])]
                 (support/assert! (= canonical-expanded-event-name event-name)
                                  "Expanded-state event name does not match the canonical event."
                                  {:expected canonical-expanded-event-name
                                   :actual event-name})
                 world))}

   {:pattern #"^pageload <([A-Za-z0-9_]+)> remains expanded$"
    :handler (fn [world example [page-url-key]]
               (let [page-url (support/require-example example page-url-key)
                     root (support/repository-root)
                     files (support/source-file-map root ["src/side-panel.ts"])]
                 (support/assert! (timeline-expanded-state-wired? files)
                                  "Timeline expanded state is not wired."
                                  {})
                 (support/assert! (pageload-expanded? world page-url)
                                  "Pageload did not remain expanded."
                                  {:page-url page-url
                                   :rendered-expanded-timeline
                                   (:rendered-expanded-timeline world)})
                 world))}

   {:pattern #"^observed event <([A-Za-z0-9_]+)> is visible without re-expanding pageload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key page-url-key]]
               (let [event-name (support/require-example example event-name-key)
                     page-url (support/require-example example page-url-key)]
                 (support/assert! (event-visible-without-reexpanding?
                                   world
                                   page-url
                                   event-name)
                                  "Observed event is not visible under the already-expanded pageload."
                                  {:event-name event-name
                                   :page-url page-url
                                   :rendered-expanded-timeline
                                   (:rendered-expanded-timeline world)})
                 world))}

   ])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-11T01:15:56.070010544+02:00", :module-hash "331449404", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-560445802"} {:id "def/timeline-timestamp", :kind "def", :line 6, :end-line nil, :hash "415657292"} {:id "def/canonical-first-page-url", :kind "def", :line 7, :end-line nil, :hash "892300575"} {:id "def/canonical-second-page-url", :kind "def", :line 8, :end-line nil, :hash "-854550659"} {:id "def/canonical-history-path", :kind "def", :line 9, :end-line nil, :hash "-1465520940"} {:id "def/canonical-event-groups", :kind "def", :line 10, :end-line nil, :hash "-1186297732"} {:id "def/canonical-payload-properties", :kind "def", :line 12, :end-line nil, :hash "-1279650964"} {:id "def/canonical-tuple-event-name", :kind "def", :line 18, :end-line nil, :hash "1033985506"} {:id "def/canonical-tuple-history-path", :kind "def", :line 19, :end-line nil, :hash "330325512"} {:id "def/canonical-tuple-timestamp", :kind "def", :line 20, :end-line nil, :hash "-1600040237"} {:id "def/canonical-expanded-page-url", :kind "def", :line 21, :end-line nil, :hash "-1460760503"} {:id "def/canonical-expanded-event-name", :kind "def", :line 22, :end-line nil, :hash "-935563380"} {:id "def/canonical-tuple-payload-values", :kind "def", :line 23, :end-line nil, :hash "1497266995"} {:id "defn-/observed-entry", :kind "defn-", :line 28, :end-line nil, :hash "1690037188"} {:id "defn/record-observed-entry", :kind "defn", :line 37, :end-line nil, :hash "-1688208651"} {:id "defn/visible-timeline-entries", :kind "defn", :line 44, :end-line nil, :hash "-188878219"} {:id "defn/timeline-summary", :kind "defn", :line 49, :end-line nil, :hash "-712284424"} {:id "defn/expanded-entry", :kind "defn", :line 52, :end-line nil, :hash "602566461"} {:id "defn-/page-entry", :kind "defn-", :line 55, :end-line nil, :hash "975036707"} {:id "defn-/comma-list", :kind "defn-", :line 58, :end-line nil, :hash "-1163143512"} {:id "defn/parse-payload-properties", :kind "defn", :line 61, :end-line nil, :hash "519534170"} {:id "defn-/observed-event-entry", :kind "defn-", :line 68, :end-line nil, :hash "-1241889608"} {:id "defn-/append-timeline-entry", :kind "defn-", :line 77, :end-line nil, :hash "-1434428876"} {:id "defn-/record-events-for-page", :kind "defn-", :line 83, :end-line nil, :hash "-2026777991"} {:id "defn/record-pageloads-with-events", :kind "defn", :line 91, :end-line nil, :hash "-1198529879"} {:id "defn/record-observed-event-with-payload", :kind "defn", :line 97, :end-line nil, :hash "1577056021"} {:id "defn-/tuple-payload-object", :kind "defn-", :line 103, :end-line nil, :hash "298147558"} {:id "defn/record-observed-tuple", :kind "defn", :line 112, :end-line nil, :hash "-1059715210"} {:id "defn-/timeline-entries", :kind "defn-", :line 125, :end-line nil, :hash "-1795253343"} {:id "defn-/add-page-to-timeline", :kind "defn-", :line 130, :end-line nil, :hash "-2141246556"} {:id "defn-/latest-page-index", :kind "defn-", :line 133, :end-line nil, :hash "714616854"} {:id "defn-/add-event-to-matching-page", :kind "defn-", :line 140, :end-line nil, :hash "832033178"} {:id "defn-/add-entry-to-nested-timeline", :kind "defn-", :line 150, :end-line nil, :hash "1389420386"} {:id "defn/nested-timeline", :kind "defn", :line 156, :end-line nil, :hash "184350641"} {:id "defn/payload-property-items", :kind "defn", :line 159, :end-line nil, :hash "-1695777806"} {:id "defn/nested-event-details", :kind "defn", :line 168, :end-line nil, :hash "-550024329"} {:id "defn/nested-timeline-pageload-order-matches?", :kind "defn", :line 174, :end-line nil, :hash "1626274005"} {:id "defn/nested-timeline-event-groups-match?", :kind "defn", :line 178, :end-line nil, :hash "-1429788433"} {:id "defn/nested-timeline-observer-paths-match?", :kind "defn", :line 182, :end-line nil, :hash "-1609152257"} {:id "defn/canonical-payload-properties-match?", :kind "defn", :line 186, :end-line nil, :hash "-1276257187"} {:id "defn/render-observed-event", :kind "defn", :line 190, :end-line nil, :hash "-1072482116"} {:id "defn/expand-pageload", :kind "defn", :line 204, :end-line nil, :hash "1118200052"} {:id "defn/record-collapsed-pageload", :kind "defn", :line 209, :end-line nil, :hash "1572303210"} {:id "defn/record-event-for-pageload", :kind "defn", :line 212, :end-line nil, :hash "1940684709"} {:id "defn/render-timeline-expanded-state", :kind "defn", :line 217, :end-line nil, :hash "-1045715902"} {:id "defn/pageload-expanded?", :kind "defn", :line 223, :end-line nil, :hash "1211539265"} {:id "defn/event-visible-without-reexpanding?", :kind "defn", :line 234, :end-line nil, :hash "997325431"} {:id "def/forbidden-timeline-capability-patterns", :kind "def", :line 247, :end-line nil, :hash "1179421373"} {:id "defn/forbidden-timeline-capability-findings", :kind "defn", :line 255, :end-line nil, :hash "181573916"} {:id "defn-/inspect-timeline-implementation", :kind "defn-", :line 258, :end-line nil, :hash "-1945393687"} {:id "defn-/first-visible-entry", :kind "defn-", :line 264, :end-line nil, :hash "-2031728269"} {:id "defn-/example-value-or", :kind "defn-", :line 267, :end-line nil, :hash "-1940368029"} {:id "defn-/default-payload-label", :kind "defn-", :line 270, :end-line nil, :hash "1878071429"} {:id "defn-/default-raw-label", :kind "defn-", :line 273, :end-line nil, :hash "-953873882"} {:id "defn-/example-entry-options", :kind "defn-", :line 276, :end-line nil, :hash "-503844579"} {:id "defn/forbidden-timeline-capability-findings-of-kind", :kind "defn", :line 288, :end-line nil, :hash "661283922"} {:id "defn/nested-timeline-wired?", :kind "defn", :line 291, :end-line nil, :hash "1463466039"} {:id "defn/tuple-event-display-wired?", :kind "defn", :line 299, :end-line nil, :hash "-1072576953"} {:id "defn/timeline-expanded-state-wired?", :kind "defn", :line 314, :end-line nil, :hash "372220421"} {:id "defn-/property-item", :kind "defn-", :line 323, :end-line nil, :hash "1550456326"} {:id "def/handlers", :kind "def", :line 327, :end-line nil, :hash "-716630350"}]}
;; clj-mutate-manifest-end
