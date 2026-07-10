(ns acceptance.live-event-presentation-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.live-event-presentation :as presentation]
            [clojure.test :refer [deftest is]]))

(deftest presentation-pipeline-transitions-through-an-action
  (let [world (-> {}
                  (runtime/execute-step!
                   {"event_name" "purchase"
                    "input_shape" "object"
                    "payload_label" "purchase-values"
                    "capture_phase" "live push"}
                   {:keyword "Given"
                    :text "<capture_phase> history input has shape <input_shape>, event name <event_name>, and payload <payload_label>"}
                   presentation/handlers)
                  (runtime/execute-step!
                   {}
                   {:keyword "When" :text "the input is captured"}
                   presentation/handlers)
                  (runtime/execute-step!
                   {"event_name" "purchase"
                    "payload_label" "purchase-values"}
                   {:keyword "Then"
                    :text "one canonical source event is created with <event_name>, <payload_label>, and the complete raw input"}
                   presentation/handlers))]
    (is (= "the input is captured" (get-in world [:presentation-action :text])))
    (is (= 1 (count (:presentation-observations world))))))
