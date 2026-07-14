(ns acceptance.steps.lossless-observation-activation
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-file "features/data-layer-lossless-observation-activation-runtime.feature")
(def excluded-steps #{"history array path <history_path> is configured"})
(defonce browser-observation (atom nil))

(defn- require-observation! [condition message observation]
  (support/assert! condition message {:observation observation}))

(defn validate-browser-observation! [observation]
  (let [{:keys [first second delayed navigation reload repeat stale]} observation]
    (require-observation! (= ["event-1" "event-2" "event-3" "event-4" "event-5" "event-6"] (:feed first))
                          "Snapshot-to-hook handoff lost or duplicated events." observation)
    (require-observation! (= (:feed first) (:array first) (:registryArray first))
                          "The production registry did not retain the page-owned history array." observation)
    (require-observation! (= [101 102 103 104 105 106] (:pushReturns first))
                          "The production wrapper changed page-defined push return values." observation)
    (require-observation! (and (:originalReceivers first)
                               (= 6 (:originalCallCount first))
                               (= 1 (:activeChannels first)))
                          "The production wrapper changed receivers, call counts, or channel cardinality." observation)
    (require-observation! (= ["event-1" "event-2" "event-3" "event-4" "event-5"] (:feed second))
                          "Existing, handoff, and live events were not captured once in order." observation)
    (require-observation! (= ["event-1" "event-2" "event-3" "event-4" "event-5" "event-6"] (:feed delayed))
                          "Delayed-path retry did not recover the complete event history." observation)
    (require-observation! (= [["home-view" "load-4" "https://example.test/home"]
                              ["event-1" "load-5" "https://example.test/checkout"]
                              ["event-2" "load-5" "https://example.test/checkout"]
                              ["event-3" "load-5" "https://example.test/checkout"]
                              ["event-4" "load-5" "https://example.test/checkout"]
                              ["event-5" "load-5" "https://example.test/checkout"]
                              ["event-6" "load-5" "https://example.test/checkout"]]
                             (mapv (juxt :name :pageLoadId :pageUrl) navigation))
                          "Navigation capture crossed page-load associations." observation)
    (require-observation! (= ["pageview" "purchase" "pageview" "purchase"] (:feed reload))
                          "Same-URL reload events were merged or omitted." observation)
    (require-observation! (and (= ["load-6" "load-6" "load-7" "load-7"] (:pageLoadIds reload))
                               (= 4 (count (set (:identities reload)))))
                          "Reloaded events did not retain distinct page-load identities." observation)
    (require-observation! (= {:feed ["event-1" "event-2" "event-3"]
                              :channels 1 :originalCalls 1 :pushReturn 3}
                             (select-keys repeat [:feed :channels :originalCalls :pushReturn]))
                          "Repeated activation duplicated capture or wrapped push more than once." observation)
    (require-observation! (= {:feed ["current-view" "purchase"]
                              :pageLoadIds ["generation-2" "generation-2"]
                              :channels 1 :currentGeneration true :staleGeneration false}
                             (select-keys stale [:feed :pageLoadIds :channels :currentGeneration :staleGeneration]))
                          "A stale generation affected the current hook, subscription, or feed." observation)
    observation))

(defn- run-browser-observation! []
  (let [result (process/shell support/build-shell-options
                              "node" "acceptance/runtime/lossless-observation-activation.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        observation (when line (json/parse-string line true))]
    (support/assert! (zero? (:exit result))
                     (str "Lossless observation browser runtime failed. " (:err result))
                     {:out (:out result) :err (:err result)})
    (support/assert! observation "Lossless observation browser evidence is missing." {:out (:out result)})
    (validate-browser-observation! observation)))

(defn browser-observation! []
  (or @browser-observation
      (let [observation (run-browser-observation!)]
        (reset! browser-observation observation)
        observation)))

(defn- csv [value]
  (support/split-list value #","))

(defn- example-value [example key]
  (support/example-value example key))

(defn- assert-example! [condition key example observation]
  (support/assert! condition
                   (str "Lossless observation runtime did not match example " key ".")
                   {:key key :example example :observation observation}))

(defn- validate-first-activation! [example observation]
  (let [{:keys [first]} observation]
    (assert-example! (= (concat (csv (example-value example "handoff_events"))
                                (csv (example-value example "live_events")))
                        (:feed first)) "handoff_events/live_events" example observation)
    (assert-example! (= (csv (example-value example "push_returns"))
                        (mapv str (:pushReturns first))) "push_returns" example observation)
    (assert-example! (= (repeat (count (:feed first)) (example-value example "page_load"))
                        (:pageLoadIds first)) "page_load" example observation)
    (assert-example! (= (example-value example "page_url") (:pageUrl first)) "page_url" example observation)))

(defn- validate-history-sequence! [example observation observation-key label]
  (let [result (observation-key observation)]
    (assert-example! (= (concat (csv (example-value example "initial_events"))
                                (csv (example-value example "handoff_events"))
                                (csv (example-value example "live_events")))
                        (:feed result)) label example observation)
    (assert-example! (= (repeat (count (:feed result))
                                (example-value example "page_load"))
                        (:pageLoadIds result)) "page_load" example observation)
    (assert-example! (= (example-value example "page_url") (:pageUrl result)) "page_url" example observation)))

(defn- validate-existing-history! [example observation]
  (validate-history-sequence! example observation :second "initial/handoff/live events"))

(defn- validate-delayed-history! [example observation]
  (validate-history-sequence! example observation :delayed "delayed events"))

(defn- validate-navigation! [example observation]
  (let [navigation (:navigation observation)
        expected (concat [(example-value example "first_page_event")]
                         (csv (example-value example "handoff_events"))
                         (csv (example-value example "live_events")))]
    (assert-example! (= expected (map :name navigation)) "navigation events" example observation)
    (assert-example! (= [(example-value example "first_page_load")
                         (example-value example "current_page_load")]
                        [(:pageLoadId (first navigation))
                         (:pageLoadId (second navigation))])
                     "navigation page loads" example observation)
    (assert-example! (= (example-value example "first_page") (:pageUrl (first navigation))) "first_page" example observation)
    (assert-example! (= (example-value example "current_page") (:pageUrl (second navigation))) "current_page" example observation)))

(defn- validate-reload! [example observation]
  (let [{:keys [reload]} observation
        repeated (csv (example-value example "repeated_events"))]
    (assert-example! (= (concat repeated repeated) (:feed reload)) "repeated_events" example observation)
    (assert-example! (= (concat (repeat (count repeated) (example-value example "first_page_load"))
                                (repeat (count repeated) (example-value example "current_page_load")))
                        (:pageLoadIds reload)) "reload page loads" example observation)
    (assert-example! (= (example-value example "current_page") (:pageUrl reload)) "current_page" example observation)))

(defn- validate-repeat-activation! [example observation]
  (let [{:keys [repeat]} observation]
    (assert-example! (contains? #{"a readiness retry" "a capture restart"}
                                (example-value example "repeat_action")) "repeat_action" example observation)
    (assert-example! (= (concat (csv (example-value example "initial_events"))
                                [(example-value example "live_event")])
                        (:feed repeat)) "repeat events" example observation)
    (assert-example! (= (example-value example "page_load")
                        (:pageLoadId repeat)) "page_load" example observation)
    (assert-example! (= (example-value example "page_url")
                        (:pageUrl repeat)) "page_url" example observation)
    (assert-example! (= (str (:pushReturn repeat)) (example-value example "push_return")) "push_return" example observation)))

(defn- validate-stale-generation! [example observation]
  (let [{:keys [stale]} observation]
    (doseq [[key actual] [["stale_generation" (:staleGenerationId stale)]
                          ["current_generation" (:currentGenerationId stale)]
                          ["stale_page" (:stalePageUrl stale)]
                          ["current_page" (:currentPageUrl stale)]
                          ["stale_event" (:staleEvent stale)]]]
      (assert-example! (= (example-value example key) actual) key example observation))
    (assert-example! (= [(example-value example "current_existing_event")
                         (example-value example "current_live_event")]
                        (:feed stale)) "current generation events" example observation)
    (assert-example! (not (some #{(example-value example "stale_event")} (:feed stale))) "stale_event" example observation)))

(defn- existing-history-example? [example]
  (and (example-value example "initial_events")
       (= "load-2" (example-value example "page_load"))))

(def example-validators
  [[#(example-value % "push_returns") validate-first-activation!]
   [#(example-value % "first_page_event") validate-navigation!]
   [#(example-value % "repeated_events") validate-reload!]
   [#(example-value % "repeat_action") validate-repeat-activation!]
   [#(example-value % "stale_generation") validate-stale-generation!]])

(defn- validate-scenario-example! [example observation step-text]
  (cond
    (str/includes? (or step-text "") "has existing events <initial_events>")
    (validate-existing-history! example observation)

    (str/includes? (or step-text "") "does not yet contain <history_path>")
    (validate-delayed-history! example observation)

    (and (nil? step-text) (existing-history-example? example))
    (validate-existing-history! example observation)

    :else
    (when-let [[_ validator] (some (fn [[matches? _ :as rule]]
                                    (when (matches? example) rule))
                                  example-validators)]
      (validator example observation))))

(defn validate-example!
  ([example observation]
   (validate-example! example observation nil))
  ([example observation step-text]
   (when-let [history-path (example-value example "history_path")]
     (assert-example! (= history-path "queue.history") "history_path" example observation))
   (validate-scenario-example! example observation step-text)
   observation))

(defn- transition [world example _captures {:keys [text]}]
  (let [observation (browser-observation!)]
    (validate-example! example observation text)
    (assoc world :lossless-observation observation)))

(def handlers
  (support/semantic-handlers
   (support/feature-step-specs [feature-file] excluded-steps)
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T13:00:18.530069793+02:00", :module-hash "859931423", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "418365012"} {:id "def/feature-file", :kind "def", :line 7, :end-line 7, :hash "-28745996"} {:id "def/excluded-steps", :kind "def", :line 8, :end-line 8, :hash "-67788409"} {:id "form/3/defonce", :kind "defonce", :line 9, :end-line 9, :hash "-1618529344"} {:id "defn-/require-observation!", :kind "defn-", :line 11, :end-line 12, :hash "-619313877"} {:id "defn/validate-browser-observation!", :kind "defn", :line 14, :end-line 53, :hash "643264908"} {:id "defn-/run-browser-observation!", :kind "defn-", :line 55, :end-line 64, :hash "-1938007675"} {:id "defn/browser-observation!", :kind "defn", :line 66, :end-line 70, :hash "971087409"} {:id "defn-/csv", :kind "defn-", :line 72, :end-line 73, :hash "-1411805099"} {:id "defn-/example-value", :kind "defn-", :line 75, :end-line 76, :hash "369719940"} {:id "defn-/assert-example!", :kind "defn-", :line 78, :end-line 81, :hash "-1547213020"} {:id "defn-/validate-first-activation!", :kind "defn-", :line 83, :end-line 92, :hash "1418677042"} {:id "defn-/validate-history-sequence!", :kind "defn-", :line 94, :end-line 103, :hash "977627113"} {:id "defn-/validate-existing-history!", :kind "defn-", :line 105, :end-line 106, :hash "1747278759"} {:id "defn-/validate-delayed-history!", :kind "defn-", :line 108, :end-line 109, :hash "-1165140777"} {:id "defn-/validate-navigation!", :kind "defn-", :line 111, :end-line 123, :hash "265575035"} {:id "defn-/validate-reload!", :kind "defn-", :line 125, :end-line 132, :hash "-1623379780"} {:id "defn-/validate-repeat-activation!", :kind "defn-", :line 134, :end-line 145, :hash "2001447715"} {:id "defn-/validate-stale-generation!", :kind "defn-", :line 147, :end-line 158, :hash "-1617219340"} {:id "defn-/existing-history-example?", :kind "defn-", :line 160, :end-line 162, :hash "-1449354511"} {:id "def/example-validators", :kind "def", :line 164, :end-line 169, :hash "1297861296"} {:id "defn-/validate-scenario-example!", :kind "defn-", :line 171, :end-line 186, :hash "567636053"} {:id "defn/validate-example!", :kind "defn", :line 188, :end-line 195, :hash "-2051937962"} {:id "defn-/transition", :kind "defn-", :line 197, :end-line 200, :hash "295949080"} {:id "def/handlers", :kind "def", :line 202, :end-line 205, :hash "-1117826406"}]}
;; clj-mutate-manifest-end
