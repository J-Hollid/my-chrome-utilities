(ns hardening.live-event-presentation-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(def presentation-ir-paths
  ["build/acceptance/ir/data-layer-captured-event-presentation-pipeline.json"
   "build/acceptance/ir/data-layer-observation-subscription-lifecycle.json"])

(deftest hardens-live-event-presentation-transitions
  (is (= [:passed :passed]
         (support/run-features presentation-ir-paths steps/handlers))))
