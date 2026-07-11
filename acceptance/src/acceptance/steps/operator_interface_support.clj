(ns acceptance.steps.operator-interface-support
  (:require [acceptance.steps.support :as support]))

(def canonical-example-values
  {"action_name" #{"Copy payload" "Save to Library" "Validate"}
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
   "dock_side" #{"left" "right"}
   "draft_state" #{"Invalid" "Unsaved"}
   "edited_command_id" #{"data-layer.end-testing"}
   "editor_actions" #{"Save and Cancel" "Save, Duplicate, Push"}
   "element_name" #{"Live view tab" "Save template"}
   "event_action" #{"Save to Library"}
   "event_count" #{"18" "42"}
   "event_name" #{"banner" "checkout" "page_view" "pageview" "purchase"}
   "external_effect" #{"clipboard contains payload JSON" "event validation state changes" "persisted Library template exists"}
   "first_subview" #{"Event templates"}
   "group_names" #{"Navigation and Data Layer"}
   "initial_state" #{"Not checked"}
   "issue_count" #{"2"}
   "issue_summary" #{"2 schema issues" "JSON error" "Valid"}
   "item_name" #{"Purchase confirmation" "Purchase journey"}
   "motion_preference" #{"no preference" "reduce"}
   "middle_event" #{"banner"}
   "latest_event" #{"purchase"}
   "new_event" #{"checkout"}
   "oldest_event" #{"pageview"}
   "operation" #{"keymap reload"}
   "page_scope" #{"https://example.test/order/complete"}
   "panel_width" #{"320 CSS px" "320 px" "480 px" "720 px"}
   "panel_height" #{"640 CSS px"}
   "primary_action" #{"Push"}
   "primary_actions" #{"Pause and Stop" "Resume and Stop"}
   "project_name" #{"my-chrome-utilities"}
   "payload_label" #{"purchase-values"}
   "query" #{"checkout"}
   "readiness" #{"Ready"}
   "record_name" #{"Checkout journey" "Deleted checkout" "Purchase confirmation" "Purchase event v2" "data-layer.show-live" "purchase event"}
   "recovery_action" #{"Clear filters" "Create schema" "Import session" "Restart observation" "Start observation"}
   "result" #{"added 0, removed 1, unchanged 9" "added 2, removed 0, unchanged 8"}
   "result_state" #{"2 issues"}
   "runner_controls" #{"Run step, Run all, Pause, Stop"}
   "schema_actions" #{"Edit as new version, Duplicate, Export, Delete"}
   "schema_name" #{"Purchase event" "Purchase v2"}
   "scroll_position" #{"480 CSS px"}
   "second_subview" #{"Sequences"}
   "semantic_state" #{"2 issues" "Connected" "Destructive"}
   "selected_event" #{"banner"}
   "sequence" #{"C-c s"}
   "sequence_name" #{"Purchase journey"}
   "session_action" #{"Create sequence" "Export"}
   "session_actions" #{"Open archived, Resume, Create sequence, Export"}
   "session_name" #{"Checkout journey"}
   "session_state" #{"Live" "Paused"}
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
;; {:version 1, :tested-at "2026-07-11T01:54:26.900725972+02:00", :module-hash "171149775", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "868810159"} {:id "def/canonical-example-values", :kind "def", :line 4, :end-line nil, :hash "-2067723136"} {:id "defn/validate-example!", :kind "defn", :line 81, :end-line nil, :hash "-160255012"}]}
;; clj-mutate-manifest-end
