(ns hardening.session-boundaries-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(deftest hardens-session-capability-boundaries
  (is (= [:passed]
         (support/run-features
          ["build/acceptance/ir/data-layer-testing-session.json"]
          steps/handlers))))
