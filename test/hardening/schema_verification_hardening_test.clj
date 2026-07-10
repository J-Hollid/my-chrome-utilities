(ns hardening.schema-verification-hardening-test
  (:require [acceptance.steps.all :as steps]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(deftest hardens-schema-verification-state-transitions
  (is (= [:passed]
         (support/run-features
          ["build/acceptance/ir/data-layer-schema-verification.json"]
          steps/handlers))))
