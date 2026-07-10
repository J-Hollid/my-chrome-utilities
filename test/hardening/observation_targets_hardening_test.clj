(ns hardening.observation-targets-hardening-test
  (:require [acceptance.steps.all :as steps]
            [acceptance.steps.observation-targets :as targets]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(def target-ir-paths
  ["build/acceptance/ir/data-layer-observation-target-selection.json"
   "build/acceptance/ir/data-layer-observation-target-access.json"
   "build/acceptance/ir/data-layer-observation-target-lifecycle.json"
   "build/acceptance/ir/data-layer-observation-target-commands.json"
   "build/acceptance/ir/data-layer-active-page-read-result.json"
   "build/acceptance/ir/data-layer-active-tab-page-context.json"
   "build/acceptance/ir/data-layer-history-array-observer.json"
   "build/acceptance/ir/data-layer-live-history-push-capture.json"
   "build/acceptance/ir/data-layer-live-operator-layout.json"
   "build/acceptance/ir/data-layer-multiple-observation-sources.json"
   "build/acceptance/ir/data-layer-observation-subscription-lifecycle.json"
   "build/acceptance/ir/data-layer-observer-workspace.json"
   "build/acceptance/ir/data-layer-page-window-observation.json"
   "build/acceptance/ir/data-layer-pageload-observation-refresh.json"
   "build/acceptance/ir/data-layer-session-recovery.json"
   "build/acceptance/ir/data-layer-testing-session.json"])

(deftest hardens-explicit-observation-target-transitions
  (is (= (vec (repeat (count target-ir-paths) :passed))
         (support/run-features target-ir-paths steps/handlers))))

(deftest hardens-target-contract-routing
  (let [target-handlers (vec (concat targets/priority-handlers targets/handlers))
        contract (support/dispatch
                  target-handlers
                  {}
                  {:project_name "my-chrome-utilities"
                   :history_path "event.history"
                   :target_state "Detached"
                   :selection_action "Choose target"}
                  "the Data Layer Live view is displayed")
        action (support/dispatch
                target-handlers
                contract
                {"command_id" "data-layer.choose-observation-target"}
                "command <command_id> runs")]
    (is (:observation-target-contract contract))
    (is (= "command <command_id> runs"
           (get-in action [:observation-target-action :text])))))

(deftest hardens-target-lifecycle-state
  (let [world {:observation-target-contract true
               :selected-target {:title "Checkout" :tab-id "42"}}
        attached (support/dispatch targets/handlers world
                                   "data layer testing starts")
        ended (support/dispatch
               targets/handlers attached
               {"session_action" "End testing"}
               "session action <session_action> intentionally ends the session")]
    (is (= "Attached" (:target-state attached)))
    (is (= "ended" (get-in ended [:session :status])))
    (is (= (:selected-target attached) (:recent-target ended)))
    (is (nil? (:attached-target ended)))))

(deftest hardens-explicit-target-session-start
  (let [contract {:observation-target-contract true}
        detached (support/dispatch targets/handlers contract
                                   "no observation target is selected")
        refused (support/dispatch targets/handlers detached
                                  "data layer testing starts")
        selected (support/dispatch
                  targets/handlers
                  contract
                  {"page_title" "Checkout"
                   "tab_id" "42"
                   "page_url" "https://shop.example.test/checkout"}
                  "selected target <page_title> has tab id <tab_id> and page URL <page_url>")
        attached (support/dispatch targets/handlers selected
                                   "data layer testing starts")]
    (is (nil? (:selected-target detached)))
    (is (= "Selection required" (:target-state refused)))
    (is (= "Attached" (:target-state attached)))
    (is (= "42" (get-in attached [:session :target :tab-id])))))
