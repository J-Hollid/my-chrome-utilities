(ns acceptance.steps.operator-interface-support
  (:require [acceptance.steps.support :as support]))

(def canonical-example-values
  {"action_name" #{"Browse all tabs" "Copy payload" "Discard draft" "Duplicate" "End testing" "Export" "Import session" "Load keymap" "Pause capture" "Push draft" "Push purchase to Checkout" "Save revision" "Save to Library" "Start testing" "Validate"}
   "action_context" #{"Library editor" "Live inspector"}
   "configuration_action" #{"add page_category last" "move page_type before page_name" "edit page_name to content_name" "remove page_type"}
   "expected_paths" #{"page_name, page_type, page_category" "page_type, page_name" "content_name, page_type" "page_name"}
   "exploration_action" #{"reads an older event" "keeps an inspector open"}
   "event_shape" #{"tuple" "object"}
   "payload" #{"page_name=\"\", page_type=\"landing\", page_category=\"Home\"" "offer_action=\"shown\", offer_id=0, campaign=\"summer\""}
   "visible_summaries" #{"Page type=landing, Page category=Home" "Offer action=shown, Offer id=0" "Transaction id order-42, Revenue 49.95" "Page name Products, Page type listing"}
   "resolved_value" #{"null" "undefined" "empty string" "empty array" "empty object" "numeric 0" "boolean false" "non-empty array" "non-empty object"}
   "usability" #{"usable" "unusable"}
   "unresolved_condition" #{"no active target" "permission missing" "destination invalid" "JSON invalid" "adapter not ready"}
   "library_relationship" #{"no linked template" "linked template matches event" "linked template differs from event"}
   "action_label" #{"Save to Library" "Saved" "Update Library template"}
   "availability" #{"enabled" "disabled"}
   "captured_event_count" #{"0" "12"}
   "session_save_state" #{"unsaved" "saved" "nothing to save"}
   "consequence_text" #{"12 captured events have not been saved" "All 12 captured events are saved" "No captured events need saving"}
   "master_region" #{"event feed" "search, template count, and template list" "search, session count, and session list" "search, schema count, and schema list"}
   "detail_region" #{"selected event inspector" "selected template editor" "selected session detail" "selected schema detail"}
   "full_width_region" #{"session summary and capture controls" "Library navigation" "Sessions navigation" "schema creation and import actions"}
   "action_meaning" #{"consequential" "supporting"}
   "action_variant" #{"destructive" "quiet" "secondary"}
   "capture_time" #{"10:03:00" "10:04:00"}
   "action_result" #{"failed" "succeeded"}
   "duplicate_choice" #{"Create copy" "Update existing"}
   "duplicate_result" #{"Purchase updated" "distinct copy created"}
   "template_count" #{"1" "2"}
   "access_state" #{"Granted" "Permission required" "Ready"}
   "probe_outcome" #{"array" "path missing" "not read" "not an array" "read failed"}
   "path_readiness" #{"Ready" "Waiting for path" "Permission required" "Error"}
   "first_step" #{"Choose target"}
   "second_step" #{"Confirm access and path"}
   "third_step" #{"Start testing"}
   "disabled_action" #{"Start testing"}
   "disabled_reason" #{"Choose a ready target before starting" "a ready target must be selected" "the draft has no unsaved changes" "the JSON draft must be valid" "Select a schema to validate" "Select a target before pushing" "Request access for Signal Shop" "Correct destination path queue.history" "Correct the JSON draft" "Make adapter Event history ready"}
   "destructive_action" #{"Discard draft" "End testing"}
   "primary_controls" #{"Pause capture and End testing" "Resume capture and End testing"}
   "target_readiness" #{"Ready" "Unavailable"}
   "transition_message" #{"Checking target" "Requesting access"}
   "new_path_readiness" #{"Ready" "Permission required"}
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
   "destination" #{"checkoutLayer" "dataLayer" "event.history"}
   "duplicate_fragments" #{"attached to target, active data layer attached, observation connected"
                           "observation started, event history connected, session is live"}
   "dock_side" #{"left" "right"}
   "draft_state" #{"Invalid" "Unsaved"}
   "edited_command_id" #{"data-layer.end-testing"}
   "empty_message" #{"No events captured yet"
                     "No schemas saved yet"
                     "No sequences saved yet"
                     "No sessions saved yet"
                     "No templates match these filters"
                     "No templates saved yet"
                     "Source connection failed"}
   "editor_actions" #{"Save and Cancel" "Save, Duplicate, Push"}
   "element_name" #{"Live view tab" "Save template"}
   "event_action" #{"Save to Library"}
   "event_count" #{"0" "7" "12" "18" "42"}
   "event_name" #{"banner" "checkout" "offer" "page_view" "pageview" "purchase"}
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
   "navigation_level" #{"Data Layer" "workspace"}
   "notification" #{"Pause failed" "Testing started"}
   "middle_event" #{"banner"}
   "latest_event" #{"purchase"}
   "new_event" #{"checkout" "confirmation" "pageview" "purchase"}
   "captured_pathname" #{"/checkout" "/confirmation"}
   "expected_top_pathname" #{"/checkout" "/confirmation"}
   "checkout_visit_count" #{"1"}
   "confirmation_visit_count" #{"0" "1"}
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
   "path_status" #{"Error" "Ready" "Waiting for path" "not an array" "path missing" "ready"}
   "pathname" #{"/checkout" "/products"}
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
   "primary_action" #{"End testing" "none" "Pause capture" "Push" "Push draft" "Push purchase to Signal Shop" "Choose target" "Save revision" "Save to Library" "Start testing" "Validate"}
   "primary_count" #{"0" "1"}
   "editing_status" #{"Saved" "Unsaved changes"}
   "primary_actions" #{"Pause capture" "Pause capture and End testing" "Resume capture" "Resume capture and End testing"}
   "project_name" #{"my-chrome-utilities"}
   "payload_label" #{"pageview-values" "purchase-values"}
   "query" #{"checkout"}
   "tab_count" #{"12"}
   "selection_input" #{"Enter" "Select button"}
   "dismissal" #{"Escape" "Close button"}
   "readiness" #{"Ready"}
   "record_name" #{"Checkout journey" "Deleted checkout" "Purchase confirmation" "Purchase event v2" "data-layer.show-live" "purchase event"}
   "recovery_action" #{"Clear filters" "Create schema" "Create sequence" "Edit observer path" "Import session" "Open Live" "Request access" "Restart observation" "Retry target check" "Start observation" "Start testing"}
   "failure_reason" #{"browser storage is unavailable" "event.history is missing" "site access is missing" "target Checkout is closed" "the JSON draft is invalid" "the target read failed"}
   "recovery_step" #{"Choose target" "Correct the JSON" "Retry Save to Library"}
   "result" #{"added 0, removed 1, unchanged 9" "added 2, removed 0, unchanged 8"}
   "result_state" #{"2 issues"}
   "replacement_result" #{"no result" "validation result"}
   "runner_controls" #{"Run step, Run all, Pause, Stop"}
   "schema_actions" #{"Edit as new version, Duplicate, Export, Delete"}
   "schema_name" #{"Ecommerce" "None" "Purchase event" "Purchase v2"}
   "tags" #{"checkout, sale" "none"}
   "scroll_position" #{"480 CSS px" "960 px"}
   "short_template" #{"View"}
   "long_template" #{"International purchase confirmation with campaign"}
   "second_subview" #{"Sequences"}
   "selected_tab" #{"Data Layer" "Live"}
   "subsequent_action" #{"activates Validate" "navigates away from Live" "opens another captured event"}
   "editor_action" #{"Push draft" "Push purchase to Checkout" "Save revision"}
   "success_result" #{"Pushed purchase to Checkout through event.history at 10:04:05" "Saved Purchase confirmation as version 4"}
   "existing_result" #{"Pushed purchase to Checkout at 10:04:05" "Saved Purchase confirmation as version 4"}
   "context_change" #{"the draft changes" "the editor closes" "the selected target changes"}
   "helper_text" #{"Changes create a new version" "Push sends to the active target"}
   "prior_result" #{"Draft is valid" "Ready to push"}
   "new_result" #{"Pushed purchase to Checkout at 10:04:05" "Saved Purchase confirmation as version 4"}
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
   "source_name" #{"Adobe beacons" "Event history" "GA4" "GA4 collect" "event.history"}
   "source_status" #{"Connected" "Disconnected"}
   "state_name" #{"invalid" "restarted" "selected"}
   "step_count" #{"4"}
   "subview_name" #{"Event templates" "Sequences"}
   "target_size" #{"44 CSS px"}
   "template_name" #{"Purchase confirmation" "View"}
   "text_zoom" #{"100 percent" "200 percent"}
   "theme_name" #{"dark" "light"}
   "total_count" #{"42"}
   "usage_count" #{"14"}
   "validation_state" #{"2 issues" "Not checked" "Valid"}
   "validation_summary" #{"16 valid, 2 issues"}
   "version" #{"1" "2" "3"}
   "view_name" #{"Hotkeys" "Library" "Library sequences" "Library templates" "Live" "Schemas" "Sessions"}
   "view_state" #{"browsing command bindings" "browsing saved schemas" "browsing saved sessions" "command assignments" "event inspector" "event list" "invalid schema draft" "key sequence conflict" "no captured events" "no matching templates" "no saved schemas" "no saved sequences" "no saved sessions" "no saved templates" "operator-confirmed push is next" "push review is ready to confirm" "ready target selected" "schema detail" "sequence editor" "session detail" "source connection failed" "template editor" "valid draft has unsaved changes"}
   "visible_count" #{"7"}
   "width_use" #{"longer readable content lines" "purposeful list and detail panes"}
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
