(ns hardening.observability-source-foundation-hardening-test
  (:require [acceptance.steps.all :as steps]
            [acceptance.steps.observability-library :as observability]
            [clojure.test :refer [deftest is testing]]
            [hardening.support :as support]))

(def source-foundation-ir-paths
  ["build/acceptance/ir/data-layer-source-aware-event-model.json"
   "build/acceptance/ir/data-layer-multiple-observation-sources.json"])

(def dispatch (partial support/dispatch observability/handlers))

(deftest hardens-source-foundation-state-transitions
  (is (= [:passed :passed]
         (support/run-features source-foundation-ir-paths steps/handlers))))

(deftest hardens-source-identity-and-capture-sequencing
  (testing "the first captured source event has a stable sequence"
    (let [world (dispatch {:root "."}
                          {"event_name" "pageview"
                           "source_id" "event-history-primary"
                           "source_kind" "data-layer"}
                          "source event <event_name> is captured from <source_id>")]
      (is (= "event-1" (get-in world [:captured-event :id])))))

  (testing "continued captures advance both identity and capture time"
    (let [world {:sources [{:id "adobe-beacons"
                            :name "Adobe beacons"
                            :kind "Adobe"
                            :enabled true
                            :status "Connected"}]
                 :events [{:id "event-1"}]}
          continued (dispatch world "observation continues")]
      (is (= "event-2" (get-in continued [:events 1 :id])))
      (is (= "2026-07-10T10:48:02.100Z"
             (get-in continued [:events 1 :capture-time])))))

  (testing "Adobe source defaults exclude unsupported push capability"
    (let [world (dispatch {:root "."}
                          {"connected_source" "Adobe beacons"
                           "connected_status" "Connected"}
                          "connected source <connected_source> has status <connected_status>")]
      (is (= ["inspect" "save" "validate"]
             (get-in world [:sources 0 :capabilities])))))

  (testing "capability checks apply to the requested source, not a decoy"
    (is (thrown? clojure.lang.ExceptionInfo
                 (dispatch {:sources [{:name "Target" :capabilities []}
                                      {:name "Decoy"
                                       :capabilities ["inspect" "save" "validate"]}]}
                           {"source_name" "Target"}
                           "source <source_name> is available to observe, filter, validate, and configure according to adapter capabilities")))))
