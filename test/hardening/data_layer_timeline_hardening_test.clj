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
