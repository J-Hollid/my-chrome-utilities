(ns hardening.data-layer-timeline-hardening-test
  (:require [acceptance.steps.data-layer-timeline :as timeline]
            [clojure.test :refer [deftest is]]))

(deftest hardens-canonical-payload-property-comparison
  (let [state (timeline/record-observed-event-with-payload
               {}
               {:event-name "scroll"
                :payload-properties "scroll_percentage: \"75\""})]
    (is (timeline/canonical-payload-properties-match? state "scroll"))))
