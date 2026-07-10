(ns acceptance.steps.observation-targets-support
  (:require [acceptance.steps.support :as support]))

(def canonical-example-values
  {"access_state" #{"Ready" "Permission required" "Restricted" "Closed"}
   "command_action" #{"Choose target" "Attach selected target" "Detach target"}
   "command_id" #{"data-layer.choose-observation-target"
                  "data-layer.attach-selected-target"
                  "data-layer.detach-observation-target"}
   "command_result" #{"Attached" "Permission required"}
   "current_target" #{"Checkout"}
   "discovery_action" #{"Browse all tabs"}
   "discovery_result" #{"All open tabs become available on grant"
                        "Registered targets remain available"}
   "explanation" #{"Chrome pages cannot be observed"
                   "Extension pages cannot be observed"}
   "failure_condition" #{"tab metadata unavailable"
                         "script injection denied"
                         "tab closed"}
   "first_tab" #{"Checkout tab 1"}
   "history_path" #{"event.history"}
   "invocation" #{"toolbar action" "browser shortcut"}
   "navigation_key" #{"ArrowDown" "ArrowUp"}
   "new_target" #{"Purchase confirmation"}
   "next_url" #{"https://shop.example.test/confirmation"}
   "operation" #{"target attachment" "target discovery"}
   "origin" #{"https://shop.example.test"}
   "other_tab" #{"Docs"}
   "page_access_state" #{"Available"}
   "page_title" #{"Checkout" "Purchase confirmation" "Extensions"
                  "Closed checkout" "Extension panel" "New tab"}
   "page_titles" #{"Home, Checkout, and Purchase confirmation"}
   "page_url" #{"https://shop.example.test/checkout"
                "https://shop.example.test/confirmation"}
   "panel_width" #{"320 px" "720 px"}
   "path_state" #{"Ready" "Path missing"}
   "permission_state" #{"not granted" "denied"}
   "project_name" #{"my-chrome-utilities"}
   "query" #{"purchase"}
   "readiness" #{"Ready" "Permission required"}
   "recovery_action" #{"Choose target" "Request access"}
   "result" #{"Attached to Checkout" "3 eligible targets"}
   "second_tab" #{"Checkout tab 2"}
   "selection_action" #{"Choose target"}
   "session_action" #{"End testing"}
   "start_url" #{"https://shop.example.test/checkout"}
   "status_explanation" #{"Page can be observed"
                          "Site access is required"
                          "Chrome pages cannot be observed"
                          "The browser tab is no longer available"}
   "tab_id" #{"42"}
   "target_action" #{"Select" "Request access" "unavailable"}
   "target_state" #{"Detached" "Attached" "Target unavailable"
                    "Permission required" "Restricted"
                    "Selection required" "Closed"}
   "url_scheme" #{"chrome" "chrome-extension"}
   "window_names" #{"Main and Test checkout"}})

