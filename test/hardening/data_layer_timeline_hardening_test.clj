(ns hardening.data-layer-timeline-hardening-test
  (:require [acceptance.steps.all :as steps]
            [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.data-layer-timeline :as timeline]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(deftest hardens-canonical-payload-property-comparison
  (let [state (-> {}
                  (timeline/record-observed-event-with-payload
                   {:event-name timeline/canonical-expanded-event-name
                    :payload-properties (str "scroll_percentage" ": \"75\"")}))]
    (is (timeline/canonical-payload-properties-match? state "scroll"))))

(deftest hardens-timeline-capture-into-active-session
  (let [session-state (session/start-session
                       {}
                       {:tab-id "active-tab"
                        :url "https://example.test/"
                        :history-path "event.history"})
        state (timeline/record-observed-event-with-payload
               {:session-state session-state}
               {:event-name "scroll"
                :payload-properties "scroll_percentage: \"75\""})]
    (is (= "scroll"
           (get-in state [:session-state :session :timeline 0 :name])))))

(deftest hardens-expanded-and-tuple-timeline-state-transitions
  (is (= [:passed :passed :passed]
         (support/run-features
          ["build/acceptance/ir/data-layer-nested-event-timeline.json"
           "build/acceptance/ir/data-layer-timeline-expanded-state.json"
           "build/acceptance/ir/data-layer-tuple-event-display.json"]
          steps/handlers))))

(deftest hardens-chronological-timeline-claims
  (let [entry-options {:event-name "pageview"
                       :page-url "https://example.test/"
                       :history-path "event.history"}
        world (-> {}
                  (timeline/record-observed-entry
                   (assoc entry-options :event-name "account-created"))
                  (timeline/record-observed-entry entry-options))
        example {"event_name" "pageview"
                 "page_url" "https://example.test/"
                 "history_path" "event.history"}]
    (is (map?
         (support/dispatch timeline/handlers world example
                           "the side panel shows them in capture order")))
    (is (map?
         (support/dispatch timeline/handlers world example
                           "each timeline entry shows event name <event_name>")))
    (is (map?
         (support/dispatch timeline/handlers world example
                           "each timeline entry shows page URL <page_url>")))
    (is (map?
         (support/dispatch timeline/handlers world example
                           "each timeline entry shows observer path <history_path>")))
    (is (map?
         (support/dispatch timeline/handlers {} example
                           "timeline entry <event_name> is visible")))))
