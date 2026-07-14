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
    (assert-example! (= (str (:pushReturn repeat)) (example-value example "push_return")) "push_return" example observation)))

(defn- validate-stale-generation! [example observation]
  (let [{:keys [stale]} observation]
    (doseq [[key actual] [["stale_generation" (:staleGenerationId stale)]
                          ["current_generation" (:currentGenerationId stale)]
                          ["stale_page" (:stalePageUrl stale)]
                          ["current_page" (:currentPageUrl stale)]]]
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
   [existing-history-example? validate-existing-history!]
   [#(= "load-3" (example-value % "page_load")) validate-delayed-history!]
   [#(example-value % "first_page_event") validate-navigation!]
   [#(example-value % "repeated_events") validate-reload!]
   [#(example-value % "repeat_action") validate-repeat-activation!]
   [#(example-value % "stale_generation") validate-stale-generation!]])

(defn- validate-scenario-example! [example observation]
  (when-let [[_ validator] (some (fn [[matches? _ :as rule]]
                                  (when (matches? example) rule))
                                example-validators)]
    (validator example observation)))

(defn validate-example! [example observation]
  (when-let [history-path (example-value example "history_path")]
    (assert-example! (= history-path "queue.history") "history_path" example observation))
  (validate-scenario-example! example observation)
  observation)

(defn- transition [world example _captures _spec]
  (let [observation (browser-observation!)]
    (validate-example! example observation)
    (assoc world :lossless-observation observation)))

(def handlers
  (support/semantic-handlers
   (support/feature-step-specs [feature-file] excluded-steps)
   transition))