(def compatibility-example-values
  {"adapter_kind" #{"Adobe" "Data Layer" "GTAG"}
   "adapter_name" #{"Data Layer" "GTAG"}
   "attachment_state" #{"attached" "detached"}
   "command_id" #{"data-layer.end-testing" "data-layer.show-library"
                  "data-layer.show-live" "data-layer.show-schemas"
                  "data-layer.show-sessions" "data-layer.start-testing"}
   "configuration_state" #{"missing" "valid"}
   "connected_source" #{"Adobe beacons"}
   "connected_status" #{"Connected"}
   "destination" #{"/g/collect endpoint" "event.history"}
   "event_action" #{"Save to Library"}
   "event_count" #{"2" "42"}
   "event_name" #{"page_view" "pageview" "purchase" "signup"}
   "existing_event" #{"pageview"}
   "existing_events" #{"pageview, offer_view"}
   "failing_source" #{"Event history"}
   "failure_status" #{"Path missing"}
   "first_page" #{"https://www.example.com/"}
   "first_path" #{"event.history"}
   "first_request" #{"path input refresh"}
   "first_source" #{"Event history"}
   "first_view" #{"Live"}
   "fourth_view" #{"Schemas"}
   "hidden_status" #{"Connected" "Path missing"}
   "history_path" #{"dataLayerHistory" "event.history" "missing.path"
                    "queue.history" "queue.value" "test_obj.history"
                    "window.dataLayer"}
   "initial_view" #{"Live" "Schemas"}
   "live_event" #{"purchase"}
   "live_state" #{"Live"}
   "message" #{"Data Layer observation started" "Data Layer observation stopped"}
   "navigation_key" #{"ArrowRight" "End" "Home"}
   "next_url" #{"https://example.test/" "https://example.test/cart/"
                "https://example.test/p/"}
   "object_label" #{"purchase-object"}
   "old_path" #{"window.dataLayer"}
   "page_access_status" #{"page access unavailable"}
   "page_url" #{"https://example.test/cart/" "https://example.test/p/"
                "https://www.example.com/" "https://www.example.com/checkout"}
   "path_status" #{"path missing"}
   "paused_state" #{"Paused"}
   "payload_label" #{"purchase-values" "signup-payload" "signup-values"}
   "primary_actions" #{"Pause and Stop" "Resume and Stop"}
   "project_name" #{"my-chrome-utilities"}
   "refreshed_page_url" #{"https://www.example.com/"
                          "https://www.example.com/product"}
   "restart_visibility" #{"hidden" "visible"}
   "second_path" #{"window.dataLayer"}
   "second_request" #{"manual restart"}
   "second_source" #{"GTM dataLayer"}
   "second_view" #{"Library"}
   "selected_source" #{"Adobe beacons"}
   "session_action" #{"End testing" "Stop capture"}
   "session_actions" #{"Pause capture, Stop, and Save"}
   "session_state" #{"Live" "Paused"}
   "side_panel_url" #{"chrome-extension://extension/side-panel.html"}
   "source_count" #{"1" "3"}
   "source_kinds" #{"Data Layer, Adobe, and GTAG"}
   "source_name" #{"Adobe beacons" "Event history" "GA4 collect" "event.history"}
   "source_names" #{"Event history and Adobe beacons"}
   "source_status" #{"Connected" "Disconnected"}
   "start_url" #{"https://example.test/"}
   "status" #{"attached" "needs sync" "not an array" "path missing" "ready"}
   "third_view" #{"Sessions"}
   "total_count" #{"42"}
   "validation_state" #{"2 issues" "Valid"}
   "view_name" #{"Library" "Live" "Schemas" "Sessions"}
   "visible_count" #{"7"}
   "visible_status" #{"Connected" "Path missing"}})

(def all-canonical-example-values
  (merge-with into canonical-example-values compatibility-example-values))

(defn validate-example! [example capture-keys]
  (let [target-keys (filter #(contains? all-canonical-example-values %)
                            (distinct capture-keys))]
    (support/validate-example-domain!
     all-canonical-example-values
     example
     target-keys
     "Observation-target example is outside its canonical domain.")))

(defn validate-all-example-values! [example]
  (validate-example! example (map (comp name key) example)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T19:19:22.20651754+02:00", :module-hash "-1505161991", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-368274361"} {:id "def/canonical-example-values", :kind "def", :line 4, :end-line nil, :hash "-1371227299"} {:id "def/compatibility-example-values", :kind "def", :line 59, :end-line nil, :hash "-743813621"} {:id "def/all-canonical-example-values", :kind "def", :line 130, :end-line nil, :hash "-871608742"} {:id "defn/validate-example!", :kind "defn", :line 133, :end-line nil, :hash "22053562"} {:id "defn/validate-all-example-values!", :kind "defn", :line 142, :end-line nil, :hash "-1634185464"}]}
;; clj-mutate-manifest-end
