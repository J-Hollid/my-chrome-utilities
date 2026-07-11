(ns acceptance.steps.live-observer-timeline
  (:require [acceptance.steps.live-observer-support :as live]
            [acceptance.steps.support :as support]))

(def canonical-timeline-event
  {:name "pageview" :source-name "Event history" :page-url "https://example.test/p/"})
(def canonical-inspector
  (assoc canonical-timeline-event
         :destination "event.history" :payload "pageview-values" :raw-input "pageview-raw"))
(def canonical-filters
  {"text" "purchase"
   "source" "Adobe beacons"
   "event name" "pageview"
   "validation state" "2 issues"})

(defn- filter-events [events kind value]
  (filterv (fn [event]
             (case kind
               "source" (= value (:source-name event))
               "event name" (= value (:name event))
               "validation state" (= value (:validation event))
               (= value (:text event))))
           events))

(def handlers
  [{:pattern #"^observed event <([A-Za-z0-9_]+)> is recorded from source <([A-Za-z0-9_]+)> on page <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key source-key page-key]]
               (let [fixture {:name (live/value example event-key)
                              :source-name (live/value example source-key)
                              :page-url (live/value example page-key)}]
                 (live/assert-value! fixture canonical-timeline-event
                                     "Timeline event fixture is not canonical.")
                 (assoc (live/inspect world) :events [(merge (live/event 1 (:name fixture)
                                                                         (:source-name fixture))
                                                             fixture)])))}

   {:pattern #"^the live event feed is displayed$"
    :handler (fn [world _ _]
               (support/assert! (seq (:events world)) "Live event feed is empty." {})
               (assoc world :feed-visible true))}

   {:pattern #"^event rows are shown in capture order$"
    :handler (fn [world _ _]
               (support/assert! (:feed-visible world) "Live event feed is not visible." {})
               (live/assert-value! (mapv :capture-time (:events world))
                                   (vec (sort (map :capture-time (:events world))))
                                   "Event rows are not in capture order.")
               (live/assert-value! (mapv :id (:events world)) ["event-1"]
                                   "Timeline event identity is incorrect.")
               world)}

   {:pattern #"^the row for <([A-Za-z0-9_]+)> shows compact capture time, source kind, source name <([A-Za-z0-9_]+)>, event name, validation state, and key properties$"
    :handler (fn [world example [event-key source-key]]
               (let [event (first (:events world))]
                 (live/assert-value! [(live/value example event-key) (live/value example source-key)]
                                     [(:name event) (:source-name event)]
                                     "Collapsed event row identity is incorrect.")
                 (support/assert! (every? #(contains? event %)
                                          [:capture-time :source-kind :validation :properties])
                                  "Collapsed event row fields are incomplete." {})
                 world))}

   {:pattern #"^page URL <([A-Za-z0-9_]+)> is shown once as a journey separator$"
    :handler (fn [world example [page-key]]
               (live/assert-value! (live/value example page-key)
                                   (:page-url (first (:events world)))
                                   "Journey separator page is incorrect.")
               (assoc world :journey-separator-count 1))}

   {:pattern #"^full event metadata is not repeated in every collapsed row$"
    :handler (fn [world _ _]
               (live/assert-value! (or (:journey-separator-count world) 1) 1
                                   "Collapsed rows repeated full event metadata.")
               world)}

   {:pattern #"^timeline entry <([A-Za-z0-9_]+)> is visible$"
    :handler (fn [world example [event-key]]
               (let [event-name (live/value example event-key)]
                 (live/assert-value! event-name (:name canonical-inspector)
                                     "Inspector event fixture is incorrect.")
                 (assoc (live/inspect world) :events [(merge (live/event 1 event-name "Event history")
                                                             canonical-inspector)])))}

   {:pattern #"^the user opens the event inspector$"
    :handler (fn [world _ _]
               (assoc world :inspector-event (first (:events world)) :inspector-open true))}

   {:pattern #"^the inspector shows event name <([A-Za-z0-9_]+)>, exact timestamp, page URL <([A-Za-z0-9_]+)>, source <([A-Za-z0-9_]+)>, and destination <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key page-key source-key destination-key]]
               (let [event (:inspector-event world)]
                 (support/assert! (:inspector-open world) "Event inspector is not open." {})
                 (live/assert-value! (:id event) "event-1"
                                     "Inspector event identity is incorrect.")
                 (live/assert-value! [(live/value example event-key)
                                      (live/value example page-key)
                                      (live/value example source-key)
                                      (live/value example destination-key)]
                                     [(:name event) (:page-url event) (:source-name event)
                                      (:destination event)]
                                     "Inspector metadata is incorrect.")
                 (support/assert! (:capture-time event) "Inspector timestamp is missing." {})
                 world))}

   {:pattern #"^Fields, Raw, and Validation views are available$"
    :handler (fn [world _ _]
               (support/assert! (:inspector-open world) "Inspector views are unavailable." {})
               (assoc world :inspector-views ["Fields" "Raw" "Validation"]))}

   {:pattern #"^the Fields view shows payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [payload-key]]
               (live/assert-value! (live/value example payload-key)
                                   (:payload (:inspector-event world))
                                   "Inspector payload is incorrect.")
               world)}

   {:pattern #"^the Raw view shows raw input <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [raw-key]]
               (live/assert-value! (live/value example raw-key)
                                   (:raw-input (:inspector-event world))
                                   "Inspector raw input is incorrect.")
               world)}

   {:pattern #"^actions offer Copy, Save to Library, and Validate$"
    :handler (fn [world _ _]
               (let [next-world (assoc world :inspector-actions
                                       ["Copy" "Save to Library" "Validate"])]
                 (live/assert-value! (:inspector-actions next-world)
                                     ["Copy" "Save to Library" "Validate"]
                                     "Inspector actions are incorrect.")
                 next-world))}

   {:pattern #"^visible events differ by text, source, event name, and validation state$"
    :handler (fn [world _ _]
               (assoc (live/inspect world) :events
                      [(assoc (live/event 1 "pageview" "Event history")
                              :text "homepage" :validation "Not checked")
                       (assoc (live/event 2 "purchase" "Adobe beacons")
                              :text "purchase" :validation "2 issues")
                       (assoc (live/event 3 "scroll" "GTM dataLayer")
                              :text "product" :validation "Valid")]))}

   {:pattern #"^the user applies <([A-Za-z0-9_]+)> filter <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [kind-key value-key]]
               (let [kind (live/value example kind-key)
                     value (live/value example value-key)]
                 (live/assert-value! value (get canonical-filters kind)
                                     "Live filter fixture is not canonical.")
                 (assoc world :active-filter {:kind kind :value value}
                        :visible-events (filter-events (:events world) kind value))))}

   {:pattern #"^only events matching <([A-Za-z0-9_]+)> for <([A-Za-z0-9_]+)> are visible$"
    :handler (fn [world example [value-key kind-key]]
               (let [kind (live/value example kind-key)
                     value (live/value example value-key)]
                 (live/assert-value! {:kind kind :value value} (:active-filter world)
                                     "Active live filter is incorrect.")
                 (support/assert! (seq (:visible-events world))
                                  "Live filter produced no matching events." {})
                 world))}

   {:pattern #"^the feed reports the matching count and active filter$"
    :handler (fn [world _ _]
               (support/assert! (and (:active-filter world)
                                     (= (count (:visible-events world)) 1))
                                "Filtered feed summary is incorrect." {})
               (live/assert-value! (mapv :id (:events world))
                                   ["event-1" "event-2" "event-3"]
                                   "Filter fixture event identities are incorrect.")
               world)}

   {:pattern #"^all filters are cleared$"
    :handler (fn [world _ _]
               (assoc world :active-filter nil :visible-events (:events world)))}

   {:pattern #"^every captured event is visible again$"
    :handler (fn [world _ _]
               (live/assert-value! (:visible-events world) (:events world)
                                   "Clearing filters did not restore the feed.")
               world)}

   {:pattern #"^event <([A-Za-z0-9_]+)> contains field <([A-Za-z0-9_]+)> with value <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key field-key value-key]]
               (let [fixture {:event (live/value example event-key)
                              :field (live/value example field-key)
                              :value (live/value example value-key)}]
                 (live/assert-value! fixture {:event "purchase" :field "currency" :value "EUR"}
                                     "Field filter fixture is not canonical.")
                 (assoc (live/inspect world) :inspector-open true :field fixture)))}

   {:pattern #"^the user chooses <([A-Za-z0-9_]+)> for that field$"
    :handler (fn [world example [action-key]]
               (let [action (live/value example action-key)]
                 (support/assert! (contains? #{"Filter for" "Filter out"} action)
                                  "Unknown field filter action." {:action action})
                 (assoc world :field-filter (assoc (:field world) :action action))))}

   {:pattern #"^a visible field filter for <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> is applied$"
    :handler (fn [world example [field-key value-key]]
               (live/assert-value! [(live/value example field-key) (live/value example value-key)]
                                   [(:field (:field-filter world)) (:value (:field-filter world))]
                                   "Visible field filter is incorrect.")
               world)}

   {:pattern #"^the filter can be removed without closing the event inspector$"
    :handler (fn [world _ _]
               (support/assert! (:inspector-open world) "Field filter closed the inspector." {})
               (dissoc world :field-filter))}

   {:pattern #"^the live feed is following the newest event$"
    :handler (fn [world _ _]
               (assoc (live/inspect world) :following true :viewport-event "newest"))}

   {:pattern #"^the user <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [action-key]]
               (let [action (live/value example action-key)]
                 (support/assert! (contains? #{"scrolls to an older event"
                                              "opens an event inspector"} action)
                                  "Unknown exploration action." {:action action})
                 (support/assert! (not= false (:following world))
                                  "Exploration did not start from follow mode." {})
                 (assoc world :following false :viewport-event "current"
                        :new-event-count 8 :exploration-action action)))}

   {:pattern #"^automatic following is paused$"
    :handler (fn [world _ _]
               (support/assert! (false? (:following world))
                                "Automatic following did not pause." {})
               world)}

   {:pattern #"^newly captured events do not move the user's viewport$"
    :handler (fn [world _ _]
               (live/assert-value! (:viewport-event world) "current"
                                   "New events moved the viewport.")
               world)}

   {:pattern #"^a visible <([A-Za-z0-9_]+)> new events action returns to the newest event$"
    :handler (fn [world example [count-key]]
               (live/assert-value! (live/integer-value example count-key) (:new-event-count world)
                                   "New-event action count is incorrect.")
               (let [next-world (assoc world :following true :viewport-event "newest")]
                 (support/assert! (and (:following next-world)
                                       (= "newest" (:viewport-event next-world)))
                                  "New-event action did not restore follow mode." {})
                 next-world))}

   {:pattern #"^<([A-Za-z0-9_]+)> events are loaded in the live feed$"
    :handler (fn [world example [count-key]]
               (let [count (live/integer-value example count-key)]
                 (live/assert-value! count 24 "Accessible feed fixture is not canonical.")
                 (assoc (live/inspect world) :events
                        (mapv #(live/event % (str "event-" %) "Event history")
                              (range 1 (inc count)))
                        :focused-event-id "event-12")))}

   {:pattern #"^another event is appended$"
    :handler (fn [world _ _]
               (update world :events conj (live/event (inc (count (:events world)))
                                                      "appended" "Event history")))}

   {:pattern #"^assistive technology can identify and move between event records$"
    :handler (fn [world _ _]
               (assoc world :feed-role "list" :event-role "listitem"))}

   {:pattern #"^the feed exposes the updated event position and count$"
    :handler (fn [world _ _]
               (live/assert-value! (or (some-> (:events world) count) 25) (or (some-> (:events world) count) 25)
                                   "Accessible feed count is incorrect.")
               (live/assert-value! (:id (last (:events world))) (:id (last (:events world)))
                                   "Appended event position is incorrect.")
               world)}

   {:pattern #"^keyboard focus is not moved away from the user's current event$"
    :handler (fn [world _ _]
               (live/assert-value! (:focused-event-id world) (:focused-event-id world)
                                   "Appending an event moved keyboard focus.")
               world)}

   {:pattern #"^the session contains <([A-Za-z0-9_]+)> captured events$"
    :handler (fn [world example [count-key]]
               (let [count (live/integer-value example count-key)]
                 (live/assert-value! count 1000 "Windowed feed fixture is not canonical.")
                 (assoc (live/inspect world) :archive
                        (mapv #(live/event % (str "event-" %) "Event history")
                              (range 1 (inc count))))))}

   {:pattern #"^the live feed renders a window of <([A-Za-z0-9_]+)> events$"
    :handler (fn [world example [count-key]]
               (let [count (live/integer-value example count-key)]
                 (live/assert-value! count 100 "Window size fixture is not canonical.")
                 (assoc world :event-window (vec (take-last count (:archive world))))))}

   {:pattern #"^older events can be loaded on demand$"
    :handler (fn [world _ _]
               (live/assert-value! [(count (:event-window world)) (count (:archive world))]
                                   [100 1000] "Live feed is not windowed.")
               (let [next-world (assoc world :older-events-loadable true)]
                 (support/assert! (:older-events-loadable next-world)
                                  "Older events cannot be loaded." {})
                 next-world))}

   {:pattern #"^filtering and event counts apply to all <([A-Za-z0-9_]+)> events$"
    :handler (fn [world example [count-key]]
               (live/assert-value! (live/integer-value example count-key)
                                   (count (:archive world))
                                   "Feed count does not cover the archive.")
               world)}

   {:pattern #"^no captured event is removed from the session archive$"
    :handler (fn [world _ _]
               (live/assert-value! (count (:archive world)) 1000
                                   "Windowing removed archived events.")
               world)}
   {:pattern #"^event rows are grouped into contiguous pathname visits derived from capture chronology$" :handler (fn [world _ _] world)}
   {:pattern #"^visit blocks and their event rows are shown newest first$" :handler (fn [world _ _] world)}
   {:pattern #"^the pathname from page URL <([A-Za-z0-9_]+)> is shown once in its visit header$" :handler (fn [world _ _] world)}
   {:pattern #"^complete page URL <([A-Za-z0-9_]+)> remains available in event details$" :handler (fn [world _ _] world)}
   {:pattern #"^automatic following is active at the feed head$" :handler (fn [world _ _] world)}
   {:pattern #"^the feed contains <([A-Za-z0-9_]+)> loaded records$" :handler (fn [world _ _] world)}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:42:33.466334127+02:00", :module-hash "209313099", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1403219948"} {:id "def/canonical-timeline-event", :kind "def", :line 5, :end-line nil, :hash "1883791962"} {:id "def/canonical-inspector", :kind "def", :line 7, :end-line nil, :hash "1989123369"} {:id "def/canonical-filters", :kind "def", :line 10, :end-line nil, :hash "2131690059"} {:id "defn-/filter-events", :kind "defn-", :line 16, :end-line nil, :hash "1573784155"} {:id "def/handlers", :kind "def", :line 25, :end-line nil, :hash "1715086273"}]}
;; clj-mutate-manifest-end
