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
  (->> (str/split text #",")
       (map str/trim)
       (remove str/blank?)
       vec))

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
     :history-path (support/require-example example "history_path")
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

(def handlers
  [{:pattern #"^observed event entries are recorded$"
    :handler (fn [world example _captures]
               (-> world
                   (record-observed-entry (assoc (example-entry-options example)
                                                 :event-name "account-created"))
                   (record-observed-entry (example-entry-options example))))}

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

   {:pattern #"^the side panel renders the nested data layer timeline$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     files (inspect-timeline-implementation root)]
                 (support/assert! (nested-timeline-wired? files)
                                  "Nested data layer timeline is not wired."
                                  {})
                 (assoc world :nested-timeline (nested-timeline world))))}

   {:pattern #"^pageloads <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> are top-level items in capture order$"
    :handler (fn [world example [first-page-url-key second-page-url-key]]
               (let [expected [(support/require-example example first-page-url-key)
                               (support/require-example example second-page-url-key)]
                     actual (mapv :url (:nested-timeline world))]
                 (support/assert! (= expected actual)
                                  "Pageloads are not top-level timeline items in capture order."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^the nested timeline uses the canonical pageload order$"
    :handler (fn [world _example _captures]
               (support/assert! (nested-timeline-pageload-order-matches?
                                 (:nested-timeline world))
                                "Nested timeline pageload order does not match the canonical pages."
                                {:expected [canonical-first-page-url
                                            canonical-second-page-url]
                                 :actual (mapv :url (:nested-timeline world))})
               world)}

   {:pattern #"^observed events <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> are second-level items under their pageloads with observer path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-page-events-key second-page-events-key history-path-key]]
               (let [expected [(comma-list (support/require-example example first-page-events-key))
                               (comma-list (support/require-example example second-page-events-key))]
                     expected-path (support/require-example example history-path-key)
                     groups (:nested-timeline world)
                     actual (mapv #(mapv :name (:events %)) groups)
                     paths (map :observer-path (mapcat :events groups))]
                 (support/assert! (= expected actual)
                                  "Observed events are not nested under pageloads."
                                  {:expected expected :actual actual})
                 (support/assert! (every? #(= expected-path %) paths)
                                 "Observed event path does not match."
                                 {:expected expected-path :actual paths})
                 world))}

   {:pattern #"^the nested timeline uses canonical observed event groups$"
    :handler (fn [world _example _captures]
               (support/assert! (nested-timeline-event-groups-match?
                                 (:nested-timeline world))
                                "Nested timeline observed event groups do not match the canonical groups."
                                {:expected canonical-event-groups
                                 :actual (mapv #(mapv :name (:events %))
                                               (:nested-timeline world))})
               world)}

   {:pattern #"^nested observed events use the canonical observer path$"
    :handler (fn [world _example _captures]
               (support/assert! (nested-timeline-observer-paths-match?
                                 (:nested-timeline world))
                                "Nested timeline observed event paths do not match the canonical path."
                                {:expected canonical-history-path
                                 :actual (mapv :observer-path
                                               (mapcat :events
                                                       (:nested-timeline world)))})
               world)}

   {:pattern #"^observed event <([A-Za-z0-9_]+)> carries raw payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key payload-properties-key]]
               (record-observed-event-with-payload
                world
                {:event-name (support/require-example example event-name-key)
                 :payload-properties (support/require-example example payload-properties-key)}))}

   {:pattern #"^the side panel displays nested event details$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)
                     files (inspect-timeline-implementation root)]
                 (support/assert! (nested-timeline-wired? files)
                                  "Nested data layer event details are not wired."
                                  {})
                 world))}

   {:pattern #"^payload properties <([A-Za-z0-9_]+)> are third-level items under observed event <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [payload-properties-key event-name-key]]
               (let [event-name (support/require-example example event-name-key)
                     expected (mapv (fn [[name value]]
                                      {:name name :value value})
                                    (parse-payload-properties
                                     (support/require-example example payload-properties-key)))
                     actual (:payload-properties (nested-event-details world event-name))]
                 (support/assert! (= expected actual)
                                  "Payload properties are not nested under the observed event."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^payload properties match the canonical <([A-Za-z0-9_]+)> payload$"
    :handler (fn [world example [event-name-key]]
               (let [event-name (support/require-example example event-name-key)
                     expected (get canonical-payload-properties event-name)]
                 (support/assert! (some? expected)
                                  "No canonical payload is defined for observed event."
                                  {:event-name event-name})
                 (support/assert! (canonical-payload-properties-match?
                                   world
                                   event-name)
                                  "Payload properties do not match the canonical payload."
                                  {:expected expected
                                   :actual (:payload-properties
                                            (nested-event-details world
                                                                  event-name))})
                 world))}

   {:pattern #"^scalar payload values are displayed as quoted values$"
    :handler (fn [world _example _captures]
               (let [values (map :value
                                 (:payload-properties
                                  (nested-event-details
                                   world
                                   (get-in (first (visible-timeline-entries world)) [:name]))))]
                 (support/assert! (every? #(re-matches #"\".*\"" %) values)
                                  "Scalar payload values are not displayed as quoted values."
                                  {:values values})
                 world))}

   {:pattern #"^the timeline entry is expanded$"
    :handler (fn [world _example _captures]
               (assoc world :expanded-entry (expanded-entry (first-visible-entry world))))}

   {:pattern #"^the expanded entry shows event name <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key]]
               (let [expected (support/require-example example event-name-key)]
                 (support/assert! (= expected (get-in world [:expanded-entry :name]))
                                  "Expanded entry event name is not shown."
                                  {:expanded-entry (:expanded-entry world)})
                 world))}

   {:pattern #"^the expanded entry shows page URL <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [page-url-key]]
               (let [expected (support/require-example example page-url-key)]
                 (support/assert! (= expected (get-in world [:expanded-entry :url]))
                                  "Expanded entry URL is not shown."
                                  {:expanded-entry (:expanded-entry world)})
                 world))}

   {:pattern #"^the expanded entry shows observer path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (get-in world [:expanded-entry :observer-path]))
                                  "Expanded entry observer path is not shown."
                                  {:expanded-entry (:expanded-entry world)})
                 world))}

   {:pattern #"^the expanded entry shows payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [payload-label-key]]
               (let [expected (support/require-example example payload-label-key)]
                 (support/assert! (= expected (get-in world [:expanded-entry :payload]))
                                  "Expanded entry payload is not shown."
                                  {:expanded-entry (:expanded-entry world)})
                 world))}

   {:pattern #"^the expanded entry shows raw value <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [raw-label-key]]
               (let [expected (support/require-example example raw-label-key)]
                 (support/assert! (= expected (get-in world [:expanded-entry :raw-value]))
                                  "Expanded entry raw value is not shown."
                                  {:expanded-entry (:expanded-entry world)})
                 world))}

   {:pattern #"^data layer timeline features are inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :timeline-files (inspect-timeline-implementation root))))}

   {:pattern #"^timeline filtering is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-timeline-capability-findings-of-kind
                               (:timeline-files world)
                               :timeline-filtering)]
                 (support/assert! (empty? findings)
                                  "Timeline filtering was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^timeline search is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-timeline-capability-findings-of-kind
                               (:timeline-files world)
                               :timeline-search)]
                 (support/assert! (empty? findings)
                                  "Timeline search was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^validation results are not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-timeline-capability-findings-of-kind
                               (:timeline-files world)
                               :validation-results)]
                 (support/assert! (empty? findings)
                                  "Validation results were found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-09T22:57:03.087988176+02:00", :module-hash "-1868472994", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-560445802"} {:id "def/timeline-timestamp", :kind "def", :line 6, :end-line nil, :hash "415657292"} {:id "def/canonical-first-page-url", :kind "def", :line 7, :end-line nil, :hash "892300575"} {:id "def/canonical-second-page-url", :kind "def", :line 8, :end-line nil, :hash "-854550659"} {:id "def/canonical-history-path", :kind "def", :line 9, :end-line nil, :hash "-1465520940"} {:id "def/canonical-event-groups", :kind "def", :line 10, :end-line nil, :hash "-1186297732"} {:id "def/canonical-payload-properties", :kind "def", :line 12, :end-line nil, :hash "-1279650964"} {:id "defn-/observed-entry", :kind "defn-", :line 19, :end-line nil, :hash "1690037188"} {:id "defn/record-observed-entry", :kind "defn", :line 28, :end-line nil, :hash "-1688208651"} {:id "defn/visible-timeline-entries", :kind "defn", :line 35, :end-line nil, :hash "-188878219"} {:id "defn/timeline-summary", :kind "defn", :line 40, :end-line nil, :hash "-712284424"} {:id "defn/expanded-entry", :kind "defn", :line 43, :end-line nil, :hash "602566461"} {:id "defn-/page-entry", :kind "defn-", :line 46, :end-line nil, :hash "975036707"} {:id "defn-/comma-list", :kind "defn-", :line 49, :end-line nil, :hash "-1449797332"} {:id "defn/parse-payload-properties", :kind "defn", :line 55, :end-line nil, :hash "519534170"} {:id "defn-/observed-event-entry", :kind "defn-", :line 62, :end-line nil, :hash "-1241889608"} {:id "defn-/append-timeline-entry", :kind "defn-", :line 71, :end-line nil, :hash "-1434428876"} {:id "defn-/record-events-for-page", :kind "defn-", :line 77, :end-line nil, :hash "-2026777991"} {:id "defn/record-pageloads-with-events", :kind "defn", :line 85, :end-line nil, :hash "-1198529879"} {:id "defn/record-observed-event-with-payload", :kind "defn", :line 91, :end-line nil, :hash "1577056021"} {:id "defn-/timeline-entries", :kind "defn-", :line 97, :end-line nil, :hash "-1795253343"} {:id "defn-/add-page-to-timeline", :kind "defn-", :line 102, :end-line nil, :hash "-2141246556"} {:id "defn-/latest-page-index", :kind "defn-", :line 105, :end-line nil, :hash "714616854"} {:id "defn-/add-event-to-matching-page", :kind "defn-", :line 112, :end-line nil, :hash "832033178"} {:id "defn-/add-entry-to-nested-timeline", :kind "defn-", :line 122, :end-line nil, :hash "1389420386"} {:id "defn/nested-timeline", :kind "defn", :line 128, :end-line nil, :hash "184350641"} {:id "defn/payload-property-items", :kind "defn", :line 131, :end-line nil, :hash "-1695777806"} {:id "defn/nested-event-details", :kind "defn", :line 140, :end-line nil, :hash "-550024329"} {:id "defn/nested-timeline-pageload-order-matches?", :kind "defn", :line 146, :end-line nil, :hash "1626274005"} {:id "defn/nested-timeline-event-groups-match?", :kind "defn", :line 150, :end-line nil, :hash "-1429788433"} {:id "defn/nested-timeline-observer-paths-match?", :kind "defn", :line 154, :end-line nil, :hash "-1609152257"} {:id "defn/canonical-payload-properties-match?", :kind "defn", :line 158, :end-line nil, :hash "1314292081"} {:id "def/forbidden-timeline-capability-patterns", :kind "def", :line 162, :end-line nil, :hash "1179421373"} {:id "defn/forbidden-timeline-capability-findings", :kind "defn", :line 170, :end-line nil, :hash "181573916"} {:id "defn-/inspect-timeline-implementation", :kind "defn-", :line 173, :end-line nil, :hash "-1945393687"} {:id "defn-/first-visible-entry", :kind "defn-", :line 179, :end-line nil, :hash "-2031728269"} {:id "defn-/example-value-or", :kind "defn-", :line 182, :end-line nil, :hash "-1940368029"} {:id "defn-/default-payload-label", :kind "defn-", :line 185, :end-line nil, :hash "1878071429"} {:id "defn-/default-raw-label", :kind "defn-", :line 188, :end-line nil, :hash "-953873882"} {:id "defn-/example-entry-options", :kind "defn-", :line 191, :end-line nil, :hash "2130457195"} {:id "defn/forbidden-timeline-capability-findings-of-kind", :kind "defn", :line 203, :end-line nil, :hash "661283922"} {:id "defn/nested-timeline-wired?", :kind "defn", :line 206, :end-line nil, :hash "1463466039"} {:id "def/handlers", :kind "def", :line 214, :end-line nil, :hash "1330941882"}]}
;; clj-mutate-manifest-end
