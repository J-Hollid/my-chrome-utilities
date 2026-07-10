(ns acceptance.steps.live-event-presentation-support
  (:require [acceptance.steps.support :as support]))

(def canonical-example-values
  {"capture_phase" #{"existing" "live push"}
   "capture_time" #{"2026-07-10T15:04:44.850Z" "2026-07-10T15:04:46.488Z"}
   "event_name" #{"banner" "checkout" "page_view" "pageview" "purchase"}
   "event_names" #{"pageview, offer_view, click"}
   "existing_event" #{"pageview"}
   "existing_events" #{"pageview, offer_view"}
   "fallback_label" #{"Unknown event"}
   "first_page" #{"https://www.example.com/"}
   "first_request" #{"path input refresh"}
   "history_path" #{"event.history"}
   "input_shape" #{"tuple" "object"}
   "live_event" #{"purchase"}
   "old_path" #{"window.dataLayer"}
   "page_url" #{"https://www.example.com/" "https://www.example.com/checkout"}
   "payload_label" #{"pageview-values" "purchase-values"}
   "project_name" #{"my-chrome-utilities"}
   "property_preview" #{"transaction_id 1234"}
   "provenance" #{"captured:event-history"}
   "raw_label" #{"purchase-tuple" "scalar-input-7"}
   "second_request" #{"manual restart"}
   "session_action" #{"Stop capture" "End testing"}
   "source_name" #{"Adobe beacons" "Event history"}
   "validation_state" #{"Not checked"}})

(defn validate-example! [example capture-keys]
  (support/validate-example-domain!
   canonical-example-values
   example
   (distinct
    (concat capture-keys
            (map #(if (keyword? %) (name %) %) (clojure.core/keys example))))
   "Live-event example is outside its canonical domain."))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T17:52:27.526639608+02:00", :module-hash "-1320254732", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-47281875"} {:id "def/canonical-example-values", :kind "def", :line 4, :end-line nil, :hash "53034911"} {:id "defn/validate-example!", :kind "defn", :line 29, :end-line nil, :hash "-1464813556"}]}
;; clj-mutate-manifest-end
