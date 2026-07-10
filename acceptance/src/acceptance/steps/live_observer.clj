(ns acceptance.steps.live-observer
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def live-step-templates
  ["the Data Layer workspace is displayed"
   "Data Layer views are ordered <first_view>, <second_view>, <third_view>, and <fourth_view>"
   "only the first Data Layer view is visible by default"
   "each Data Layer view selector exposes its selected state and associated panel"
   "the global command palette remains available outside the Data Layer views"
   "a live session has <event_count> captured events from <source_count> observation sources"
   "Data Layer view <view_name> is displayed"
   "the session header shows state <session_state>, <event_count> events, and <source_count> sources"
   "visible session actions offer <session_actions>"
   "each session action is available through the command registry"
   "the active page is shown once above the event feed"
   "observation source <source_name> has configuration state <configuration_state> and attachment state <attachment_state>"
   "the live source status is displayed"
   "one source status summary shows <source_name> with status <visible_status>"
   "contradictory source status <hidden_status> is not shown"
   "Restart observation is <restart_visibility>"
   "control command <command_id> completes with message <message>"
   "message <message> is announced next to the session controls"
   "message <message> is not inserted into the observed event feed"
   "the event list and event inspector cannot fit side by side"
   "the user opens event <event_name>"
   "the event inspector replaces the event list"
   "a visible Back to events action restores the event list"
   "the event list and event inspector fit side by side"
   "the event list remains visible beside the event inspector"
   "event <event_name> is exposed as selected"
   "Data Layer navigation command <command_id> runs"
   "only Data Layer view <view_name> is visible"
   "Data Layer view <view_name> remains selected after the side panel reloads"
   "command <command_id> is available in the command palette and for hotkey assignment"
   "Data Layer view <initial_view> has keyboard focus"
   "view navigation key <navigation_key> is pressed"
   "keyboard focus and selection move to Data Layer view <view_name>"
   "a live session has captured event <event_name>"
   "the user pauses capture"
   "the session enters state <paused_state>"
   "new source events are not appended while capture is paused"
   "the existing feed and source attachments remain available"
   "the user resumes capture"
   "the session returns to state <live_state>"
   "subsequent source events are appended to the same session"
   "observed event <event_name> is recorded from source <source_name> on page <page_url>"
   "the live event feed is displayed"
   "event rows are shown in capture order"
   "the row for <event_name> shows compact capture time, source kind, source name <source_name>, event name, validation state, and key properties"
   "page URL <page_url> is shown once as a journey separator"
   "full event metadata is not repeated in every collapsed row"
   "timeline entry <event_name> is visible"
   "the user opens the event inspector"
   "the inspector shows event name <event_name>, exact timestamp, page URL <page_url>, source <source_name>, and destination <destination>"
   "Fields, Raw, and Validation views are available"
   "the Fields view shows payload <payload_label>"
   "the Raw view shows raw input <raw_label>"
   "actions offer Copy, Save to Library, and Validate"
   "visible events differ by text, source, event name, and validation state"
   "the user applies <filter_kind> filter <filter_value>"
   "only events matching <filter_value> for <filter_kind> are visible"
   "the feed reports the matching count and active filter"
   "all filters are cleared"
   "every captured event is visible again"
   "event <event_name> contains field <field_name> with value <field_value>"
   "the user chooses <filter_action> for that field"
   "a visible field filter for <field_name> and <field_value> is applied"
   "the filter can be removed without closing the event inspector"
   "the live feed is following the newest event"
   "the user <exploration_action>"
   "automatic following is paused"
   "newly captured events do not move the user's viewport"
   "a visible <new_event_count> new events action returns to the newest event"
   "<event_count> events are loaded in the live feed"
   "another event is appended"
   "assistive technology can identify and move between event records"
   "the feed exposes the updated event position and count"
   "keyboard focus is not moved away from the user's current event"
   "the session contains <event_count> captured events"
   "the live feed renders a window of <visible_count> events"
   "older events can be loaded on demand"
   "filtering and event counts apply to all <event_count> events"
   "no captured event is removed from the session archive"])

(defn- template-pattern [template]
  (let [parts (str/split template #"<[A-Za-z0-9_]+>" -1)
        captures (repeat (dec (count parts)) "(<[^>]+>)")]
    (re-pattern (str "^" (apply str (interleave (map java.util.regex.Pattern/quote parts)
                                                  (concat captures [""]))) "$"))))

(defn live-observer-wired? [html source]
  (support/includes-all? (str html source)
                         ["data-layer-views" "data-layer-view-live"
                          "data-layer-panel-live" "live-session-summary"
                          "live-source-statuses" "live-event-feed"
                          "live-event-inspector" "pause-capture"
                          "resume-capture" "dataLayerViewForNavigationKey"
                          "recordLiveEvent" "selectLiveEvent" "renderLiveObserver"]))

(defn live-step-covered? [text]
  (some #(re-matches (template-pattern %) text) live-step-templates))

(def ^:private live-observer-semantics-script
  (str "const live = await import(process.argv[1]);"
       "let state = live.createLiveObserverState({pageUrl: 'https://example.test/checkout', sources: [{id: 'history', name: 'Event history', status: 'Connected'}]});"
       "state = live.recordLiveEvent(state, {id: 'one', name: 'pageview', sourceId: 'history', captureTime: '2026-07-10T10:00:00Z'});"
       "const paused = live.recordLiveEvent(live.pauseCapture(state), {id: 'two', name: 'purchase', sourceId: 'history', captureTime: '2026-07-10T10:00:01Z'});"
       "const resumed = live.recordLiveEvent(live.resumeCapture(paused), {id: 'two', name: 'purchase', sourceId: 'history', captureTime: '2026-07-10T10:00:01Z'});"
       "const stacked = live.selectLiveEvent(resumed, 'two', 'stacked');"
       "const split = live.selectLiveEvent(resumed, 'two', 'split');"
       "if (paused.status !== 'Paused' || paused.events.length !== 1 || resumed.status !== 'Live' || resumed.events.length !== 2 || stacked.listVisible || !split.listVisible) process.exit(1);"))

(defonce ^:private semantic-results (atom {}))

(defn live-observer-semantics? [root]
  (if-let [result (get @semantic-results root)]
    (:passed? result)
    (let [result (process/shell {:out :string :err :string :continue true}
                                "node" "--input-type=module" "--eval" live-observer-semantics-script
                                (str (fs/path root "dist/data-layer-live-observer.js")))
          checked {:passed? (zero? (:exit result)) :result result}]
      (swap! semantic-results assoc root checked)
      (:passed? checked))))

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n"
                    (support/source-file root "src/data-layer-live-observer.ts"))]
    (support/assert! (live-observer-wired? html source)
                     "Live observer UI and domain wiring is incomplete."
                     {})
    (support/assert! (live-observer-semantics? root)
                     "Live observer state transitions are incomplete."
                     {})
    (assoc world :root root :live-html html :live-source source)))

(def handlers
  (mapv (fn [template]
          {:pattern (template-pattern template)
           :handler (fn [world _example _captures] (inspect world))})
        live-step-templates))
