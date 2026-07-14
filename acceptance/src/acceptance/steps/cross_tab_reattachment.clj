(ns acceptance.steps.cross-tab-reattachment
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-file "features/data-layer-cross-tab-reattachment-runtime.feature")
(defonce runtime-observation (atom nil))

(defn- require-observation! [condition message observation]
  (support/assert! condition message {:observation observation}))

(defn validate-runtime-observation! [observation]
  (let [cases (:cases observation)]
    (require-observation! (= 6 (count cases))
                          "Cross-tab runtime did not exercise all six reattachment orders."
                          observation)
    (doseq [case cases]
      (require-observation!
       (and (= [(:oldTargetId case)] (:releasedTargetIds case))
            (= "Attached" (:attachmentResult case))
            (:sessionStarted case)
            (= (:newTargetId case) (:selectedTargetId case) (:attachedTargetId case))
            (= (:newTabId case) (:sessionTabId case) (:observerTabId case))
            (= (:newTarget case) (:sessionTargetTitle case))
            (false? (:staleRecoveryApplied case))
            (= 1 (:observerCount case) (:pageHookCount case) (:runtimeListenerCount case))
            (= [(:newTabId case)] (:pageHookTabIds case))
            (= ["new-view"] (:feed case))
            (= [(:newTabId case)] (:eventTargetTabIds case))
            (= 1 (:newEventCount case))
            (zero? (:oldEventCount case)))
       "A released or stale target affected the new target's session or capture boundary."
       case))
    observation))

(defn- run-runtime-observation! []
  (let [result (process/shell support/build-shell-options
                              "node" "acceptance/runtime/cross-tab-reattachment.mjs")
        line (last (filter #(str/starts-with? % "{")
                           (str/split-lines (:out result))))
        observation (when line (json/parse-string line true))]
    (support/assert! (zero? (:exit result))
                     (str "Cross-tab reattachment runtime failed. " (:err result))
                     {:out (:out result) :err (:err result)})
    (support/assert! observation
                     "Cross-tab reattachment runtime evidence is missing."
                     {:out (:out result)})
    (validate-runtime-observation! observation)))

(defn runtime-observation! []
  (or @runtime-observation
      (let [observation (run-runtime-observation!)]
        (reset! runtime-observation observation)
        observation)))

(defn- example-value [example key]
  (support/example-value example key))

(defn- matching-case [example observation]
  (let [release-action (example-value example "release_action")
        completion-order (or (example-value example "completion_order")
                             "immediate Start testing")]
    (some #(when (and (= release-action (:releaseAction %))
                      (= completion-order (:completionOrder %)))
             %)
          (:cases observation))))

(defn- assert-example! [condition key example case]
  (support/assert! condition
                   (str "Cross-tab runtime did not bind example " key ".")
                   {:key key :example example :case case}))

(defn validate-example! [example observation]
  (let [case (matching-case example observation)]
    (assert-example! case "release_action/completion_order" example case)
    (doseq [[key actual] [["old_target" (:oldTarget case)]
                          ["old_tab_id" (str (:oldTabId case))]
                          ["new_target" (:newTarget case)]
                          ["new_tab_id" (str (:newTabId case))]
                          ["history_path" (:historyPath case)]
                          ["release_action" (:releaseAction case)]
                          ["old_event" (:pushedOldEvent case)]
                          ["new_event" (:pushedNewEvent case)]]]
      (assert-example! (= (example-value example key) actual) key example case))
    (when-let [completion-order (example-value example "completion_order")]
      (assert-example! (= completion-order (:completionOrder case))
                       "completion_order" example case))
    observation))

(defn- transition [world example _captures _spec]
  (let [observation (runtime-observation!)]
    (validate-example! example observation)
    (assoc world :cross-tab-reattachment observation)))

(def handlers
  (support/semantic-handlers
   (support/feature-step-specs [feature-file] #{})
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T13:57:15.503048731+02:00", :module-hash "2144237799", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "180047937"} {:id "def/feature-file", :kind "def", :line 7, :end-line 7, :hash "2023395075"} {:id "form/2/defonce", :kind "defonce", :line 8, :end-line 8, :hash "140063040"} {:id "defn-/require-observation!", :kind "defn-", :line 10, :end-line 11, :hash "-619313877"} {:id "defn/validate-runtime-observation!", :kind "defn", :line 13, :end-line 35, :hash "1199261827"} {:id "defn-/run-runtime-observation!", :kind "defn-", :line 37, :end-line 49, :hash "-782958495"} {:id "defn/runtime-observation!", :kind "defn", :line 51, :end-line 55, :hash "-1871172751"} {:id "defn-/example-value", :kind "defn-", :line 57, :end-line 58, :hash "369719940"} {:id "defn-/matching-case", :kind "defn-", :line 60, :end-line 67, :hash "1522448729"} {:id "defn-/assert-example!", :kind "defn-", :line 69, :end-line 72, :hash "1138006849"} {:id "defn/validate-example!", :kind "defn", :line 74, :end-line 89, :hash "1037170978"} {:id "defn-/transition", :kind "defn-", :line 91, :end-line 94, :hash "-839577765"} {:id "def/handlers", :kind "def", :line 96, :end-line 99, :hash "1551695576"}]}
;; clj-mutate-manifest-end
