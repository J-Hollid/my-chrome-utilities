(ns acceptance.observation-targets-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.observation-targets :as targets]
            [clojure.test :refer [deftest is]]))

(deftest explicit-target-start-needs-a-selection
  (let [world (-> {:observation-target-contract true}
                  (runtime/execute-step! {} {:keyword "Given" :text "no observation target is selected"} targets/handlers)
                  (runtime/execute-step! {} {:keyword "Then" :text "Start testing identifies that a target page must be selected"} targets/handlers))]
    (is (= "Selection required" (:target-state world)))))

(deftest target-handler-captures-template-values
  (let [world (runtime/execute-step!
               {:observation-target-contract true}
               {"page_title" "Checkout" "tab_id" "42" "page_url" "https://shop.example.test/checkout"}
               {:keyword "Given" :text "selected target <page_title> has tab id <tab_id> and page URL <page_url>"}
               targets/handlers)]
    (is (= "Checkout" (get-in world [:selected-target :title])))
    (is (= "42" (get-in world [:observation-target-values "tab_id"])))))
