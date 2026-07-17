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

(deftest target-picker-owns-search-and-clear
  (let [example {"page_titles" "Home, Checkout, and Purchase confirmation"
                 "query" "purchase"}
        run-step (fn [world keyword text]
                   (runtime/execute-step! world example {:keyword keyword :text text}
                                          targets/handlers))
        searched (-> {:observation-target-contract true}
                     (run-step "Given" "target candidates include pages <page_titles>")
                     (run-step "When" "the user searches for <query>")
                     (run-step "Then" "only candidates matching <query> by title, hostname, URL, or window context are shown")
                     (run-step "And" "the picker reports the matching target count"))
        cleared (run-step searched "When" "the search is cleared")]
    (is (= ["Purchase confirmation"] (:visible-observation-targets searched)))
    (is (= 1 (:observation-target-match-count searched)))
    (is (= ["Home" "Checkout" "Purchase confirmation"]
           (:visible-observation-targets cleared)))))

(deftest target-attachment-and-run-actions-cover-owned-branches
  (let [selected (runtime/execute-step!
                  {:observation-target-contract true}
                  {"page_title" "Checkout" "tab_id" "42"
                   "page_url" "https://shop.example.test/checkout"}
                  {:keyword "Given" :text "selected target <page_title> has tab id <tab_id> and page URL <page_url>"}
                  targets/handlers)
        attached (#'targets/attach-target selected {"page_title" "Checkout" "tab_id" "42"})
        run-step (#'targets/choose-handler
                  {:sequence {:steps [:first :second]}}
                  {"run_action" "Run step"}
                  ["run_action"])
        run-all (#'targets/choose-handler
                 {:sequence {:steps [:first :second]}}
                 {"run_action" "Run all"}
                 ["run_action"])]
    (is (= "Attached" (:target-state attached)))
    (is (= [:first] (:executed run-step)))
    (is (= [:first :second] (:executed run-all)))))
