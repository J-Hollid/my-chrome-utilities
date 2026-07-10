(ns hardening.operator-interface-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(def operator-ir-paths
  ["build/acceptance/ir/data-layer-library-operator-layout.json"
   "build/acceptance/ir/data-layer-live-operator-layout.json"
   "build/acceptance/ir/data-layer-schemas-operator-layout.json"
   "build/acceptance/ir/data-layer-sessions-operator-layout.json"
   "build/acceptance/ir/side-panel-hotkey-operator-layout.json"
   "build/acceptance/ir/side-panel-inclusive-interaction.json"
   "build/acceptance/ir/side-panel-responsive-navigation-shell.json"
   "build/acceptance/ir/side-panel-visual-regression-coverage.json"
   "build/acceptance/ir/side-panel-visual-system.json"])

(deftest hardens-operator-interface-state-transitions
  (is (= (vec (repeat (count operator-ir-paths) :passed))
         (support/run-features operator-ir-paths steps/handlers))))
