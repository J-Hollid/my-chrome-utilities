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
