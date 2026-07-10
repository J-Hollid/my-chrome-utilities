(ns hardening.live-observer-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(def live-observer-ir-paths
  ["build/acceptance/ir/data-layer-observer-workspace.json"
   "build/acceptance/ir/data-layer-event-timeline.json"])

(deftest hardens-live-observer-state-transitions
  (is (= [:passed :passed]
         (support/run-features live-observer-ir-paths steps/handlers))))
