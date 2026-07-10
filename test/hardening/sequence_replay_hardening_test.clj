(ns hardening.sequence-replay-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(deftest hardens-sequence-replay-state-transitions
  (is (= [:passed]
         (support/run-features
          ["build/acceptance/ir/data-layer-test-sequence-replay.json"]
          steps/handlers))))
