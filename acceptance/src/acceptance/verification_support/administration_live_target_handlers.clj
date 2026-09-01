(ns acceptance.verification-support.administration-live-target-handlers
  (:require [acceptance.steps.support :as support]))

(def ^:private bridge-task
  "unit:test/verification-contracts/administration-acceptance-dependencies-test.mjs")

(defonce ^:private verified? (atom false))

(defn- verify! []
  (when-not @verified?
    (let [result (support/verified-task-result
                  bridge-task
                  "node" "test/verification-contracts/administration-acceptance-dependencies-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Live-target administration dependency contract failed."
                       {:out (:out result) :err (:err result)})
      (reset! verified? true))))

(defn- administration-scenario? [world]
  (contains? (set (map #(str "Modular verification packs " %) (range 199 207)))
             (:acceptance/scenario-name world)))

(def handlers
  [{:pattern #"^.+$"
    :applies? administration-scenario?
    :handler (fn [world _example _captures] (verify!) world)}])
