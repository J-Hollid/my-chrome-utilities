(ns acceptance.steps.operator-interface-support
  (:require [acceptance.steps.support :as support]))

(def canonical-example-values
  {"action_name" #{"Copy payload" "Pause capture" "Save to Library" "Start testing" "Validate"}
   "action_result" #{"failed" "succeeded"}
   "duplicate_choice" #{"Create copy" "Update existing"}
   "duplicate_result" #{"Purchase updated" "distinct copy created"}
   "template_count" #{"1" "2"}
   "access_state" #{"Ready"}
   "first_step" #{"Choose target"}
   "second_step" #{"Confirm access and path"}
   "third_step" #{"Start testing"}
   "disabled_action" #{"Start testing"}
   "disabled_reason" #{"Choose a ready target before starting"}
   "primary_controls" #{"Pause capture and End testing" "Resume capture and End testing"}
   "target_readiness" #{"Ready" "Unavailable"}
   "setup_action" #{"Choose target" "Start testing Checkout"}
   "adapter_kind" #{"Adobe" "Data Layer" "GTAG"}
   "advanced_section" #{"Keymap files"}
   "animation_behavior" #{"brief" "disabled"}
   "assignment" #{"event.history purchase payload"}
   "collection_name" #{"events" "schemas" "sessions" "templates"}
   "command_id" #{"data-layer.start-testing"}
   "component_name" #{"Live view tab" "event row" "observation status" "primary action" "source control" "template JSON editor" "workspace tab"}
   "control_name" #{"Back to events" "Clear source filter" "Connected source" "Delete session" "Pause capture" "Push template"}
   "control_state" #{"destructive" "disabled" "selected" "successful"}
   "destination" #{"event.history"}
   "duplicate_fragments" #{"attached to target, active data layer attached, observation connected"
                           "observation started, event history connected, session is live"}
   "dock_side" #{"left" "right"}
   "draft_state" #{"Invalid" "Unsaved"}
   "edited_command_id" #{"data-layer.end-testing"}
   "editor_actions" #{"Save and Cancel" "Save, Duplicate, Push"}
   "element_name" #{"Live view tab" "Save template"}
   "event_action" #{"Save to Library"}
   "event_count" #{"0" "7" "12" "18" "42"}
   "event_name" #{"banner" "checkout" "page_view" "pageview" "purchase"}
   "external_effect" #{"clipboard contains payload JSON" "event validation state changes" "persisted Library template exists"}
   "first_subview" #{"Event templates"}
   "group_names" #{"Navigation and Data Layer"}
   "initial_state" #{"Not checked"}
   "initial_session_status" #{"Capturing" "Paused"}
   "initial_observer_status" #{"Connected" "Waiting for path"}
   "issue_count" #{"2"}
   "issue_summary" #{"2 schema issues" "JSON error" "Valid"}
   "history_path" #{"event.history" "queue.history"}
   "push_path" #{"dataLayer" "analytics.queue"}
   "first_push_path" #{"dataLayer"}
   "second_push_path" #{"analytics.queue"}
   "invalid_push_path" #{"analytics["}
   "item_name" #{"Purchase confirmation" "Purchase journey"}
   "motion_preference" #{"no preference" "reduce"}
   "navigation_key" #{"ArrowDown"}
   "notification" #{"Pause failed" "Testing started"}
   "middle_event" #{"banner"}
   "latest_event" #{"purchase"}
   "new_event" #{"checkout" "purchase"}
   "existing_events" #{"pageview" "pageview, banner view"}
   "first_page_events" #{"pageview"}
   "next_page_events" #{"checkout, purchase"}
   "oldest_event" #{"pageview"}
   "operation" #{"keymap reload"}
   "page_scope" #{"https://example.test/order/complete"}
   "page_title" #{"Cart" "Checkout" "Order confirmation" "Product detail" "Shop"}
   "old_page_title" #{"Checkout"}
   "new_page_title" #{"Order confirmation"}
   "page_titles" #{"Home, Checkout, Purchase"}
   "other_page_title" #{"Documentation"}
   "tab_id" #{"42" "43" "44"}
   "old_tab_id" #{"42"}
   "new_tab_id" #{"73"}
   "target_value" #{"array containing pageview" "missing" "object containing order"}
   "sample_value" #{"array containing order" "array containing purchase" "missing"}
   "path_status" #{"not an array" "path missing" "ready"}
   "other_tab_id" #{"77"}
   "page_url" #{"https://example.test/home"
                "https://shop.example.test/cart"
                "https://shop.example.test/checkout"
                "https://shop.example.test/checkout?campaign=summer-sale&audience=returning-customers&variant=blue"
                "https://shop.example.test/confirmation"
                "https://shop.example.test/products/blue"
                "https://shop.example.test/product/blue"
                "https://shop.example.test/p/"}
   "next_page_url" #{"https://example.test/checkout"}
   "side_panel_url" #{"chrome-extension://extension/side-panel.html"
                       "chrome-extension://abcdefghijkl/side-panel.html"}
   "panel_width" #{"320" "320 CSS px" "320 px" "360" "480 px" "520" "720" "720 px"}
   "metadata_columns" #{"1" "2" "3"}
   "panel_height" #{"640 CSS px"}
   "primary_action" #{"Push" "Choose target" "Start testing"}
   "primary_actions" #{"Pause capture" "Pause capture and End testing" "Resume capture" "Resume capture and End testing"}
   "project_name" #{"my-chrome-utilities"}
   "payload_label" #{"pageview-values" "purchase-values"}
   "query" #{"checkout"}
   "tab_count" #{"12"}
   "selection_input" #{"Enter" "Select button"}
   "dismissal" #{"Escape" "Close button"}
   "readiness" #{"Ready"}
   "record_name" #{"Checkout journey" "Deleted checkout" "Purchase confirmation" "Purchase event v2" "data-layer.show-live" "purchase event"}
   "recovery_action" #{"Clear filters" "Create schema" "Import session" "Restart observation" "Start observation"}
   "result" #{"added 0, removed 1, unchanged 9" "added 2, removed 0, unchanged 8"}
   "result_state" #{"2 issues"}
   "runner_controls" #{"Run step, Run all, Pause, Stop"}
   "schema_actions" #{"Edit as new version, Duplicate, Export, Delete"}
   "schema_name" #{"Purchase event" "Purchase v2"}
   "scroll_position" #{"480 CSS px" "960 px"}
   "second_subview" #{"Sequences"}
   "semantic_state" #{"2 issues" "Connected" "Destructive"}
   "selected_event" #{"banner"}
   "sequence" #{"C-c s"}
   "sequence_name" #{"Purchase journey"}
   "session_action" #{"Create sequence" "End testing" "Export" "Start testing"}
   "capture_action" #{"none" "Pause capture" "Resume capture"}
   "capture_state" #{"Capturing" "Inactive" "Live" "Paused"}
   "session_actions" #{"Open archived, Resume, Create sequence, Export"}
   "session_name" #{"Checkout journey"}
   "session_state" #{"Capturing" "Live" "Paused"}
   "testing_state" #{"Active" "Ended" "Paused"}
   "session_status" #{"Capturing" "Ended" "Paused"}
   "observer_status" #{"Connected" "Disconnected" "Error" "Waiting for path"}
   "observer_path" #{"analytics" "dataLayer" "event.history" "queue.history"}
   "connected_source_count" #{"0" "1" "2" "3"}
   "source_count" #{"3"}
   "source_name" #{"Adobe beacons" "Event history" "GA4 collect" "event.history"}
   "source_status" #{"Connected" "Disconnected"}
   "state_name" #{"invalid" "restarted" "selected"}
   "step_count" #{"4"}
   "subview_name" #{"Event templates" "Sequences"}
   "target_size" #{"44 CSS px"}
   "template_name" #{"Purchase confirmation"}
   "text_zoom" #{"100 percent" "200 percent"}
   "theme_name" #{"dark" "light"}
   "total_count" #{"42"}
   "usage_count" #{"14"}
   "validation_state" #{"2 issues" "Not checked" "Valid"}
   "validation_summary" #{"16 valid, 2 issues"}
   "version" #{"2" "3"}
   "view_name" #{"Hotkeys" "Library" "Live" "Schemas" "Sessions"}
   "view_state" #{"command assignments" "event inspector" "event list" "invalid schema draft" "key sequence conflict" "no captured events" "no matching templates" "no saved schemas" "no saved sessions" "schema detail" "sequence editor" "session detail" "source connection failed" "template editor"}
   "visible_count" #{"7"}
   "workspace_name" #{"Data Layer" "Hotkeys"}})

(defn validate-example! [example keys]
  (support/validate-example-domain!
   canonical-example-values
   example
   keys
   "Operator-interface example is outside its canonical domain."))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-11T11:11:54.061997004+02:00", :module-hash "1677799820", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "868810159"} {:id "def/canonical-example-values", :kind "def", :line 4, :end-line nil, :hash "497625458"} {:id "defn/validate-example!", :kind "defn", :line 103, :end-line nil, :hash "-160255012"}]}
;; clj-mutate-manifest-end
