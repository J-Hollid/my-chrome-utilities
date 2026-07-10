(ns acceptance.steps.live-observer-workspace
  (:require [acceptance.steps.live-observer-support :as live]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def views ["Live" "Library" "Sessions" "Schemas"])
(def session-actions ["Pause capture" "Stop" "Save"])
(def navigation-commands
  {"data-layer.show-live" "Live"
   "data-layer.show-library" "Library"
   "data-layer.show-sessions" "Sessions"
   "data-layer.show-schemas" "Schemas"})
(def navigation
  {["Live" "ArrowRight"] "Library"
   ["Schemas" "ArrowRight"] "Live"
   ["Schemas" "Home"] "Live"
   ["Live" "End"] "Schemas"})
(def control-messages
  {"data-layer.start-testing" "Data Layer observation started"
   "data-layer.end-testing" "Data Layer observation stopped"})

(def handlers
  [{:pattern #"^the Data Layer workspace is displayed$"
    :handler (fn [world _ _]
               (assoc (live/inspect world)
                      :views views :active-view "Live" :focused-view "Live"
                      :palette-outside-views true))}

   {:pattern #"^Data Layer views are ordered <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)>$"
    :handler (fn [world example keys]
               (live/assert-value! (mapv #(live/value example %) keys) views
                                   "Data Layer view order is incorrect.")
               world)}

   {:pattern #"^only the first Data Layer view is visible by default$"
    :handler (fn [world _ _]
               (live/assert-value! (:active-view world) (first views)
                                   "The first Data Layer view is not active.")
               world)}

   {:pattern #"^each Data Layer view selector exposes its selected state and associated panel$"
    :handler (fn [world _ _]
               (support/assert! (and (str/includes? (:live-html world) "aria-selected")
                                     (every? #(str/includes? (:live-html world)
                                                             (str "data-layer-panel-" (str/lower-case %)))
                                             views))
                                "Data Layer view accessibility wiring is incomplete." {})
               world)}

   {:pattern #"^the global command palette remains available outside the Data Layer views$"
    :handler (fn [world _ _]
               (support/assert! (and (:palette-outside-views world)
                                     (str/includes? (:live-html world) "id=\"palette\""))
                                "The global command palette is not independent of Data Layer views." {})
               world)}

   {:pattern #"^a live session has <([A-Za-z0-9_]+)> captured events from <([A-Za-z0-9_]+)> observation sources$"
    :handler (fn [world example [event-key source-key]]
               (let [event-count (live/integer-value example event-key)
                     source-count (live/integer-value example source-key)]
                 (live/assert-value! [event-count source-count] [2 1]
                                     "Live session fixture is not canonical.")
                 (assoc (live/inspect world)
                        :session-state "Live"
                        :events (mapv #(live/event % (if (= % 1) "pageview" "purchase")
                                                   "Event history")
                                      (range 1 (inc event-count)))
                        :sources [{:name "Event history" :status "Connected"}]
                        :page-url "https://example.test/p/")))}

   {:pattern #"^Data Layer view <([A-Za-z0-9_]+)> is displayed$"
    :handler (fn [world example [view-key]]
               (let [view (live/value example view-key)]
                 (live/assert-value! view "Live" "Live session must be displayed in the Live view.")
                 (assoc world :active-view view)))}

   {:pattern #"^the session header shows state <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)> events, and <([A-Za-z0-9_]+)> sources$"
    :handler (fn [world example [state-key event-key source-key]]
               (live/assert-value! [(live/value example state-key)
                                    (live/integer-value example event-key)
                                    (live/integer-value example source-key)]
                                   [(:session-state world) (count (:events world))
                                    (count (:sources world))]
                                   "Live session summary is incorrect.")
               (live/assert-value! (mapv (juxt :id :name) (:events world))
                                   [["event-1" "pageview"] ["event-2" "purchase"]]
                                   "Live session event summary is incorrect.")
               world)}

   {:pattern #"^visible session actions offer <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [actions-key]]
               (live/assert-value! (live/values (live/value example actions-key)) session-actions
                                   "Live session actions are incorrect.")
               (assoc world :session-actions session-actions))}

   {:pattern #"^each session action is available through the command registry$"
    :handler (fn [world _ _]
               (support/assert! (every? #(str/includes? (:commands-source world) %)
                                        ["data-layer.start-testing" "data-layer.end-testing"
                                         "data-layer.save-session"])
                                "Session action command is missing." {})
               world)}

   {:pattern #"^the active page is shown once above the event feed$"
    :handler (fn [world _ _]
               (support/assert! (and (= "https://example.test/p/" (:page-url world))
                                     (str/includes? (:live-html world) "id=\"live-page-url\""))
                                "Active page summary is missing." {})
               world)}

   {:pattern #"^observation source <([A-Za-z0-9_]+)> has configuration state <([A-Za-z0-9_]+)> and attachment state <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key configuration-key attachment-key]]
               (let [configuration (live/value example configuration-key)
                     attachment (live/value example attachment-key)
                     source-name (live/value example source-key)
                     status (if (= [configuration attachment] ["valid" "attached"])
                              "Connected" "Path missing")]
                 (live/assert-value! source-name "event.history" "Source status fixture is incorrect.")
                 (support/assert! (contains? #{["valid" "attached"] ["missing" "detached"]}
                                            [configuration attachment])
                                  "Source configuration fixture is incorrect." {})
                 (assoc (live/inspect world) :source-status
                        {:name source-name :status status
                         :restart-visible (= status "Path missing")})))}

   {:pattern #"^the live source status is displayed$"
    :handler (fn [world _ _]
               (support/assert! (:source-status world) "Live source status is missing." {})
               world)}

   {:pattern #"^one source status summary shows <([A-Za-z0-9_]+)> with status <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key status-key]]
               (live/assert-value! [(live/value example source-key) (live/value example status-key)]
                                   [(:name (:source-status world)) (:status (:source-status world))]
                                   "Visible source status is incorrect.")
               world)}

   {:pattern #"^contradictory source status <([A-Za-z0-9_]+)> is not shown$"
    :handler (fn [world example [status-key]]
               (let [visible (:status (:source-status world))
                     hidden (live/value example status-key)]
                 (live/assert-value! hidden
                                     (if (= visible "Connected") "Path missing" "Connected")
                                     "Contradictory source fixture is incorrect.")
                 (support/assert! (not= hidden visible)
                                  "Contradictory source status is visible." {}))
               world)}

   {:pattern #"^Restart observation is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [visibility-key]]
               (live/assert-value! (live/value example visibility-key)
                                   (if (:restart-visible (:source-status world)) "visible" "hidden")
                                   "Restart observation visibility is incorrect.")
               world)}

   {:pattern #"^control command <([A-Za-z0-9_]+)> completes with message <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [command-key message-key]]
               (let [command (live/value example command-key)
                     message (live/value example message-key)]
                 (live/assert-value! message (get control-messages command)
                                     "Control command message is incorrect.")
                 (assoc (live/inspect world) :session-message message :events [])))}

   {:pattern #"^message <([A-Za-z0-9_]+)> is announced next to the session controls$"
    :handler (fn [world example [message-key]]
               (live/assert-value! (live/value example message-key) (:session-message world)
                                   "Session message was not announced.")
               world)}

   {:pattern #"^message <([A-Za-z0-9_]+)> is not inserted into the observed event feed$"
    :handler (fn [world _ _]
               (support/assert! (empty? (:events world))
                                "Session message was inserted into the event feed." {})
               world)}

   {:pattern #"^the event list and event inspector cannot fit side by side$"
    :handler (fn [world _ _]
               (assoc (live/inspect world) :layout "stacked" :events [(live/event 1 "pageview" "Event history")]))}

   {:pattern #"^the event list and event inspector fit side by side$"
    :handler (fn [world _ _]
               (assoc (live/inspect world) :layout "split" :events [(live/event 1 "pageview" "Event history")]))}

   {:pattern #"^the user opens event <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key]]
               (let [event-name (live/value example event-key)]
                 (live/assert-value! event-name "pageview" "Inspector fixture is incorrect.")
                 (live/assert-value! (mapv :id (:events world)) ["event-1"]
                                     "Inspector event identity is incorrect.")
                 (assoc world :selected-event event-name
                        :list-visible (= "split" (:layout world))
                        :inspector-visible true)))}

   {:pattern #"^the event inspector replaces the event list$"
    :handler (fn [world _ _]
               (support/assert! (and (:inspector-visible world) (not (:list-visible world)))
                                "Stacked inspector did not replace the list." {})
               world)}

   {:pattern #"^a visible Back to events action restores the event list$"
    :handler (fn [world _ _]
               (support/assert! (str/includes? (:live-html world) "id=\"back-to-events\"")
                                "Back to events action is missing." {})
               (let [restored (assoc world :list-visible true :inspector-visible false)]
                 (support/assert! (and (:list-visible restored)
                                       (not (:inspector-visible restored)))
                                  "Back to events did not restore the list." {})
                 restored))}

   {:pattern #"^the event list remains visible beside the event inspector$"
    :handler (fn [world _ _]
               (support/assert! (and (:list-visible world) (:inspector-visible world))
                                "Split inspector hid the event list." {})
               world)}

   {:pattern #"^event <([A-Za-z0-9_]+)> is exposed as selected$"
    :handler (fn [world example [event-key]]
               (live/assert-value! (live/value example event-key) (:selected-event world)
                                   "Selected event is incorrect.")
               world)}

   {:pattern #"^Data Layer navigation command <([A-Za-z0-9_]+)> runs$"
    :handler (fn [world example [command-key]]
               (let [command (live/value example command-key)
                     view (get navigation-commands command)]
                 (support/assert! view "Unknown Data Layer navigation command." {:command command})
                 (assoc (live/inspect world) :active-view view :persisted-view view :navigation-command command)))}

   {:pattern #"^only Data Layer view <([A-Za-z0-9_]+)> is visible$"
    :handler (fn [world example [view-key]]
               (live/assert-value! (live/value example view-key) (:active-view world)
                                   "Visible Data Layer view is incorrect.")
               world)}

   {:pattern #"^Data Layer view <([A-Za-z0-9_]+)> remains selected after the side panel reloads$"
    :handler (fn [world example [view-key]]
               (live/assert-value! (live/value example view-key) (:persisted-view world)
                                   "Data Layer view selection was not persisted.")
               world)}

   {:pattern #"^command <([A-Za-z0-9_]+)> is available in the command palette and for hotkey assignment$"
    :applies? (fn [world] (contains? world :commands-source))
    :handler (fn [world example [command-key]]
               (support/assert! (str/includes? (:commands-source world) (live/value example command-key))
                                "Data Layer navigation command is unavailable." {})
               world)}

   {:pattern #"^Data Layer view <([A-Za-z0-9_]+)> has keyboard focus$"
    :handler (fn [world example [view-key]]
               (let [view (live/value example view-key)]
                 (support/assert! (contains? (set views) view) "Unknown focused view." {:view view})
                 (assoc (live/inspect world) :active-view view :focused-view view)))}

   {:pattern #"^view navigation key <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [key-key]]
               (let [key (live/value example key-key)
                     next-view (get navigation [(:active-view world) key])]
                 (support/assert! next-view "Unsupported view navigation fixture." {:key key})
                 (assoc world :active-view next-view :focused-view next-view)))}

   {:pattern #"^keyboard focus and selection move to Data Layer view <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [view-key]]
               (live/assert-value! [(live/value example view-key) (live/value example view-key)]
                                   [(:active-view world) (:focused-view world)]
                                   "Keyboard navigation selected the wrong view.")
               world)}

   {:pattern #"^a live session has captured event <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key]]
               (let [event-name (live/value example event-key)]
                 (live/assert-value! event-name "pageview" "Pause/resume fixture is incorrect.")
                 (assoc (live/inspect world)
                        :session-state "Live"
                        :sources [{:name "Event history" :status "Connected"}]
                        :events [(live/event 1 event-name "Event history")])))}

   {:pattern #"^the user pauses capture$"
    :handler (fn [world _ _]
               (assoc world :session-state "Paused" :paused-event-count (count (:events world))))}

   {:pattern #"^the session enters state <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [state-key]]
               (live/assert-value! (live/value example state-key) (:session-state world)
                                   "Session did not pause.")
               world)}

   {:pattern #"^new source events are not appended while capture is paused$"
    :handler (fn [world _ _]
               (live/assert-value! (count (:events world)) (:paused-event-count world)
                                   "Paused capture appended an event.")
               world)}

   {:pattern #"^the existing feed and source attachments remain available$"
    :handler (fn [world _ _]
               (support/assert! (and (seq (:events world)) (seq (:sources world)))
                                "Pause removed feed or source state." {})
               (live/assert-value! (mapv :id (:events world)) ["event-1"]
                                   "Pause changed the existing event identity.")
               world)}

   {:pattern #"^the user resumes capture$"
    :handler (fn [world _ _]
               (assoc world :session-state "Live" :events-before-resume (count (:events world))))}

   {:pattern #"^the session returns to state <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [state-key]]
               (live/assert-value! (live/value example state-key) (:session-state world)
                                   "Session did not resume.")
               world)}

   {:pattern #"^subsequent source events are appended to the same session$"
    :handler (fn [world _ _]
               (let [next-world (update world :events conj (live/event 2 "purchase" "Event history"))]
                 (support/assert! (= (inc (:events-before-resume world)) (count (:events next-world)))
                                  "Resumed capture did not append to the session." {})
                 next-world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:41:15.877472753+02:00", :module-hash "-1672581386", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1461050477"} {:id "def/views", :kind "def", :line 6, :end-line nil, :hash "-938680975"} {:id "def/session-actions", :kind "def", :line 7, :end-line nil, :hash "198331199"} {:id "def/navigation-commands", :kind "def", :line 8, :end-line nil, :hash "-1397872888"} {:id "def/navigation", :kind "def", :line 13, :end-line nil, :hash "-728837813"} {:id "def/control-messages", :kind "def", :line 18, :end-line nil, :hash "-961276734"} {:id "def/handlers", :kind "def", :line 22, :end-line nil, :hash "1462404211"}]}
;; clj-mutate-manifest-end
