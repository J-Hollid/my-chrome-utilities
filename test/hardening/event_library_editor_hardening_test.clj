(ns hardening.event-library-editor-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(deftest hardens-event-library-editor-state-transitions
  (is (= [:passed :passed]
         (support/run-features
          ["build/acceptance/ir/data-layer-event-template-library.json"
           "build/acceptance/ir/data-layer-event-property-editor.json"]
          steps/handlers))))
