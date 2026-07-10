(ns acceptance.steps.session-boundaries
  (:require [acceptance.steps.support :as support]))

(def capability-ownership
  {:active-session-recovery :active-session
   :saved-session-execution :test-sequences
   :ordered-execution :test-sequences})

(defn- assert-owner! [world capability owner message]
  (support/assert! (= owner (get-in world [:capability-ownership capability]))
                   message
                   {:capability capability
                    :expected owner
                    :actual (get-in world [:capability-ownership capability])}))

(defn- transition [step world example]
  (case step
    "active session recovery is separate from the saved session library"
    (let [history-path (support/require-example example "history_path")
          next-world (assoc world :capability-ownership capability-ownership)]
      (support/assert! (= "queue.history" history-path)
                       "Session boundary history path fixture is not canonical."
                       {:expected "queue.history" :actual history-path})
      (assert-owner! next-world :active-session-recovery :active-session
                     "Active recovery does not belong to the active session lifecycle.")
      next-world)

    "saved sessions are not executed directly"
    (do (assert-owner! world :saved-session-execution :test-sequences
                       "Saved session archives became directly executable.")
        (assoc world :saved-session-role :immutable-archive))

    "ordered execution is provided through test sequences"
    (do (assert-owner! world :ordered-execution :test-sequences
                       "Ordered execution does not belong to test sequences.")
        (support/assert! (= :immutable-archive (:saved-session-role world))
                         "Saved session role changed while assigning execution ownership."
                         {})
        world)))

(def steps
  ["active session recovery is separate from the saved session library"
   "saved sessions are not executed directly"
   "ordered execution is provided through test sequences"])

(def handlers
  (mapv (fn [step]
          {:pattern (support/template-pattern step)
           :handler (fn [world example _captures]
                      (transition step world example))})
        steps))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:34:57.140901803+02:00", :module-hash "-372385722", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-459144729"} {:id "def/capability-ownership", :kind "def", :line 4, :end-line nil, :hash "250919240"} {:id "defn-/assert-owner!", :kind "defn-", :line 9, :end-line nil, :hash "-2105160806"} {:id "defn-/transition", :kind "defn-", :line 16, :end-line nil, :hash "2014983419"} {:id "def/steps", :kind "def", :line 41, :end-line nil, :hash "858576576"} {:id "def/handlers", :kind "def", :line 46, :end-line nil, :hash "-691902590"}]}
;; clj-mutate-manifest-end
