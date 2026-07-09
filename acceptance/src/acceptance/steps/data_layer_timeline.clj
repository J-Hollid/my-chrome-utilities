(ns acceptance.steps.data-layer-timeline
  (:require [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def timeline-timestamp "2026-07-08T00:00:00Z")

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

(defn- add-event-to-last-page [pages entry]
  (if (seq pages)
    (update pages (dec (count pages)) update :events conj entry)
    [{:url (:url entry) :events [entry]}]))

(defn- timeline-entries [state]
  (or (:timeline-entries state)
      (get-in state [:session-state :session :timeline])
      []))

(defn- add-page-to-timeline [pages entry]
  (conj pages {:url (:url entry) :events []}))

(defn- add-entry-to-nested-timeline [pages entry]
  (case (:type entry)
    "page" (add-page-to-timeline pages entry)
    "observed" (add-event-to-last-page pages entry)
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
;; {:version 1, :tested-at "2026-07-09T16:36:05.398520869+02:00", :module-hash "1602313650", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-560445802"} {:id "def/timeline-timestamp", :kind "def", :line 6, :end-line nil, :hash "415657292"} {:id "defn-/observed-entry", :kind "defn-", :line 8, :end-line nil, :hash "1690037188"} {:id "defn/record-observed-entry", :kind "defn", :line 17, :end-line nil, :hash "-1688208651"} {:id "defn/visible-timeline-entries", :kind "defn", :line 24, :end-line nil, :hash "-188878219"} {:id "defn/timeline-summary", :kind "defn", :line 29, :end-line nil, :hash "-712284424"} {:id "defn/expanded-entry", :kind "defn", :line 32, :end-line nil, :hash "602566461"} {:id "def/forbidden-timeline-capability-patterns", :kind "def", :line 35, :end-line nil, :hash "1179421373"} {:id "defn/forbidden-timeline-capability-findings", :kind "defn", :line 43, :end-line nil, :hash "181573916"} {:id "defn-/inspect-timeline-implementation", :kind "defn-", :line 46, :end-line nil, :hash "-1945393687"} {:id "defn-/first-visible-entry", :kind "defn-", :line 52, :end-line nil, :hash "-2031728269"} {:id "defn-/example-value-or", :kind "defn-", :line 55, :end-line nil, :hash "-1940368029"} {:id "defn-/default-payload-label", :kind "defn-", :line 58, :end-line nil, :hash "1878071429"} {:id "defn-/default-raw-label", :kind "defn-", :line 61, :end-line nil, :hash "-953873882"} {:id "defn-/example-entry-options", :kind "defn-", :line 64, :end-line nil, :hash "2130457195"} {:id "defn/forbidden-timeline-capability-findings-of-kind", :kind "defn", :line 76, :end-line nil, :hash "661283922"} {:id "def/handlers", :kind "def", :line 79, :end-line nil, :hash "1073186936"}]}
;; clj-mutate-manifest-end
