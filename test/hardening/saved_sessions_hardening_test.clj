(ns hardening.saved-sessions-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(deftest hardens-saved-session-state-transitions
  (is (= [:passed]
         (support/run-features
          ["build/acceptance/ir/data-layer-saved-session-library.json"]
          steps/handlers))))
