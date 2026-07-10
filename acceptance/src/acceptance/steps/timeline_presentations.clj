(ns acceptance.steps.timeline-presentations
  (:require [acceptance.steps.data-layer-timeline :as timeline]
            [acceptance.steps.support :as support]))

(defn- property-item [text]
  (let [[name value] (first (seq (timeline/parse-payload-properties text)))]
    {:name name :value value}))

(defn- expected-fields [example property-keys]
  (mapv #(property-item (support/require-example example %)) property-keys))

(def handlers
  [{:pattern #"^the event feed is grouped by page$"
    :handler (fn [world _example _captures]
               (assoc world :event-feed-view :grouped))}

   {:pattern #"^the event row shows <([A-Za-z0-9_]+)> with a distinct source label for <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-name-key history-path-key]]
               (let [expected [(support/require-example example event-name-key)
                               (support/require-example example history-path-key)]
                     rendered (:rendered-observed-event world)
                     actual [(:event-name rendered) (:source-label rendered)]]
                 (support/assert! (= expected actual)
                                  "Event row identity or source label is incorrect."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^compact time is derived from <([A-Za-z0-9_]+)> without replacing the event name$"
    :handler (fn [world example [timestamp-key]]
               (let [timestamp (support/require-example example timestamp-key)
                     expected [(support/require-example example "event_name")
                               (second (re-find #"T([^Z]+)Z$" timestamp))]
                     rendered (:rendered-observed-event world)
                     actual [(:event-name rendered) (:compact-time rendered)]]
                 (support/assert! (= expected actual)
                                  "Compact time replaced or detached from the event name."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^payload properties <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)> are available in the Fields inspector$"
    :handler (fn [world example property-keys]
               (let [expected (expected-fields example property-keys)
                     actual (get-in world [:rendered-observed-event :fields])]
                 (support/assert! (= expected actual)
                                  "Fields inspector does not contain the tuple properties."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^the complete tuple is available separately in the Raw inspector$"
    :handler (fn [world example _captures]
               (let [fields (expected-fields example
                                             ["first_property"
                                              "second_property"
                                              "third_property"])
                     payload (into (array-map)
                                   (map (juxt :name :value))
                                   fields)
                     expected [(support/require-example example "event_name") payload]
                     actual (get-in world [:rendered-observed-event :raw-inspector-value])]
                 (support/assert! (= expected actual)
                                  "Raw inspector does not preserve the complete tuple."
                                  {:expected expected :actual actual})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:41:15.249373853+02:00", :module-hash "1275770135", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1444107703"} {:id "defn-/property-item", :kind "defn-", :line 5, :end-line nil, :hash "-1720923350"} {:id "defn-/expected-fields", :kind "defn-", :line 9, :end-line nil, :hash "886006768"} {:id "def/handlers", :kind "def", :line 12, :end-line nil, :hash "209122359"}]}
;; clj-mutate-manifest-end
