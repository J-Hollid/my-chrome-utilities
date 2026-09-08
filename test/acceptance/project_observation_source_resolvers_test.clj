(ns acceptance.project-observation-source-resolvers-test
  (:require [clojure.test :refer [deftest is]]
            [acceptance.steps.project-observation-sources.product :as p]
            [acceptance.steps.project-observation-sources.runtime :as r]))

(deftest scenario-resolvers-select-only-matching-evidence
(let [keyboard {:name "Marketing" :path "dataLayer" :width 480}
      invalid {:name "Bad" :path "bad path" :error "Invalid path"}
      required {:name "" :path "" :error "Required"}
      disabled {:input {:first "M1" :later "M2, M3" :action "disable"}}
      changed {:input {:first "M1" :name "New name" :path "analyticsQueue" :action "change path"}}
      activation {:input {:marketing_before "M0" :application_before "A0" :handoff "M1" :live "A1"}}
      filter-row {:input {:receipt_order "M1, A1" :selected_source "Marketing" :count 1}}
      unavailable {:value "absent" :inputValue "missing" :event "A1" :status "Waiting for path"}
      evidence {:payload {:event "E1" :value 7} :source "Marketing"}
      portability {:path "dataLayer" :pushPath "commandQueue"}
      push {:source "Marketing"}
      transition {:transition "path appears"}
      alias {:relation "same array"}
      disposal {:action "stop"}
      settings {:empty [] :invalid [invalid required]}
      projects {:closed {:sources 0}}
      observed {:keyboard [keyboard] :settings settings :projects projects
                :edits [disabled changed] :activation [activation] :filter [filter-row]
                :unavailable [unavailable] :evidence [evidence] :portability [portability]
                :push [push] :transitions [transition] :aliases [alias] :disposal [disposal]}
      product-cases [[1 {"name" "Marketing" "path" "dataLayer"} keyboard]
        [2 {"name" "Bad" "path" "bad path" "error" "Invalid path"} invalid]
        [3 {"receipt_order" "M1, A1" "selected_source" "Marketing" "count" "1"} filter-row]
        [4 {"value" "missing" "event" "A1" "status" "Waiting for path"} unavailable]
        [5 {"payload" "{\"value\":7}" "event_name" "E1"} evidence]
        [6 {"first" "M1" "later" "M2, M3"} disabled]
        [7 {"first" "M1" "name" "New name" "path" "analyticsQueue"} changed]
        [8 {"route" "project switching"} projects]
        [9 {"path" "dataLayer" "push_path" "commandQueue"} portability]
        [10 {"source" "Marketing"} push] [11 {} settings] [12 {} settings]
        [13 {"field" "Name" "error" "Required"} required]]
      runtime-cases [[1 {"name" "Marketing" "path" "dataLayer" "width" "480"} keyboard]
        [2 {"marketing_before" "M0" "application_before" "A0" "handoff" "M1" "live" "A1"} activation]
        [3 {"unavailable" "absent" "status" "Waiting for path"} unavailable]
        [4 {"payload" "{\"event\":\"E1\",\"value\":7}" "source" "Marketing"} evidence]
        [5 {"action" "change path to analyticsQueue"} changed]
        [6 {"transition" "path appears"} transition]
        [7 {"array_relation" "same array"} alias] [8 {"source" "Marketing"} push]
        [9 {"action" "stop"} disposal]
        [10 {"path" "dataLayer" "push_path" "commandQueue"} portability]
        [11 {} disabled] [12 {} settings]]]
  (doseq [[resolve cases] [[p/observed-row product-cases] [r/observed-row runtime-cases]]]
    (doseq [[number example expected] cases]
      (is (= expected (resolve number example observed)) (str "scenario " number)))
    (is (nil? (resolve 99 {} observed))))
  (is (nil? (p/observed-row 8 {"route" "unrelated"} observed)))
  (is (nil? (r/observed-row 1 {"name" "Marketing" "path" "dataLayer" "width" "900"} observed)))
  (is (nil? (p/observed-row 3 {"receipt_order" "A1, M1" "selected_source" "Marketing" "count" "1"} observed)))
  (is (= projects (r/observed-row 9 {"action" "switch to another project"} observed)))
  (is (nil? (p/observed-row 11 {} (assoc-in observed [:projects :closed :sources] 1))))
  (is (nil? (r/observed-row 11 {} (assoc-in observed [:settings :empty] ["source"])))))
)

(deftest unavailable-source-matches-the-observed-input
  (let [row {:value "a scalar" :inputValue "17" :event "consent_updated" :status "Not an array"}
        observed {:unavailable [row]}
        example {"value" "17" "event" "consent_updated" "status" "Not an array"}]
    (is (= row (p/observed-row 4 example observed)))
    (is (nil? (p/observed-row 4 (assoc example "value" "18") observed)))
    (is (nil? (p/observed-row 4 (assoc example "value" "missing") observed)))))
